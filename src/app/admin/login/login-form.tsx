"use client";

import { useActionState } from "react";
import { login } from "../actions";

const field =
  "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none transition focus:border-ink";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, {});

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-line bg-white p-6">
      <label className="grid gap-1 text-sm font-medium">
        Email
        <input name="email" type="email" required autoComplete="username" className={field} />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Password
        <input name="password" type="password" required autoComplete="current-password" className={field} />
      </label>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-soft disabled:opacity-60"
      >
        {pending ? "Masuk…" : "Masuk"}
      </button>
    </form>
  );
}
