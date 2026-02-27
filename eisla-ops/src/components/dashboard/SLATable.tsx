import Link from "next/link";
import SLABadge from "@/components/orders/SLABadge";
import SLABar from "@/components/orders/SLABar";
import type { SlaTableRow } from "@/lib/dashboard-queries";

export default function SLATable({ rows }: { rows: SlaTableRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        No active orders
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase text-gray-500">
            <th className="pb-2 pr-4">Order</th>
            <th className="pb-2 pr-4">Customer</th>
            <th className="pb-2 pr-4">Stage</th>
            <th className="pb-2 pr-4">Tier</th>
            <th className="pb-2 pr-4">Service</th>
            <th className="pb-2 pr-4">SLA</th>
            <th className="pb-2 min-w-[120px]">Progress</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-gray-100">
              <td className="py-2 pr-4">
                <Link
                  href={`/ops/orders/${row.id}`}
                  className="font-medium text-copper hover:underline"
                >
                  {row.number}
                </Link>
              </td>
              <td className="py-2 pr-4 text-gray-600">
                {row.customerName ?? "-"}
              </td>
              <td className="py-2 pr-4">{row.stageLabel}</td>
              <td className="py-2 pr-4">{row.tier}</td>
              <td className="py-2 pr-4 capitalize">{row.serviceLevel}</td>
              <td className="py-2 pr-4">
                <SLABadge status={row.slaStatus} />
              </td>
              <td className="py-2">
                <SLABar
                  percent={row.slaPercent}
                  status={row.slaStatus}
                  targetHours={row.targetHours}
                  elapsedHours={row.elapsedHours}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
