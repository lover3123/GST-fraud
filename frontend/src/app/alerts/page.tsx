"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import { fetchInvoices, InvoiceRecord } from "@/lib/api";

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!isLoggedIn()) router.replace("/login"); }, [router]);

  useEffect(() => {
    fetchInvoices().then((d) => {
      setAlerts(d.items.filter((i) => i.status === "FLAGGED").sort((a, b) => b.riskScore - a.riskScore));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (!isLoggedIn()) return null;

  const severityColor = (score: number) => score >= 0.7 ? "text-red-400 bg-red-500/10 border-red-500/30" : score >= 0.4 ? "text-amber-400 bg-amber-500/10 border-amber-500/30" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  const severityLabel = (score: number) => score >= 0.7 ? "HIGH" : score >= 0.4 ? "MEDIUM" : "LOW";

  return (
    <div className="flex min-h-screen bg-[#060b14]">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-8">
        <p className="text-xs uppercase tracking-widest text-slate-500">Security</p>
        <h1 className="mt-1 mb-2 text-2xl font-bold text-white">Fraud Alerts</h1>
        <p className="mb-8 text-sm text-slate-400">{alerts.length} flagged invoice{alerts.length !== 1 ? "s" : ""} detected</p>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-800" />)}
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 py-20 text-slate-500">
            <p className="text-4xl">✅</p>
            <p className="font-medium">No fraud alerts. All invoices are clean.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((inv) => (
              <div key={inv.irn} className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 px-6 py-4">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-semibold text-white truncate">{inv.irn}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{inv.vendorGstin} · {inv.invoiceDate}</p>
                  {inv.aiExplanation && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {Object.keys(inv.aiExplanation).map((k) => (
                        <span key={k} className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">{k.replace(/_/g, " ")}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-white">₹{inv.taxableValue.toLocaleString("en-IN")}</p>
                  <span className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${severityColor(inv.riskScore)}`}>
                    {severityLabel(inv.riskScore)} · {Math.round(inv.riskScore * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
