"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import { fetchDashboardStats } from "@/lib/api";

interface Trend { date: string; flagged: number; clean: number; total: number }

export default function AnalyticsPage() {
  const router = useRouter();
  const [trends, setTrends] = useState<Trend[]>([]);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!isLoggedIn()) router.replace("/login"); }, [router]);

  useEffect(() => {
    fetchDashboardStats().then((d) => {
      setStats(d);
      setTrends(d.daily_trends ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const maxTotal = Math.max(...trends.map((t) => t.total), 1);

  if (!isLoggedIn()) return null;

  return (
    <div className="flex min-h-screen bg-[#060b14]">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-8">
        <p className="text-xs uppercase tracking-widest text-slate-500">Insights</p>
        <h1 className="mt-1 mb-8 text-2xl font-bold text-white">Analytics</h1>

        {/* Summary pills */}
        {stats && (
          <div className="mb-8 flex flex-wrap gap-4">
            {[
              { label: "Total Invoices", val: stats.total_invoices?.toLocaleString("en-IN") },
              { label: "Flagged", val: stats.flagged_invoices?.toLocaleString("en-IN"), red: true },
              { label: "Clean", val: stats.clean_invoices?.toLocaleString("en-IN"), green: true },
              { label: "Accuracy", val: `${stats.accuracy_percent}%` },
            ].map((p) => (
              <div key={p.label} className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-3">
                <p className="text-xs text-slate-500">{p.label}</p>
                <p className={`text-xl font-bold ${p.red ? "text-red-400" : p.green ? "text-emerald-400" : "text-white"}`}>{p.val}</p>
              </div>
            ))}
          </div>
        )}

        {/* Bar chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-6 text-sm font-semibold text-white">14-Day Invoice Trend</h2>
          {loading ? (
            <div className="flex items-end gap-2 h-48">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="flex-1 rounded-t animate-pulse bg-slate-800" style={{ height: `${20 + Math.random() * 60}%` }} />
              ))}
            </div>
          ) : (
            <div className="flex items-end gap-1.5 h-48">
              {trends.map((t) => {
                const flagH = maxTotal > 0 ? (t.flagged / maxTotal) * 100 : 0;
                const cleanH = maxTotal > 0 ? (t.clean / maxTotal) * 100 : 0;
                return (
                  <div key={t.date} className="group relative flex flex-1 flex-col items-center gap-0.5">
                    <div className="flex w-full flex-col items-center gap-0.5 justify-end h-44">
                      <div className="w-full rounded-t-sm bg-red-500/70 transition-all" style={{ height: `${flagH}%` }} />
                      <div className="w-full rounded-t-sm bg-indigo-500/70 transition-all" style={{ height: `${cleanH}%` }} />
                    </div>
                    <p className="mt-1 text-[9px] text-slate-600 rotate-45 origin-left">{t.date.slice(5)}</p>
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col gap-1 rounded-lg border border-slate-700 bg-slate-800 p-2 text-xs text-white shadow-xl z-10 min-w-[100px]">
                      <p className="font-semibold">{t.date}</p>
                      <p className="text-red-400">Flagged: {t.flagged}</p>
                      <p className="text-indigo-400">Clean: {t.clean}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-500/70" />Flagged</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-indigo-500/70" />Clean</span>
          </div>
        </div>

        {/* Status breakdown donut (CSS) */}
        {stats && (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-4 text-sm font-semibold text-white">Status Breakdown</h2>
            <div className="flex items-center gap-8">
              <div className="relative h-36 w-36 shrink-0">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3" />
                  {(() => {
                    const total = (stats.total_invoices as number) || 1;
                    const clean = (stats.clean_invoices as number) || 0;
                    const flagged = (stats.flagged_invoices as number) || 0;
                    const circ = 100;
                    const cleanPct = (clean / total) * circ;
                    const flaggedPct = (flagged / total) * circ;
                    return (
                      <>
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#6366f1" strokeWidth="3" strokeDasharray={`${cleanPct} ${circ - cleanPct}`} strokeDashoffset="0" />
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray={`${flaggedPct} ${circ - flaggedPct}`} strokeDashoffset={`${-cleanPct}`} />
                      </>
                    );
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xl font-bold text-white">{stats.accuracy_percent}%</p>
                  <p className="text-[10px] text-slate-500">accuracy</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-indigo-500" /><span className="text-slate-300">Clean</span><span className="ml-auto font-semibold text-white">{(stats.clean_invoices as number)?.toLocaleString("en-IN")}</span></div>
                <div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-red-500" /><span className="text-slate-300">Flagged</span><span className="ml-auto font-semibold text-white">{(stats.flagged_invoices as number)?.toLocaleString("en-IN")}</span></div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
