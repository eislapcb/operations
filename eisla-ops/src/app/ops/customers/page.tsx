import { db } from "@/db";
import { customers } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireSession } from "@/lib/session";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  await requireSession();

  const allCustomers = await db
    .select()
    .from(customers)
    .orderBy(desc(customers.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-teal">Customers</h1>
        <Link
          href="/ops/customers/new"
          className="rounded-md bg-copper px-4 py-2 text-sm font-medium text-white hover:bg-copper/90"
        >
          New Customer
        </Link>
      </div>

      <div className="rounded-lg bg-white shadow-sm border border-light overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-light text-left text-xs uppercase text-gray-500">
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {allCustomers.map((c) => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-cream/50">
                <td className="px-4 py-3">
                  <Link
                    href={`/ops/customers/${c.id}`}
                    className="font-medium text-copper hover:underline"
                  >
                    {c.accountNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">{c.name ?? "—"}</td>
                <td className="px-4 py-3">{c.company ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500">{c.email ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant={c.status === "Active" ? "on_track" : "default"}>
                    {c.status}
                  </Badge>
                </td>
              </tr>
            ))}
            {allCustomers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No customers yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
