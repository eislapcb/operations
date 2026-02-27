"use server";

import { db } from "@/db";
import { users, auditLog } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/session";
import { hashPassword, generatePassphrase, writeAuditLog } from "@/lib/auth";
import { headers } from "next/headers";

function getClientIp(hdrs: Headers): string | null {
  return (
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    null
  );
}

export async function inviteUser(formData: FormData) {
  const admin = await requireRole("admin");

  const name = formData.get("name") as string;
  const email = (formData.get("email") as string).toLowerCase();
  const role = formData.get("role") as string;

  if (!name || !email || !role) {
    throw new Error("All fields are required");
  }

  // Generate passphrase
  const passphrase = generatePassphrase();
  const hash = await hashPassword(passphrase);

  const [newUser] = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash: hash,
      role,
      active: true,
      mustChangePw: "true",
      inviteSentAt: new Date(),
      inviteSentBy: admin.id,
    })
    .returning({ id: users.id });

  const hdrs = await headers();
  const ip = getClientIp(hdrs);
  await writeAuditLog(admin.id, `user_invited: ${email} (${role})`, ip);

  // In production, send via Resend. For now, return the passphrase.
  revalidatePath("/ops/users");
  return { passphrase, userId: newUser.id };
}

export async function resendInvite(userId: string) {
  const admin = await requireRole("admin");

  const passphrase = generatePassphrase();
  const hash = await hashPassword(passphrase);

  await db
    .update(users)
    .set({
      passwordHash: hash,
      mustChangePw: "true",
      inviteSentAt: new Date(),
      inviteSentBy: admin.id,
    })
    .where(eq(users.id, userId));

  const hdrs = await headers();
  const ip = getClientIp(hdrs);
  await writeAuditLog(admin.id, `invite_resent: ${userId}`, ip);

  revalidatePath("/ops/users");
  return { passphrase };
}

export async function credentialReset(userId: string) {
  const admin = await requireRole("admin");

  const passphrase = generatePassphrase();
  const hash = await hashPassword(passphrase);

  await db
    .update(users)
    .set({
      passwordHash: hash,
      mustChangePw: "compromise",
      failedAttempts: 0,
      lockedUntil: null,
    })
    .where(eq(users.id, userId));

  const hdrs = await headers();
  const ip = getClientIp(hdrs);
  await writeAuditLog(admin.id, `credential_reset: ${userId}`, ip);

  revalidatePath("/ops/users");
  return { passphrase };
}

export async function updateUserDetails(userId: string, formData: FormData) {
  await requireRole("admin");

  await db
    .update(users)
    .set({
      name: formData.get("name") as string,
      email: (formData.get("email") as string).toLowerCase(),
      role: formData.get("role") as string,
      active: formData.get("active") === "true",
    })
    .where(eq(users.id, userId));

  revalidatePath("/ops/users");
}

export async function getUserAuditLog(userId: string) {
  return db
    .select()
    .from(auditLog)
    .where(eq(auditLog.userId, userId))
    .orderBy(desc(auditLog.createdAt))
    .limit(50);
}
