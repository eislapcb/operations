"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  hashPassword,
  verifyPassword,
  validatePassword,
  getUserByEmail,
  writeAuditLog,
  checkLockout,
  recordFailedAttempt,
  resetFailedAttempts,
} from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";

function getClientIp(hdrs: Headers): string | null {
  return (
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    null
  );
}

export type AuthResult = {
  success: boolean;
  error?: string;
  attemptsRemaining?: number;
};

// ─── Login ──────────────────────────────────────────────────────────
export async function login(
  _prevState: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const hdrs = await headers();
  const ip = getClientIp(hdrs);

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return { success: false, error: "Invalid email or password" };
  }

  if (!user.active) {
    return { success: false, error: "Account is deactivated" };
  }

  // Check lockout
  const lockout = await checkLockout(user.id);
  if (lockout.locked) {
    return {
      success: false,
      error: `Account locked. Try again in ${lockout.remainingMinutes} minutes.`,
    };
  }

  // Verify password
  if (!user.passwordHash) {
    return { success: false, error: "Invalid email or password" };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const result = await recordFailedAttempt(user.id, ip);
    if (result.locked) {
      await writeAuditLog(user.id, "login_failed_locked", ip);
      return {
        success: false,
        error: "Account locked due to too many failed attempts. Try again in 15 minutes.",
      };
    }
    await writeAuditLog(user.id, "login_failed", ip);
    return {
      success: false,
      error: "Invalid email or password",
      attemptsRemaining: result.attemptsRemaining,
    };
  }

  // Success — reset failed attempts, update last login
  await resetFailedAttempts(user.id);
  await db
    .update(users)
    .set({ lastLogin: new Date() })
    .where(eq(users.id, user.id));

  await writeAuditLog(user.id, "login_success", ip);

  // Sign into Supabase Auth session
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

  // If user doesn't exist in Supabase Auth yet (e.g. created with wrong keys), register them
  if (signInError) {
    const admin = await createServiceClient();
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    await supabase.auth.signInWithPassword({ email, password });
  }

  // Check if user must change password
  if (user.mustChangePw && user.mustChangePw !== "false") {
    redirect("/change-password");
  }

  // Route based on role
  if (user.role === "engineer") {
    redirect("/reviews");
  }
  redirect("/ops");
}

// ─── First-Time Setup (create initial admin) ───────────────────────
export async function setupAdmin(
  _prevState: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const hdrs = await headers();
  const ip = getClientIp(hdrs);

  if (!name || !email || !password) {
    return { success: false, error: "All fields are required" };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match" };
  }

  // NIST validation
  const validation = await validatePassword(password);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join(". ") };
  }

  // Check if any admin exists already
  const existingAdmins = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"));

  if (existingAdmins.length > 0) {
    return { success: false, error: "Admin account already exists" };
  }

  const hash = await hashPassword(password);

  // Create user in our DB
  await db.insert(users).values({
    name,
    email: email.toLowerCase(),
    passwordHash: hash,
    role: "admin",
    active: true,
    mustChangePw: "false",
    passwordSetAt: new Date(),
  });

  // Also create in Supabase Auth (admin API to skip email confirmation)
  const admin = await createServiceClient();
  await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  await writeAuditLog(null, `admin_account_created: ${email}`, ip);

  redirect("/login");
}

// ─── Change Password ────────────────────────────────────────────────
export async function changePassword(
  _prevState: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const userId = formData.get("userId") as string;
  const hdrs = await headers();
  const ip = getClientIp(hdrs);

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, error: "All fields are required" };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: "Passwords do not match" };
  }

  // NIST validation
  const validation = await validatePassword(newPassword);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join(". ") };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  if (!user || !user.passwordHash) {
    return { success: false, error: "User not found" };
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    return { success: false, error: "Current password is incorrect" };
  }

  const hash = await hashPassword(newPassword);

  await db
    .update(users)
    .set({
      passwordHash: hash,
      mustChangePw: "false",
      passwordSetAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Update Supabase Auth password too
  const supabase = await createClient();
  await supabase.auth.updateUser({ password: newPassword });

  await writeAuditLog(userId, "password_changed", ip);

  // Route based on role
  if (user.role === "engineer") {
    redirect("/reviews");
  }
  redirect("/ops");
}

// ─── Logout ─────────────────────────────────────────────────────────
export async function logout() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const hdrs = await headers();
    const ip = getClientIp(hdrs);

    // Find our DB user by email
    const dbUser = await getUserByEmail(user.email ?? "");
    if (dbUser) {
      await writeAuditLog(dbUser.id, "logout", ip);
    }
  }

  await supabase.auth.signOut();
  redirect("/login");
}
