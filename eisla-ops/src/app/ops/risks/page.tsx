import { db } from "@/db";
import { risks } from "@/db/schema";
import { requireSession } from "@/lib/session";
import Badge from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

const LIKELIHOOD_LABELS = ["", "Rare", "Unlikely", "Possible", "Likely", "Almost Certain"];
const IMPACT_LABELS = ["", "Negligible", "Minor", "Moderate", "Major", "Catastrophic"];

function riskScore(l: number, i: number) {
  return l * i;
}

function riskColor(score: number) {
  if (score >= 15) return "overdue" as const;
  if (score >= 8) return "at_risk" as const;
  return "on_track" as const;
}

export default async function RisksPage() {
  await requireSession();

  const allRisks = await db.select().from(risks);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-teal">Risk Register</h1>

      {/* Risk Matrix */}
      <div className="rounded-lg bg-white p-6 shadow-sm border border-light">
        <h2 className="text-sm font-semibold text-teal mb-4">
          Likelihood x Impact Matrix
        </h2>
        <div className="grid grid-cols-6 gap-1 text-xs text-center">
          <div />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="font-medium text-gray-500 py-1">
              {IMPACT_LABELS[i]}
            </div>
          ))}
          {[5, 4, 3, 2, 1].map((l) => (
            <>
              <div key={`l-${l}`} className="font-medium text-gray-500 py-2">
                {LIKELIHOOD_LABELS[l]}
              </div>
              {[1, 2, 3, 4, 5].map((i) => {
                const score = l * i;
                const risksInCell = allRisks.filter(
                  (r) => r.likelihood === l && r.impact === i
                );
                return (
                  <div
                    key={`${l}-${i}`}
                    className={`rounded p-1 ${
                      score >= 15
                        ? "bg-red-100"
                        : score >= 8
                          ? "bg-yellow-100"
                          : "bg-green-100"
                    }`}
                  >
                    {risksInCell.map((r) => (
                      <span key={r.id} className="block font-medium">
                        {r.id}
                      </span>
                    ))}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      {/* Risk List */}
      <div className="rounded-lg bg-white shadow-sm border border-light overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-light text-left text-xs uppercase text-gray-500">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">L × I</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Mitigation</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {allRisks.map((r) => {
              const score = riskScore(r.likelihood ?? 0, r.impact ?? 0);
              return (
                <tr key={r.id} className="border-b border-gray-50">
                  <td className="px-4 py-3 font-medium">{r.id}</td>
                  <td className="px-4 py-3 max-w-xs">{r.description}</td>
                  <td className="px-4 py-3">{r.category}</td>
                  <td className="px-4 py-3">
                    {r.likelihood} × {r.impact}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={riskColor(score)}>{score}</Badge>
                  </td>
                  <td className="px-4 py-3 max-w-xs text-xs">
                    {r.mitigation}
                  </td>
                  <td className="px-4 py-3">{r.owner}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={r.status === "Active" ? "at_risk" : "on_track"}
                    >
                      {r.status}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
