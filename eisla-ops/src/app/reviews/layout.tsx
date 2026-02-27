import { requireSession } from "@/lib/session";
import { getBadgeCounts } from "@/lib/queries";
import Sidebar from "@/components/ui/Sidebar";

export const dynamic = "force-dynamic";

export default async function ReviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSession();

  // Admins/auditors can also access this, but engineers are restricted to reviews only
  const badges = await getBadgeCounts();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} badges={badges} />
      <main className="flex-1 overflow-y-auto bg-cream p-6">{children}</main>
    </div>
  );
}
