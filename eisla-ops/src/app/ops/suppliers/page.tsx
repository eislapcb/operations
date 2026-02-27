import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { requireSession } from "@/lib/session";
import Section from "@/components/ui/Section";
import Badge from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  await requireSession();

  const allSuppliers = await db.select().from(suppliers);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-teal">Supplier Register</h1>

      {allSuppliers.length === 0 ? (
        <p className="text-sm text-gray-400">No suppliers registered</p>
      ) : (
        <div className="grid gap-4">
          {allSuppliers.map((s) => (
            <Section key={s.id} title={s.name}>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Type:</span> {s.type ?? "—"}
                </div>
                <div>
                  <span className="text-gray-500">Approved:</span>{" "}
                  <Badge
                    variant={
                      s.approved === "Yes"
                        ? "on_track"
                        : s.approved === "Conditional"
                          ? "at_risk"
                          : "overdue"
                    }
                  >
                    {s.approved ?? "—"}
                  </Badge>
                </div>
                <div />
                <div>
                  <span className="text-gray-500">Quality:</span>{" "}
                  {s.quality ?? "—"}
                </div>
                <div>
                  <span className="text-gray-500">Delivery:</span>{" "}
                  {s.delivery ?? "—"}
                </div>
                <div>
                  <span className="text-gray-500">Price:</span>{" "}
                  {s.price ?? "—"}
                </div>
                <div>
                  <span className="text-gray-500">Capability:</span>{" "}
                  {s.capability ?? "—"}
                </div>
                <div>
                  <span className="text-gray-500">Comms:</span>{" "}
                  {s.comms ?? "—"}
                </div>
              </div>
              {s.notes && (
                <p className="mt-2 text-xs text-gray-500">{s.notes}</p>
              )}
            </Section>
          ))}
        </div>
      )}
    </div>
  );
}
