import {
  getDashboardStats,
  getPipelineByStage,
  getTierMix,
  getSlaTable,
  getActivityFeed,
} from "@/lib/dashboard-queries";
import { getSenseCheckCount, getExceptionsCount } from "@/lib/queries";
import KPICards from "@/components/dashboard/KPICards";
import { PipelineChart, TierPieChart } from "@/components/dashboard/Charts";
import SLATable from "@/components/dashboard/SLATable";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import Section from "@/components/ui/Section";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, pipeline, tierMix, slaRows, activity, senseCount, exceptionsCount] =
    await Promise.all([
      getDashboardStats(),
      getPipelineByStage(),
      getTierMix(),
      getSlaTable(),
      getActivityFeed(),
      getSenseCheckCount(),
      getExceptionsCount(),
    ]);

  const overdueRows = slaRows.filter((r) => r.slaStatus === "overdue");
  const atRiskRows = slaRows.filter((r) => r.slaStatus === "at_risk");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-teal">Dashboard</h1>

      {/* SLA Alerts Banner */}
      {(overdueRows.length > 0 || atRiskRows.length > 0) && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          {overdueRows.length > 0 && (
            <p className="text-sm font-medium text-red-700">
              {overdueRows.length} order(s) OVERDUE:{" "}
              {overdueRows.map((r) => r.number).join(", ")}
            </p>
          )}
          {atRiskRows.length > 0 && (
            <p className="text-sm font-medium text-yellow-700">
              {atRiskRows.length} order(s) at risk:{" "}
              {atRiskRows.map((r) => r.number).join(", ")}
            </p>
          )}
        </div>
      )}

      {/* Sense Check + Exceptions Alerts */}
      {(senseCount > 0 || exceptionsCount > 0) && (
        <div className="flex gap-4">
          {senseCount > 0 && (
            <div className="flex-1 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              {senseCount} order(s) awaiting sense check
            </div>
          )}
          {exceptionsCount > 0 && (
            <div className="flex-1 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
              {exceptionsCount} unresolved exception(s)
            </div>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <KPICards stats={stats} />

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Pipeline by Stage">
          <PipelineChart data={pipeline} />
        </Section>
        <Section title="Tier Mix">
          <TierPieChart data={tierMix} />
        </Section>
      </div>

      {/* SLA Status Table */}
      <Section title="SLA Status (sorted worst-first)">
        <SLATable rows={slaRows} />
      </Section>

      {/* Activity Feed */}
      <Section title="Recent Activity">
        <ActivityFeed items={activity} />
      </Section>
    </div>
  );
}
