import { db } from "@/db";
import { accessLog } from "@/db/schema";
import { headers } from "next/headers";

export async function logAccess(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string
): Promise<void> {
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    null;

  await db.insert(accessLog).values({
    userId,
    action,
    resourceType,
    resourceId,
    ip,
  });
}
