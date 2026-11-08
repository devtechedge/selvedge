import { notFound, redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "./session";
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