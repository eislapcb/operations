"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { StageCount, TierCount } from "@/lib/dashboard-queries";

const TIER_COLORS: Record<string, string> = {
  T1: "#0E3D3F",
  T2: "#C27840",
  T3: "#E8F0F0",
};

export function PipelineChart({ data }: { data: StageCount[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#0E3D3F" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TierPieChart({ data }: { data: TierCount[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="tier"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, value }: any) => `${name}: ${value}`}
          >
            {data.map((entry) => (
              <Cell
                key={entry.tier}
                fill={TIER_COLORS[entry.tier] ?? "#ccc"}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
