import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireRole } from "@/lib/session";
import UsersClient from "@/components/UsersClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requireRole("admin");

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      mustChangePw: users.mustChangePw,
      lastLogin: users.lastLogin,
      lockedUntil: users.lockedUntil,
      createdAt: users.createdAt,
      inviteSentAt: users.inviteSentAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-teal">User Management</h1>
      <UsersClient users={allUsers} />
    </div>
  );
}
