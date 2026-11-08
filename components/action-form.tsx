"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/action-state";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

interface ActionFormProps {
  action: Action;
  submitLabel: string;
  pendingLabel?: string;
  buttonClassName?: string;
  className?: string;
  children: React.ReactNode;
}

export function ActionForm({
  action,
  submitLabel,
  pendingLabel = "Working...",
  buttonClassName = "button",
  className = "stack-form",
  children,
}: ActionFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className={className}>
      {children}
      <button type="submit" className={buttonClassName} disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </button>
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok && state.message ? (
        <p className="form-ok" role="status">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}