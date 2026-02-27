"use server";

import { db } from "@/db";
import { customers, consentLog } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { logAccess } from "@/lib/access-log";

// ─── Create Customer ────────────────────────────────────────────────
export async function createCustomer(formData: FormData) {
  const user = await requireSession();
  if (user.role !== "admin") throw new Error("Unauthorized");

  // Generate account number: CUST-NNNN
  const [countResult] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(customers);
  const seq = String((countResult?.value ?? 0) + 1).padStart(4, "0");
  const accountNumber = `CUST-${seq}`;

  const [newCustomer] = await db
    .insert(customers)
    .values({
      accountNumber,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      company: formData.get("company") as string,
      addr1: formData.get("addr1") as string,
      addr2: formData.get("addr2") as string,
      city: formData.get("city") as string,
      county: formData.get("county") as string,
      postcode: formData.get("postcode") as string,
      country: formData.get("country") as string,
      source: formData.get("source") as string,
    })
    .returning({ id: customers.id });

  revalidatePath("/ops/customers");
  return { id: newCustomer.id };
}

// ─── Update Customer ────────────────────────────────────────────────
export async function updateCustomer(customerId: string, formData: FormData) {
  const user = await requireSession();
  if (user.role !== "admin") throw new Error("Unauthorized");

  await db.execute(sql`SELECT set_config('app.current_user_id', ${user.id}, true)`);

  await db
    .update(customers)
    .set({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      company: formData.get("company") as string,
      addr1: formData.get("addr1") as string,
      addr2: formData.get("addr2") as string,
      city: formData.get("city") as string,
      county: formData.get("county") as string,
      postcode: formData.get("postcode") as string,
      country: formData.get("country") as string,
      source: formData.get("source") as string,
      notes: formData.get("notes") as string,
    })
    .where(eq(customers.id, customerId));

  revalidatePath(`/ops/customers/${customerId}`);
}

// ─── Toggle GDPR Consent ────────────────────────────────────────────
export async function toggleConsent(
  customerId: string,
  field: string,
  newValue: boolean
) {
  const user = await requireSession();
  if (user.role !== "admin") throw new Error("Unauthorized");

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId));
  if (!customer) throw new Error("Customer not found");

  // Get old value
  const oldValue = (customer as Record<string, unknown>)[field];

  // Update the consent field
  const dateField = `${field}Date` as string;
  await db
    .update(customers)
    .set({
      [field]: newValue,
      [dateField]: newValue ? new Date() : null,
    } as Record<string, unknown>)
    .where(eq(customers.id, customerId));

  // Log to consent_log
  await db.insert(consentLog).values({
    customerId,
    field,
    oldValue: String(oldValue ?? false),
    newValue: String(newValue),
    actor: user.name,
  });

  revalidatePath(`/ops/customers/${customerId}`);
}
