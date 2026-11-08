import { prisma } from "@/lib/db";
import { requireStudioRole } from "@/lib/auth";

export async function addLoom(input: {
  studioId: string;
  userId: string;
  name: string;
  shafts: number;
  treadles: number;
  reedWidthCm: number;
}): Promise<string> {
  await requireStudioRole(input.studioId, input.userId, ["MANAGER"]);
  const loom = await prisma.loom.create({
    data: {
      studioId: input.studioId,
      name: input.name,
      shafts: input.shafts,
      treadles: input.treadles,
      reedWidthCm: input.reedWidthCm,
      status: "AVAILABLE",
    },
  });
  await prisma.auditEvent.create({
    data: {
      studioId: input.studioId,
      actorId: input.userId,
      action: "loom.added",
      entityType: "loom",
      entityId: loom.id,
      detail: { name: input.name, shafts: input.shafts },
    },
  });
  return loom.id;
}