import { db } from "@/db";
import { ncrs } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireSession } from "@/lib/session";
import NCRList from "@/components/NCRList";

export const dynamic = "force-dynamic";

export default async function NCRsPage() {
  await requireSession();

  const allNcrs = await db.select().from(ncrs).orderBy(desc(ncrs.createdAt));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-teal">NCR Register</h1>
      <NCRList ncrs={allNcrs} />
    </div>
  );
}
