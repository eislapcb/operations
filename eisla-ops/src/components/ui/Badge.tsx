import type { SlaStatus } from "@/lib/constants";

const SLA_COLORS: Record<SlaStatus, string> = {
  on_track: "bg-green-100 text-green-800",
  at_risk: "bg-yellow-100 text-yellow-800",
  overdue: "bg-red-100 text-red-800",
  complete: "bg-gray-100 text-gray-600",
};

interface BadgeProps {
  variant?: SlaStatus | "default" | "copper";
  children: React.ReactNode;
}

export default function Badge({ variant = "default", children }: BadgeProps) {
  const colorClass =
    variant === "copper"
      ? "bg-copper/10 text-copper"
      : variant === "default"
        ? "bg-light text-teal"
        : SLA_COLORS[variant];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {children}
    </span>
  );
}
