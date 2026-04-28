"use client";

import { ChartLine, CurrencyInr, FileText, ShieldWarning, Users } from "@phosphor-icons/react/dist/ssr";

interface Stats {
  total_invoices: number;
  flagged_invoices: number;
  clean_invoices: number;
  total_batches: number;
  fraud_amount_inr: number;
  accuracy_percent: number;
  active_users: number;
}

const fmt = (n: number) => n.toLocaleString("en-IN");
const fmtCr = (n: number) => `₹${(n / 1e7).toFixed(2)} Cr`;

export default function StatsCards({ stats }: { stats: Stats }) {
  const cards = [
    {
      label: "Invoices Scanned",
      value: fmt(stats.total_invoices),
      icon: FileText,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
    },
    {
      label: "Threats Detected",
      value: fmt(stats.flagged_invoices),
      icon: ShieldWarning,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      label: "Fraud Prevented",
      value: fmtCr(stats.fraud_amount_inr),
      icon: CurrencyInr,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Detection Accuracy",
      value: `${stats.accuracy_percent}%`,
      icon: ChartLine,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Active Officers",
      value: fmt(stats.active_users),
      icon: Users,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      label: "Batches Processed",
      value: fmt(stats.total_batches),
      icon: FileText,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5"
        >
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.bg}`}>
            <c.icon size={20} className={c.color} weight="fill" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{c.value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
