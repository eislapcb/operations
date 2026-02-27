import StatCard from "@/components/ui/StatCard";
import type { DashboardStats } from "@/lib/dashboard-queries";

function formatPence(pence: number): string {
  return `£${(pence / 100).toLocaleString("en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export default function KPICards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Active Orders" value={stats.activeOrders} />
      <StatCard label="Customers" value={stats.totalCustomers} />
      <StatCard
        label="Revenue"
        value={formatPence(stats.revenue)}
        sub="Paid orders"
      />
      <StatCard
        label="Pipeline Value"
        value={formatPence(stats.pipelineValue)}
        sub="Unpaid active"
      />
      <StatCard
        label="SLA Compliance"
        value={`${stats.slaCompliance}%`}
        sub="Orders on track"
      />
      <StatCard
        label="Conversion Rate"
        value={`${stats.conversionRate}%`}
        sub="Quoted → Accepted"
      />
      <StatCard label="Open NCRs" value={stats.openNcrs} />
      <StatCard
        label="Avg Turnaround"
        value={`T1: ${stats.avgTurnaroundByTier.T1}`}
        sub={`T2: ${stats.avgTurnaroundByTier.T2} | T3: ${stats.avgTurnaroundByTier.T3}`}
      />
    </div>
  );
}
