import { prisma } from "@/lib/db";
import { DomainError, requireStudioRole } from "@/lib/auth";
import {
  defaultColorOrders,
  structureByName,
  validateGrids,
  type ColorOrders,
  type DraftGrids,
  type WeaveDimensions,
} from "@/domain/weave";
import type { Structure } from "@/domain/types";

interface DraftRow {
  shafts: number;
  treadles: number;
  ends: number;
  picks: number;
  threading: unknown;
  tieUp: unknown;
  treadling: unknown;
  warpColors: unknown;
  weftColors: unknown;
  settEpi: number;
  reedWidthCm: number;
  warpLengthCm: number;
  takeUpPct: number;
  shrinkagePct: number;
}

export function draftToGrids(d: DraftRow): DraftGrids {
  return {
    shafts: d.shafts,
    treadles: d.treadles,
    ends: d.ends,
    picks: d.picks,
    threading: d.threading as number[],
    tieUp: d.tieUp as boolean[][],
    treadling: d.treadling as number[],
  };
}

export function draftToColors(d: DraftRow): ColorOrders {
  return { warpColors: d.warpColors as string[], weftColors: d.weftColors as string[] };
}

export function draftToDims(d: DraftRow): WeaveDimensions {
  return {
    settEpi: d.settEpi,
    reedWidthCm: d.reedWidthCm,
    warpLengthCm: d.warpLengthCm,
    takeUpPct: d.takeUpPct,
    shrinkagePct: d.shrinkagePct,
  };
}

export interface CreateDraftInput extends WeaveDimensions {
  studioId: string;
  userId: string;
  name: string;
  structure: Structure;
  ends: number;
  picks: number;
}

export async function createDraft(input: CreateDraftInput): Promise<string> {
  await requireStudioRole(input.studioId, input.userId, ["WEAVER", "MANAGER"]);
  const grids = structureByName(input.structure, input.ends, input.picks);
  const colors = defaultColorOrders(input.ends, input.picks);
  const draft = await prisma.draft.create({
    data: {
      studioId: input.studioId,
      createdById: input.userId,
      name: input.name,
      shafts: grids.shafts,
      treadles: grids.treadles,
      ends: input.ends,
      picks: input.picks,
      threading: grids.threading,
      tieUp: grids.tieUp,
      treadling: grids.treadling,
      warpColors: colors.warpColors,
      weftColors: colors.weftColors,
      settEpi: input.settEpi,
      reedWidthCm: input.reedWidthCm,
      warpLengthCm: input.warpLengthCm,
      takeUpPct: input.takeUpPct,
      shrinkagePct: input.shrinkagePct,
      revision: 1,
    },
  });
  await prisma.auditEvent.create({
    data: {
      studioId: input.studioId,
      actorId: input.userId,
      action: "draft.created",
      entityType: "draft",
      entityId: draft.id,
      detail: { name: input.name, structure: input.structure },
    },
  });
  return draft.id;
}

export interface SaveDraftInput extends WeaveDimensions, ColorOrders, DraftGrids {
  studioId: string;
  userId: string;
  draftId: string;
  expectedRevision: number;
  name: string;
}

// Optimistic concurrency: the update only lands when the stored revision still
// matches the one the editor opened. A stale save affects zero rows and is
// rejected rather than silently overwriting a newer draft.
export async function saveDraft(input: SaveDraftInput): Promise<number> {
  await requireStudioRole(input.studioId, input.userId, ["WEAVER", "MANAGER"]);
  const issues = validateGrids(input);
  if (issues.length > 0) throw new DomainError(issues[0].message);
  if (input.warpColors.length !== input.ends) {
    throw new DomainError("The warp color order must cover every end.");
  }
  if (input.weftColors.length !== input.picks) {
    throw new DomainError("The weft color order must cover every pick.");
  }
  const nextRevision = input.expectedRevision + 1;
  const result = await prisma.draft.updateMany({
    where: { id: input.draftId, studioId: input.studioId, revision: input.expectedRevision },
    data: {
      name: input.name,
      shafts: input.shafts,
      treadles: input.treadles,
      ends: input.ends,
      picks: input.picks,
      threading: input.threading,
      tieUp: input.tieUp,
      treadling: input.treadling,
      warpColors: input.warpColors,
      weftColors: input.weftColors,
      settEpi: input.settEpi,
      reedWidthCm: input.reedWidthCm,
      warpLengthCm: input.warpLengthCm,
      takeUpPct: input.takeUpPct,
      shrinkagePct: input.shrinkagePct,
      revision: nextRevision,
    },
  });
  if (result.count === 0) {
    throw new DomainError("This draft changed since you opened it. Reload to see the latest version.");
  }
  return nextRevision;
}