import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { fetchActivity, fetchOverview } from "../services/api";
import type { ActivityPoint, OverviewStats } from "../types";

function StatCard({ label, value, delay = 0 }: { label: string; value: number; delay?: number }) {
  return (
    <div className="card card-hover animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-brand-400">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

export default function Analytics() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [activity, setActivity] = useState<ActivityPoint[]>([]);

  useEffect(() => {
    void (async () => {
      const [overview, points] = await Promise.all([fetchOverview(), fetchActivity(14)]);
      setStats(overview);
      setActivity(points.map((p) => ({ ...p, date: p.date.slice(5) }))); // MM-DD labels
    })();
  }, []);

  if (!stats) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton mt-3 h-4 w-56" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-[92px]" />
          ))}
        </div>
        <div className="skeleton mt-8 h-80" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <p className="mt-1 text-sm text-slate-400">Your workspace at a glance.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Documents" value={stats.total_documents} delay={0} />
        <StatCard label="Ready to query" value={stats.ready_documents} delay={70} />
        <StatCard label="Questions asked" value={stats.questions_asked} delay={140} />
        <StatCard label="Chunks indexed" value={stats.chunks_indexed} delay={210} />
      </div>

      <div className="card mt-8">
        <h2 className="mb-6 text-lg font-semibold">Activity — last 14 days</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "0.5rem",
                  color: "#e2e8f0",
                }}
              />
              <Legend />
              <Bar
                dataKey="documents_uploaded"
                name="Documents uploaded"
                fill="#f59e0b"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="questions_asked"
                name="Questions asked"
                fill="#38bdf8"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
