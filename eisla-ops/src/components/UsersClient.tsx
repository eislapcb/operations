"use client";

import { useState } from "react";
import {
  inviteUser,
  resendInvite,
  credentialReset,
} from "@/lib/actions/users";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean | null;
  mustChangePw: string | null;
  lastLogin: Date | null;
  lockedUntil: Date | null;
  createdAt: Date | null;
  inviteSentAt: Date | null;
}

export default function UsersClient({ users }: { users: UserRow[] }) {
  const [showInvite, setShowInvite] = useState(false);
  const [passphrase, setPassphrase] = useState<string | null>(null);
  const [actionPassphrase, setActionPassphrase] = useState<string | null>(null);

  function getStatus(user: UserRow) {
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      return "locked";
    }
    if (
      user.mustChangePw &&
      user.mustChangePw !== "false" &&
      !user.lastLogin
    ) {
      return "invite_pending";
    }
    if (!user.active) return "inactive";
    return "active";
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "locked":
        return <Badge variant="overdue">Locked</Badge>;
      case "invite_pending":
        return <Badge variant="at_risk">Invite Pending</Badge>;
      case "inactive":
        return <Badge variant="default">Inactive</Badge>;
      default:
        return <Badge variant="on_track">Active</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={() => setShowInvite(!showInvite)}>
          {showInvite ? "Cancel" : "Invite User"}
        </Button>
      </div>

      {/* Passphrase display */}
      {(passphrase || actionPassphrase) && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
          <p className="text-sm font-medium text-yellow-800">
            Passphrase (share securely with the user):
          </p>
          <p className="mt-1 font-mono text-lg text-teal font-bold">
            {passphrase || actionPassphrase}
          </p>
          <p className="mt-1 text-xs text-yellow-600">
            This will not be shown again. The user must change it on first
            login.
          </p>
          <Button
            size="sm"
            variant="ghost"
            className="mt-2"
            onClick={() => {
              setPassphrase(null);
              setActionPassphrase(null);
            }}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Invite Form */}
      {showInvite && (
        <form
          action={async (fd) => {
            const result = await inviteUser(fd);
            setPassphrase(result.passphrase);
            setShowInvite(false);
          }}
          className="rounded-lg bg-white p-4 shadow-sm border border-light space-y-3"
        >
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-teal mb-1">
                Name
              </label>
              <input
                name="name"
                required
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-teal mb-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-teal mb-1">
                Role
              </label>
              <select
                name="role"
                required
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="admin">Admin</option>
                <option value="engineer">Engineer</option>
                <option value="auditor">Auditor</option>
              </select>
            </div>
          </div>
          <Button type="submit" size="sm">
            Send Invite
          </Button>
        </form>
      )}

      {/* Users Table */}
      <div className="rounded-lg bg-white shadow-sm border border-light overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-light text-left text-xs uppercase text-gray-500">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Login</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const status = getStatus(u);
              return (
                <tr key={u.id} className="border-b border-gray-50">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 capitalize">{u.role}</td>
                  <td className="px-4 py-3">{statusBadge(status)}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {u.lastLogin
                      ? new Date(u.lastLogin).toLocaleString("en-GB")
                      : "Never"}
                  </td>
                  <td className="px-4 py-3 space-x-1">
                    {status === "invite_pending" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          const result = await resendInvite(u.id);
                          setActionPassphrase(result.passphrase);
                        }}
                      >
                        Resend
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        const result = await credentialReset(u.id);
                        setActionPassphrase(result.passphrase);
                      }}
                    >
                      Reset
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
