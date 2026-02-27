"use client";

import { useActionState } from "react";
import { changePassword, type AuthResult } from "@/lib/actions/auth";
import PasswordField from "./PasswordField";

const initialState: AuthResult = { success: false };

interface Props {
  userId: string;
  isCompromise: boolean;
}

export default function ChangePasswordForm({ userId, isCompromise }: Props) {
  const [state, formAction, pending] = useActionState(
    changePassword,
    initialState
  );

  return (
    <form action={formAction} className="space-y-6">
      {isCompromise && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
          <strong>Security Alert:</strong> Your credentials have been reset by
          an administrator. You must set a new password before continuing.
        </div>
      )}

      {state.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <input type="hidden" name="userId" value={userId} />

      <PasswordField
        name="currentPassword"
        label="Current Password"
        autoComplete="current-password"
      />
      <PasswordField name="newPassword" label="New Password" showStrength />
      <PasswordField name="confirmPassword" label="Confirm New Password" />

      <p className="text-xs text-gray-500">
        Password must be 15-64 characters. No complexity requirements. Checked
        against known breached passwords.
      </p>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-copper px-4 py-2 text-sm font-medium text-white hover:bg-copper/90 disabled:opacity-50"
      >
        {pending ? "Updating..." : "Change Password"}
      </button>
    </form>
  );
}
