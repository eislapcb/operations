import { db } from "@/db";
import { orders, orderAutoReview, orderFiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { REVIEW_CHECKLIST, FILE_LABELS } from "@/lib/constants";
import Section from "@/components/ui/Section";
import Badge from "@/components/ui/Badge";
import EngineerReviewForm from "@/components/orders/EngineerReviewForm";

export const dynamic = "force-dynamic";

export default async function EngineerReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireSession();

  // Anonymised view: only files + auto review, NO customer data, NO financials
  const [order] = await db
    .select({
      id: orders.id,
      number: orders.number,
      tier: orders.tier,
      stage: orders.stage,
    })
    .from(orders)
    .where(eq(orders.id, id));

  if (!order || order.stage !== "engineer_review") notFound();

  const [autoReview, files] = await Promise.all([
    db.select().from(orderAutoReview).where(eq(orderAutoReview.orderId, id)),
    db.select().from(orderFiles).where(eq(orderFiles.orderId, id)),
  ]);

  const checks = (autoReview[0]?.checks as any[]) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-teal">
          Review #{order.number.split("-").pop()}
        </h1>
        <Badge variant="copper">{order.tier}</Badge>
      </div>

      {/* Files */}
      <Section title="Files">
        {files.length === 0 ? (
          <p className="text-sm text-gray-400">No files</p>
        ) : (
          <div className="space-y-2">
            {files.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between rounded-md bg-light px-3 py-2 text-sm"
              >
                <span>
                  {FILE_LABELS[f.fileKey] ?? f.fileKey}{" "}
                  <span className="text-gray-400">v{f.version}</span>
                </span>
                {f.url && (
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-copper hover:underline text-xs"
                  >
                    Download
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Auto Review */}
      <Section title="Auto Review Results">
        {checks.length === 0 ? (
          <p className="text-sm text-gray-400">No auto review data</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {checks.map((check: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span
                  className={
                    check.result === "pass"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {check.result === "pass" ? "✓" : "✗"}
                </span>
                <span>{check.item ?? REVIEW_CHECKLIST[i]}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Submit Review */}
      <Section title="Submit Review">
        <EngineerReviewForm orderId={order.id} />
      </Section>
    </div>
  );
}
