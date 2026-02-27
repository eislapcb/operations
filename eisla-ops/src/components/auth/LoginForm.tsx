"use client";

import { useActionState } from "react";
import { login, type AuthResult } from "@/lib/actions/auth";

const initialState: AuthResult = { success: false };

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {state.error}
          {state.attemptsRemaining !== undefined && (
            <span className="block mt-1 font-medium">
              {state.attemptsRemaining} attempt(s) remaining before lockout.
            </span>
          )}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-teal">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-copper focus:ring-copper"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-teal"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-copper focus:ring-copper"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-copper px-4 py-2 text-sm font-medium text-white hover:bg-copper/90 disabled:opacity-50"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
