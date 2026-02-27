import { requireSession } from "@/lib/session";
import SearchClient from "@/components/SearchClient";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  await requireSession();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-teal">Search</h1>
      <SearchClient />
    </div>
  );
}
