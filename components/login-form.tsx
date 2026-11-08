"use client";

import { useActionState } from "react";
import { signIn } from "@/app/auth-actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, {});
  return (
    <form action={action} className="stack-form">
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label className="field">
        <span>Password</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      <button type="submit" className="button button--wide" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}