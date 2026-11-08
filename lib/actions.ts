import { ZodError } from "zod";
import { AuthorizationError, DomainError } from "./auth";
import type { ActionState } from "./action-state";

export function failure(error: unknown): ActionState {
  if (error instanceof ZodError) {
    return { error: error.issues[0]?.message ?? "Check the form and try again." };
  }
  if (error instanceof DomainError || error instanceof AuthorizationError) {
    return { error: error.message };
  }
  console.error(error);
  return { error: "Something went wrong. Try again." };
}

export function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}