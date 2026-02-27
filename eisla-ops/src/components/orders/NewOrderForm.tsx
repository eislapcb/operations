"use client";

import { useRouter } from "next/navigation";
import { createOrder } from "@/lib/actions/orders";
import Button from "@/components/ui/Button";

interface Customer {
  id: string;
  name: string | null;
  accountNumber: string;
  company: string | null;
}

export default function NewOrderForm({
  customers,
}: {
  customers: Customer[];
}) {
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const result = await createOrder(formData);
    if (result?.id) {
      router.push(`/ops/orders/${result.id}`);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow-sm border border-light">
      <div>
        <label htmlFor="customerId" className="block text-sm font-medium text-teal mb-1">
          Customer
        </label>
        <select
          name="customerId"
          id="customerId"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">-- Select customer --</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.accountNumber} — {c.name ?? c.company ?? "Unknown"}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-teal mb-1">
          Description
        </label>
        <textarea
          name="description"
          id="description"
          rows={3}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Project description..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="tier" className="block text-sm font-medium text-teal mb-1">
            Tier
          </label>
          <select
            name="tier"
            id="tier"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="T1">T1 — £499</option>
            <option value="T2">T2 — £599</option>
            <option value="T3">T3 — £749</option>
          </select>
        </div>

        <div>
          <label htmlFor="serviceLevel" className="block text-sm font-medium text-teal mb-1">
            Service Level
          </label>
          <select
            name="serviceLevel"
            id="serviceLevel"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="standard">Standard</option>
            <option value="priority">Priority (+£50)</option>
            <option value="express">Express (+£150)</option>
          </select>
        </div>
      </div>

      <Button type="submit">Create Order</Button>
    </form>
  );
}
