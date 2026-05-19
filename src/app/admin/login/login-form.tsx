"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, undefined);

  return (
    <form className="admin-login-card" action={formAction}>
      <div className="form-heading">
        <p className="admin-eyebrow">Admin Access</p>
        <h1>View booking requests</h1>
        <p>Enter the admin password to open the private bookings dashboard.</p>
      </div>

      <label>
        Password
        <input name="password" type="password" autoComplete="current-password" required />
      </label>

      <button type="submit" disabled={isPending}>
        {isPending ? "Signing in..." : "Open Dashboard"}
      </button>

      {state?.error ? <p className="status-message error">{state.error}</p> : null}
    </form>
  );
}
