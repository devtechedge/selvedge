import { notFound, redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "./session";
import { prisma } from "./db";
import type { Role } from "@/domain/types";
import { isRole } from "@/domain/types";

export interface StudioContext {
  user: SessionUser;
  userId: string;
  studioId: string;
  role: Role;
  studio: SessionUser["membership"]["studio"];
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireStudio(): Promise<StudioContext> {
  const user = await requireUser();
  const role = user.membership.role;
  if (!isRole(role)) notFound();
  return {
    user,
    userId: user.id,
    studioId: user.membership.studioId,
    role,
    studio: user.membership.studio,
  };
}

export function hasRole(role: Role, allowed: Role[]): boolean {
  return allowed.includes(role);
}

// Service-level role guard. The actions check the session role for a fast fail,
// and the services re-verify against the database so a forged or direct call
// cannot bypass the role. This is what the integration tests exercise.
export async function requireStudioRole(
  studioId: string,
  userId: string,
  allowed: Role[]
): Promise<Role> {
  const membership = await prisma.membership.findUnique({
    where: { studioId_userId: { studioId, userId } },
  });
  if (!membership || !isRole(membership.role)) {
    throw new AuthorizationError("You are not a member of this studio.");
  }
  if (!allowed.includes(membership.role)) {
    throw new AuthorizationError("Your role does not allow this action.");
  }
  return membership.role;
}

export function assertRole(role: Role, allowed: Role[]): void {
  if (!allowed.includes(role)) {
    throw new AuthorizationError("Your role does not allow this action.");
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}