import { prisma } from "@/lib/db";
import { DomainError, requireStudioRole } from "@/lib/auth";
import { checksumSnapshot } from "@/lib/checksum";

interface DraftSnapshotSource {
  name: string;
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

export type ReleaseSnapshot = {
  name: string;
  shafts: number;
  treadles: number;
  ends: number;
  picks: number;
  threading: number[];
  tieUp: boolean[][];
  treadling: number[];
  warpColors: string[];
  weftColors: string[];
  settEpi: number;
  reedWidthCm: number;
  warpLengthCm: number;
  takeUpPct: number;
  shrinkagePct: number;
};

export function releaseSnapshot(draft: DraftSnapshotSource): ReleaseSnapshot {
  return {
    name: draft.name,
    shafts: draft.shafts,
    treadles: draft.treadles,
    ends: draft.ends,
    picks: draft.picks,
    threading: draft.threading as number[],
    tieUp: draft.tieUp as boolean[][],
    treadling: draft.treadling as number[],
    warpColors: draft.warpColors as string[],
    weftColors: draft.weftColors as string[],
    settEpi: draft.settEpi,
    reedWidthCm: draft.reedWidthCm,
    warpLengthCm: draft.warpLengthCm,
    takeUpPct: draft.takeUpPct,
    shrinkagePct: draft.shrinkagePct,
  };
}

// Releases are only ever created, never updated. The version is monotonic per
// draft and the unique(draftId, version) index rejects a racing duplicate. The
// checksum is computed over canonical JSON so it survives a jsonb round-trip.
export async function releasePattern(input: {
  studioId: string;
  userId: string;
  draftId: string;
  name: string;
}): Promise<{ id: string; version: number; checksum: string }> {
  await requireStudioRole(input.studioId, input.userId, ["MANAGER"]);
  const draft = await prisma.draft.findFirst({
    where: { id: input.draftId, studioId: input.studioId },
  });
  if (!draft) throw new DomainError("That draft is not in your studio.");
  const last = await prisma.release.findFirst({
    where: { draftId: input.draftId },
    orderBy: { version: "desc" },
  });
  const version = (last?.version ?? 0) + 1;
  const snapshot = releaseSnapshot(draft);
  const checksum = checksumSnapshot(snapshot);
  const release = await prisma.release.create({
    data: {
      studioId: input.studioId,
      draftId: input.draftId,
      version,
      name: input.name,
      checksum,
      snapshot,
      createdById: input.userId,
    },
  });
  await prisma.auditEvent.create({
    data: {
      studioId: input.studioId,
      actorId: input.userId,
      action: "pattern.released",
      entityType: "release",
      entityId: release.id,
      detail: { version, checksum },
    },
  });
  return { id: release.id, version, checksum };
}

export function verifyRelease(release: { snapshot: unknown; checksum: string }): boolean {
  return checksumSnapshot(release.snapshot) === release.checksum;
}