import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users, auditLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PASSPHRASE_DICTIONARY } from "./constants";

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const SESSION_TIMEOUT_HOURS = 8;

// ─── Password Hashing ──────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── NIST Password Validation ──────────────────────────────────────
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export async function validatePassword(
  password: string
): Promise<PasswordValidationResult> {
  const errors: string[] = [];

  if (password.length < 15) {
    errors.push("Password must be at least 15 characters");
  }
  if (password.length > 64) {
    errors.push("Password must be at most 64 characters");
  }

  // HaveIBeenPwned check (k-anonymity model)
  const breached = await checkHaveIBeenPwned(password);
  if (breached) {
    errors.push(
      "This password has appeared in a data breach. Please choose a different one."
    );
  }

  return { valid: errors.length === 0, errors };
}

async function checkHaveIBeenPwned(password: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sha1 = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();

    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      { headers: { "Add-Padding": "true" } }
    );

    if (!response.ok) return false;

    const text = await response.text();
    const lines = text.split("\n");

    for (const line of lines) {
      const [hash, count] = line.trim().split(":");
      if (hash === suffix && parseInt(count, 10) > 0) {
        return true;
      }
    }

    return false;
  } catch {
    // If the API is unavailable, don't block the user
    return false;
  }
}

// ─── Password Strength Meter (length-based) ────────────────────────
export function passwordStrength(password: string): {
  score: number;
  label: string;
} {
  const len = password.length;
  if (len < 15) return { score: 0, label: "Too short" };
  if (len < 20) return { score: 1, label: "Fair" };
  if (len < 30) return { score: 2, label: "Good" };
  if (len < 40) return { score: 3, label: "Strong" };
  return { score: 4, label: "Very strong" };
}

// ─── Passphrase Generator ──────────────────────────────────────────
export function generatePassphrase(): string {
  const words: string[] = [];
  const array = new Uint32Array(4);
  crypto.getRandomValues(array);

  for (let i = 0; i < 4; i++) {
    const index = array[i] % PASSPHRASE_DICTIONARY.length;
    words.push(PASSPHRASE_DICTIONARY[index]);
  }

  return words.join("-");
}

// ─── Account Lockout ────────────────────────────────────────────────
export async function checkLockout(
  userId: string
): Promise<{ locked: boolean; remainingMinutes: number }> {
  const [user] = await db
    .select({ lockedUntil: users.lockedUntil, failedAttempts: users.failedAttempts })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) return { locked: false, remainingMinutes: 0 };

  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const remaining = Math.ceil(
      (new Date(user.lockedUntil).getTime() - Date.now()) / 60000
    );
    return { locked: true, remainingMinutes: remaining };
  }

  return { locked: false, remainingMinutes: 0 };
}

export async function recordFailedAttempt(
  userId: string,
  ip: string | null
): Promise<{ locked: boolean; attemptsRemaining: number }> {
  const [user] = await db
    .select({ failedAttempts: users.failedAttempts })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) return { locked: false, attemptsRemaining: 0 };

  const newCount = (user.failedAttempts ?? 0) + 1;

  if (newCount >= MAX_FAILED_ATTEMPTS) {
    const lockedUntil = new Date(
      Date.now() + LOCKOUT_MINUTES * 60 * 1000
    );
    await db
      .update(users)
      .set({ failedAttempts: newCount, lockedUntil })
      .where(eq(users.id, userId));

    await writeAuditLog(userId, "account_locked", ip);

    return { locked: true, attemptsRemaining: 0 };
  }

  await db
    .update(users)
    .set({ failedAttempts: newCount })
    .where(eq(users.id, userId));

  return {
    locked: false,
    attemptsRemaining: MAX_FAILED_ATTEMPTS - newCount,
  };
}

export async function resetFailedAttempts(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ failedAttempts: 0, lockedUntil: null })
    .where(eq(users.id, userId));
}

// ─── Audit Log ──────────────────────────────────────────────────────
export async function writeAuditLog(
  userId: string | null,
  event: string,
  ip: string | null
): Promise<void> {
  await db.insert(auditLog).values({
    userId,
    event,
    ip,
  });
}

// ─── Session Timeout ────────────────────────────────────────────────
export const SESSION_MAX_AGE = SESSION_TIMEOUT_HOURS * 60 * 60; // seconds

// ─── Get User by Email ─────────────────────────────────────────────
export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()));
  return user ?? null;
}

// ─── Get User by ID ────────────────────────────────────────────────
export async function getUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user ?? null;
}
