import { prisma } from "@/lib/db";
import { DomainError } from "@/lib/auth";
import { loomCanDress } from "@/domain/weave";
import { draftToGrids } from "./drafts";
import type { FinishingMethod } from "@/domain/types";

export async function createProject(input: {
  studioId: string;
  userId: string;
  draftId: string;
  name: string;
}): Promise<string> {
  const draft = await prisma.draft.findFirst({
    where: { id: input.draftId, studioId: input.studioId },
  });
  if (!draft) throw new DomainError("That draft is not in your studio.");
  const project = await prisma.project.create({
    data: {
      studioId: input.studioId,
      draftId: input.draftId,
      name: input.name,
      status: "WARP",
      picksWoven: 0,
      createdById: input.userId,
    },
  });
  await prisma.auditEvent.create({
    data: {
      studioId: input.studioId,
      actorId: input.userId,
      action: "project.created",
      entityType: "project",
      entityId: project.id,
      detail: { name: input.name },
    },
  });
  return project.id;
}

export async function assignLoom(input: {
  studioId: string;
  userId: string;
  projectId: string;
  loomId: string;
}): Promise<void> {
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, studioId: input.studioId },
    include: { draft: true },
  });
  if (!project) throw new DomainError("That project is not in your studio.");
  if (project.status === "FINISHED") throw new DomainError("A finished project cannot be re-dressed.");
  const loom = await prisma.loom.findFirst({
    where: { id: input.loomId, studioId: input.studioId },
  });
  if (!loom) throw new DomainError("That loom is not in your studio.");
  if (!loomCanDress(loom, draftToGrids(project.draft))) {
    throw new DomainError(
      `The ${loom.name} has ${loom.shafts} shafts and ${loom.treadles} treadles; this draft needs ${project.draft.shafts} shafts and ${project.draft.treadles} treadles.`
    );
  }
  if (loom.status !== "AVAILABLE") {
    throw new DomainError(`The ${loom.name} is already dressed. Finish or free it first.`);
  }
  await prisma.project.update({
    where: { id: project.id },
    data: { loomId: loom.id, status: "THREADED" },
  });
  await prisma.loom.update({ where: { id: loom.id }, data: { status: "DRESSED" } });
  await prisma.auditEvent.create({
    data: {
      studioId: input.studioId,
      actorId: input.userId,
      action: "project.dressed",
      entityType: "project",
      entityId: project.id,
      detail: { loomId: loom.id },
    },
  });
}

export async function advanceWeave(input: {
  studioId: string;
  userId: string;
  projectId: string;
  picks: number;
}): Promise<number> {
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, studioId: input.studioId },
    include: { draft: true },
  });
  if (!project) throw new DomainError("That project is not in your studio.");
  if (project.status !== "THREADED" && project.status !== "WEAVING") {
    throw new DomainError("Dress the loom before weaving, and finish before weaving again.");
  }
  const remaining = project.draft.picks - project.picksWoven;
  if (input.picks > remaining) {
    throw new DomainError(`Only ${remaining} picks remain in this warp; you asked to weave ${input.picks}.`);
  }
  const picksWoven = project.picksWoven + input.picks;
  await prisma.project.update({
    where: { id: project.id },
    data: { picksWoven, status: "WEAVING" },
  });
  return picksWoven;
}

export async function finishProject(input: {
  studioId: string;
  userId: string;
  projectId: string;
  method: FinishingMethod;
  measuredShrinkagePct: number;
  finalWidthCm: number;
  finalLengthCm: number;
  notes: string;
}): Promise<void> {
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, studioId: input.studioId },
  });
  if (!project) throw new DomainError("That project is not in your studio.");
  if (project.status !== "WEAVING") throw new DomainError("Weave the cloth before finishing it.");
  await prisma.finishingLog.create({
    data: {
      projectId: project.id,
      method: input.method,
      measuredShrinkagePct: input.measuredShrinkagePct,
      finalWidthCm: input.finalWidthCm,
      finalLengthCm: input.finalLengthCm,
      notes: input.notes,
      actorId: input.userId,
    },
  });
  await prisma.project.update({ where: { id: project.id }, data: { status: "FINISHED" } });
  if (project.loomId) {
    await prisma.loom.updateMany({
      where: { id: project.loomId, studioId: input.studioId },
      data: { status: "AVAILABLE" },
    });
  }
  await prisma.auditEvent.create({
    data: {
      studioId: input.studioId,
      actorId: input.userId,
      action: "project.finished",
      entityType: "project",
      entityId: project.id,
      detail: { method: input.method, finalWidthCm: input.finalWidthCm },
    },
  });
}