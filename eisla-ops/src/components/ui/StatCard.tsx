interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

export default function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm border border-light">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-teal">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}
