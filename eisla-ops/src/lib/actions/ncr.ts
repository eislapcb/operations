"use server";

import { db } from "@/db";
import { ncrs } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";

export async function createNcr(formData: FormData) {
  const user = await requireSession();
  if (user.role !== "admin") throw new Error("Unauthorized");

  const [countResult] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(ncrs);
  const seq = String((countResult?.value ?? 0) + 1).padStart(4, "0");
  const number = `NCR-${seq}`;

  await db.insert(ncrs).values({
    number,
    date: formData.get("date") as string || new Date().toISOString().split("T")[0],
    severity: formData.get("severity") as string,
    description: formData.get("description") as string,
    raisedBy: user.name,
  });

  revalidatePath("/ops/ncrs");
}

export async function updateNcrStatus(ncrId: string, status: string) {
  const user = await requireSession();
  if (user.role !== "admin") throw new Error("Unauthorized");

  await db.update(ncrs).set({ status }).where(eq(ncrs.id, ncrId));
  revalidatePath("/ops/ncrs");
}
