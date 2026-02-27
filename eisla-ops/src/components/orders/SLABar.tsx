import type { SlaStatus } from "@/lib/constants";

const BAR_COLORS: Record<SlaStatus, string> = {
  on_track: "bg-green-500",
  at_risk: "bg-yellow-500",
  overdue: "bg-red-500",
  complete: "bg-gray-400",
};

interface SLABarProps {
  percent: number;
  status: SlaStatus;
  targetHours: number;
  elapsedHours: number;
}

export default function SLABar({
  percent,
  status,
  targetHours,
  elapsedHours,
}: SLABarProps) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{elapsedHours.toFixed(1)}h elapsed</span>
        <span>{targetHours}h target</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all ${BAR_COLORS[status]}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
