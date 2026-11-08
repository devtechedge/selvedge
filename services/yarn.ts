import { prisma, TX_OPTIONS } from "@/lib/db";
import { DomainError, requireStudioRole } from "@/lib/auth";
import type { ReservationReason } from "@/domain/types";

export interface ReserveYarnInput {
  studioId: string;
  userId: string;
  projectId: string;
  yarnLotId: string;
  lengthM: number;
  reason: ReservationReason;
}

// Atomic reservation. The conditional updateMany takes a row lock and only
// decrements when on-hand covers the draw. Under READ COMMITTED a concurrent
// draw waits for the lock, then re-evaluates the WHERE against the new value, so
// two projects can never overdraw one dye lot. The CHECK lengthOnHandM >= 0 is
// the final database backstop.
export async function reserveYarn(input: ReserveYarnInput): Promise<void> {
  await requireStudioRole(input.studioId, input.userId, ["WEAVER", "MANAGER"]);
  await prisma.$transaction(async (tx) => {
    const project = await tx.project.findFirst({
      where: { id: input.projectId, studioId: input.studioId },
    });
    if (!project) throw new DomainError("That project is not in your studio.");
    const lot = await tx.yarnLot.findFirst({
      where: { id: input.yarnLotId, studioId: input.studioId },
    });
    if (!lot) throw new DomainError("That dye lot is not in your studio.");

    const drawn = await tx.yarnLot.updateMany({
      where: { id: input.yarnLotId, studioId: input.studioId, lengthOnHandM: { gte: input.lengthM } },
      data: { lengthOnHandM: { decrement: input.lengthM } },
    });
    if (drawn.count === 0) {
      throw new DomainError(
        `Not enough ${lot.colorName} (lot ${lot.lotNumber}) for this draw: ${input.lengthM} m needed, ${lot.lengthOnHandM} m on hand.`
      );
    }
    await tx.reservation.create({
      data: {
        studioId: input.studioId,
        projectId: input.projectId,
        yarnLotId: input.yarnLotId,
        lengthM: input.lengthM,
        reason: input.reason,
        actorId: input.userId,
      },
    });
    await tx.auditEvent.create({
      data: {
        studioId: input.studioId,
        actorId: input.userId,
        action: "yarn.reserved",
        entityType: "reservation",
        entityId: input.projectId,
        detail: { yarnLotId: input.yarnLotId, lengthM: input.lengthM, reason: input.reason },
      },
    });
  }, TX_OPTIONS);
}

export interface AddYarnLotInput {
  studioId: string;
  userId: string;
  code: string;
  name: string;
  fiber: string;
  dyeRecipe: string;
  colorName: string;
  colorHex: string;
  lengthOnHandM: number;
  reorderM: number;
  lotNumber: string;
}

export async function addYarnLot(input: AddYarnLotInput): Promise<string> {
  await requireStudioRole(input.studioId, input.userId, ["DYER", "MANAGER"]);
  const existing = await prisma.yarnLot.findUnique({
    where: { studioId_code: { studioId: input.studioId, code: input.code } },
  });
  if (existing) throw new DomainError(`Code ${input.code} is already in the yarn library.`);
  const lot = await prisma.yarnLot.create({
    data: {
      studioId: input.studioId,
      code: input.code,
      name: input.name,
      fiber: input.fiber,
      dyeRecipe: input.dyeRecipe,
      colorName: input.colorName,
      colorHex: input.colorHex,
      lengthOnHandM: input.lengthOnHandM,
      reorderM: input.reorderM,
      lotNumber: input.lotNumber,
      active: true,
    },
  });
  await prisma.auditEvent.create({
    data: {
      studioId: input.studioId,
      actorId: input.userId,
      action: "yarn.added",
      entityType: "yarn_lot",
      entityId: lot.id,
      detail: { code: input.code, lengthOnHandM: input.lengthOnHandM },
    },
  });
  return lot.id;
}

export async function recordIntake(input: {
  studioId: string;
  userId: string;
  yarnLotId: string;
  meters: number;
}): Promise<void> {
  await requireStudioRole(input.studioId, input.userId, ["DYER", "MANAGER"]);
  const result = await prisma.yarnLot.updateMany({
    where: { id: input.yarnLotId, studioId: input.studioId },
    data: { lengthOnHandM: { increment: input.meters } },
  });
  if (result.count === 0) throw new DomainError("That dye lot is not in your studio.");
  await prisma.auditEvent.create({
    data: {
      studioId: input.studioId,
      actorId: input.userId,
      action: "yarn.intake",
      entityType: "yarn_lot",
      entityId: input.yarnLotId,
      detail: { meters: input.meters },
    },
  });
}