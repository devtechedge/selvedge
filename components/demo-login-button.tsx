"use client";

import { useActionState } from "react";
import { demoSignIn } from "@/app/auth-actions";

interface DemoLoginButtonProps {
  email: string;
  name: string;
  role: string;
  blurb: string;
}

export function DemoLoginButton({ email, name, role, blurb }: DemoLoginButtonProps) {
  const [state, action, pending] = useActionState(demoSignIn, {});
  return (
    <form action={action}>
      <input type="hidden" name="email" value={email} />
      <button type="submit" className="demo-card" disabled={pending}>
        <span className="demo-card__role">{role}</span>
        <span className="demo-card__name">{pending ? "Opening the studio..." : name}</span>
        <span className="demo-card__blurb">{blurb}</span>
      </button>
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}