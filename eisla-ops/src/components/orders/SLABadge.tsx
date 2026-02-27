import Badge from "@/components/ui/Badge";
import type { SlaStatus } from "@/lib/constants";

const LABELS: Record<SlaStatus, string> = {
  on_track: "On Track",
  at_risk: "At Risk",
  overdue: "OVERDUE",
  complete: "Complete",
};

interface SLABadgeProps {
  status: SlaStatus;
}

export default function SLABadge({ status }: SLABadgeProps) {
  return <Badge variant={status}>{LABELS[status]}</Badge>;
}
