"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { issueSession, clearSession } from "@/lib/session";
import { emailSchema, passwordSchema } from "@/validation/schemas";
import { failure } from "@/lib/actions";
import { isDemoEmail } from "@/lib/demo";
import { env } from "@/lib/env";
import type { ActionState } from "@/lib/action-state";

export async function signIn(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const email = emailSchema.parse(formData.get("email"));
    const password = passwordSchema.parse(formData.get("password"));
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { error: "That email or password is not right." };
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return { error: "That email or password is not right." };
    await issueSession(user.id);
  } catch (error) {
    return failure(error);
  }
  redirect("/studio");
}

export async function demoSignIn(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (!env.demoMode) return { error: "Demo sign-in is turned off." };
  const email = String(formData.get("email") ?? "").toLowerCase();
  if (!isDemoEmail(email)) return { error: "Unknown demo account." };
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { error: "The demo studio is not seeded yet." };
    await issueSession(user.id);
  } catch (error) {
    return failure(error);
  }
  redirect("/studio");
}

export async function signOut(): Promise<void> {
  await clearSession();
  redirect("/login");
}