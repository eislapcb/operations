import { db } from "@/db";
import { customers } from "@/db/schema";
import { requireRole } from "@/lib/session";
import NewOrderForm from "@/components/orders/NewOrderForm";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  await requireRole("admin");

  const allCustomers = await db
    .select({
      id: customers.id,
      name: customers.name,
      accountNumber: customers.accountNumber,
      company: customers.company,
    })
    .from(customers);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-teal">New Order</h1>
      <NewOrderForm customers={allCustomers} />
    </div>
  );
}
