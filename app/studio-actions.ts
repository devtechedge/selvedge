"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertRole, requireStudio } from "@/lib/auth";
import { failure, field } from "@/lib/actions";
import type { ActionState } from "@/lib/action-state";
import {
  assignLoomSchema,
  createDraftSchema,
  createProjectSchema,
  finishSchema,
  intakeSchema,
  loomSchema,
  releaseSchema,
  reserveYarnSchema,
  roleSchema,
  saveDraftSchema,
  weaveSchema,
  yarnLotSchema,
} from "@/validation/schemas";
import { createDraft, saveDraft } from "@/services/drafts";
import { addYarnLot, recordIntake, reserveYarn } from "@/services/yarn";
import { advanceWeave, assignLoom, createProject, finishProject } from "@/services/projects";
import { releasePattern } from "@/services/releases";
import { addLoom } from "@/services/looms";
import { changeRole } from "@/services/memberships";

const STUDIO_PATHS = ["/studio", "/drafts", "/yarn", "/looms", "/projects", "/releases", "/team"];

function revalidateStudio(): void {
  for (const path of STUDIO_PATHS) revalidatePath(path);
}

function parseJson(formData: FormData, name: string): unknown {
  const raw = field(formData, name);
  if (!raw) return [];
  return JSON.parse(raw);
}

export async function createDraftAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  let draftId = "";
  try {
    const context = await requireStudio();
    assertRole(context.role, ["WEAVER", "MANAGER"]);
    const input = createDraftSchema.parse({
      name: field(formData, "name"),
      structure: field(formData, "structure"),
      ends: field(formData, "ends"),
      picks: field(formData, "picks"),
      settEpi: field(formData, "settEpi"),
      reedWidthCm: field(formData, "reedWidthCm"),
      warpLengthCm: field(formData, "warpLengthCm"),
      takeUpPct: field(formData, "takeUpPct"),
      shrinkagePct: field(formData, "shrinkagePct"),
    });
    draftId = await createDraft({ ...input, studioId: context.studioId, userId: context.userId });
  } catch (error) {
    return failure(error);
  }
  revalidateStudio();
  redirect(`/drafts/${draftId}`);
}

export async function saveDraftAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const context = await requireStudio();
    assertRole(context.role, ["WEAVER", "MANAGER"]);
    let grids: unknown;
    try {
      grids = {
        threading: parseJson(formData, "threading"),
        tieUp: parseJson(formData, "tieUp"),
        treadling: parseJson(formData, "treadling"),
        warpColors: parseJson(formData, "warpColors"),
        weftColors: parseJson(formData, "weftColors"),
      };
    } catch {
      return { error: "The draft could not be read. Reload the page." };
    }
    const g = grids as Record<string, unknown>;
    const input = saveDraftSchema.parse({
      draftId: field(formData, "draftId"),
      expectedRevision: field(formData, "expectedRevision"),
      name: field(formData, "name"),
      shafts: field(formData, "shafts"),
      treadles: field(formData, "treadles"),
      ends: field(formData, "ends"),
      picks: field(formData, "picks"),
      threading: g.threading,
      tieUp: g.tieUp,
      treadling: g.treadling,
      warpColors: g.warpColors,
      weftColors: g.weftColors,
      settEpi: field(formData, "settEpi"),
      reedWidthCm: field(formData, "reedWidthCm"),
      warpLengthCm: field(formData, "warpLengthCm"),
      takeUpPct: field(formData, "takeUpPct"),
      shrinkagePct: field(formData, "shrinkagePct"),
    });
    const revision = await saveDraft({ ...input, studioId: context.studioId, userId: context.userId });
    revalidateStudio();
    revalidatePath(`/drafts/${input.draftId}`);
    return { ok: true, message: "Draft saved.", revision };
  } catch (error) {
    return failure(error);
  }
}

export async function reserveYarnAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const context = await requireStudio();
    assertRole(context.role, ["WEAVER", "MANAGER"]);
    const input = reserveYarnSchema.parse({
      projectId: field(formData, "projectId"),
      yarnLotId: field(formData, "yarnLotId"),
      lengthM: field(formData, "lengthM"),
      reason: field(formData, "reason"),
    });
    await reserveYarn({ ...input, studioId: context.studioId, userId: context.userId });
    revalidateStudio();
    revalidatePath(`/projects/${input.projectId}`);
    return { ok: true, message: `Reserved ${input.lengthM} m from the dye lot.` };
  } catch (error) {
    return failure(error);
  }
}

export async function addYarnLotAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const context = await requireStudio();
    assertRole(context.role, ["DYER", "MANAGER"]);
    const input = yarnLotSchema.parse({
      code: field(formData, "code"),
      name: field(formData, "name"),
      fiber: field(formData, "fiber"),
      dyeRecipe: field(formData, "dyeRecipe"),
      colorName: field(formData, "colorName"),
      colorHex: field(formData, "colorHex"),
      lengthOnHandM: field(formData, "lengthOnHandM"),
      reorderM: field(formData, "reorderM"),
      lotNumber: field(formData, "lotNumber"),
    });
    await addYarnLot({ ...input, studioId: context.studioId, userId: context.userId });
    revalidateStudio();
    return { ok: true, message: "Dye lot added to the yarn library." };
  } catch (error) {
    return failure(error);
  }
}

export async function intakeAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const context = await requireStudio();
    assertRole(context.role, ["DYER", "MANAGER"]);
    const input = intakeSchema.parse({
      yarnLotId: field(formData, "yarnLotId"),
      meters: field(formData, "meters"),
    });
    await recordIntake({ ...input, studioId: context.studioId, userId: context.userId });
    revalidateStudio();
    return { ok: true, message: `Intake recorded: ${input.meters} m.` };
  } catch (error) {
    return failure(error);
  }
}

export async function createProjectAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  let projectId = "";
  try {
    const context = await requireStudio();
    assertRole(context.role, ["WEAVER", "MANAGER"]);
    const input = createProjectSchema.parse({
      draftId: field(formData, "draftId"),
      name: field(formData, "name"),
    });
    projectId = await createProject({ ...input, studioId: context.studioId, userId: context.userId });
  } catch (error) {
    return failure(error);
  }
  revalidateStudio();
  redirect(`/projects/${projectId}`);
}

export async function assignLoomAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const context = await requireStudio();
    assertRole(context.role, ["WEAVER", "MANAGER"]);
    const input = assignLoomSchema.parse({
      projectId: field(formData, "projectId"),
      loomId: field(formData, "loomId"),
    });
    await assignLoom({ ...input, studioId: context.studioId, userId: context.userId });
    revalidateStudio();
    revalidatePath(`/projects/${input.projectId}`);
    return { ok: true, message: "Loom dressed and ready to weave." };
  } catch (error) {
    return failure(error);
  }
}

export async function weaveAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const context = await requireStudio();
    assertRole(context.role, ["WEAVER", "MANAGER"]);
    const input = weaveSchema.parse({
      projectId: field(formData, "projectId"),
      picks: field(formData, "picks"),
    });
    const picksWoven = await advanceWeave({ ...input, studioId: context.studioId, userId: context.userId });
    revalidateStudio();
    revalidatePath(`/projects/${input.projectId}`);
    return { ok: true, message: `Wove ${input.picks} picks. ${picksWoven} picks total.` };
  } catch (error) {
    return failure(error);
  }
}

export async function finishAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const context = await requireStudio();
    assertRole(context.role, ["WEAVER", "MANAGER"]);
    const input = finishSchema.parse({
      projectId: field(formData, "projectId"),
      method: field(formData, "method"),
      measuredShrinkagePct: field(formData, "measuredShrinkagePct"),
      finalWidthCm: field(formData, "finalWidthCm"),
      finalLengthCm: field(formData, "finalLengthCm"),
      notes: field(formData, "notes"),
    });
    await finishProject({ ...input, studioId: context.studioId, userId: context.userId });
    revalidateStudio();
    revalidatePath(`/projects/${input.projectId}`);
    return { ok: true, message: "Cloth finished and the loom freed." };
  } catch (error) {
    return failure(error);
  }
}

export async function releaseAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const context = await requireStudio();
    assertRole(context.role, ["MANAGER"]);
    const input = releaseSchema.parse({
      draftId: field(formData, "draftId"),
      name: field(formData, "name"),
    });
    const release = await releasePattern({ ...input, studioId: context.studioId, userId: context.userId });
    revalidateStudio();
    return { ok: true, message: `Released version ${release.version}.`, link: "/releases" };
  } catch (error) {
    return failure(error);
  }
}

export async function addLoomAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const context = await requireStudio();
    assertRole(context.role, ["MANAGER"]);
    const input = loomSchema.parse({
      name: field(formData, "name"),
      shafts: field(formData, "shafts"),
      treadles: field(formData, "treadles"),
      reedWidthCm: field(formData, "reedWidthCm"),
    });
    await addLoom({ ...input, studioId: context.studioId, userId: context.userId });
    revalidateStudio();
    return { ok: true, message: "Loom added to the board." };
  } catch (error) {
    return failure(error);
  }
}

export async function changeRoleAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const context = await requireStudio();
    assertRole(context.role, ["MANAGER"]);
    const input = roleSchema.parse({
      membershipId: field(formData, "membershipId"),
      role: field(formData, "role"),
    });
    await changeRole({ ...input, studioId: context.studioId, actorId: context.userId });
    revalidateStudio();
    return { ok: true, message: "Role updated." };
  } catch (error) {
    return failure(error);
  }
}