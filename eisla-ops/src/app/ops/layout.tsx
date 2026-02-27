import { requireSession } from "@/lib/session";
import { getBadgeCounts } from "@/lib/queries";
import { redirect } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";

export const dynamic = "force-dynamic";

export default async function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSession();

  // Engineers can only access the reviews portal
  if (user.role === "engineer") {
    redirect("/reviews");
  }

  const badges = await getBadgeCounts();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} badges={badges} />
      <main className="flex-1 overflow-y-auto bg-cream p-6">{children}</main>
    </div>
  );
}
