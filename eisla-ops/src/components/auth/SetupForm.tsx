"use client";

import { useActionState } from "react";
import { setupAdmin, type AuthResult } from "@/lib/actions/auth";
import PasswordField from "./PasswordField";

const initialState: AuthResult = { success: false };

export default function SetupForm() {
  const [state, formAction, pending] = useActionState(setupAdmin, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-teal">
          Full Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-copper focus:ring-copper"
        />
      </div>

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

      <PasswordField name="password" label="Password" showStrength />
      <PasswordField name="confirmPassword" label="Confirm Password" />

      <p className="text-xs text-gray-500">
        Password must be 15-64 characters. No complexity requirements. Checked
        against known breached passwords.
      </p>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-copper px-4 py-2 text-sm font-medium text-white hover:bg-copper/90 disabled:opacity-50"
      >
        {pending ? "Creating account..." : "Create Admin Account"}
      </button>
    </form>
  );
}
