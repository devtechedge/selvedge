import { prisma } from "@/lib/db";
import { DomainError, requireStudioRole } from "@/lib/auth";
import type { Role } from "@/domain/types";

export async function changeRole(input: {
  studioId: string;
  actorId: string;
  membershipId: string;
  role: Role;
}): Promise<void> {
  await requireStudioRole(input.studioId, input.actorId, ["MANAGER"]);
  const result = await prisma.membership.updateMany({
    where: { id: input.membershipId, studioId: input.studioId },
    data: { role: input.role },
  });
  if (result.count === 0) throw new DomainError("That member is not in your studio.");
  await prisma.auditEvent.create({
    data: {
      studioId: input.studioId,
      actorId: input.actorId,
      action: "member.role_changed",
      entityType: "membership",
      entityId: input.membershipId,
      detail: { role: input.role },
    },
  });
}