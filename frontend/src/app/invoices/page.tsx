"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import { fetchInvoices, InvoiceRecord } from "@/lib/api";
import RiskBadge from "@/components/RiskBadge";
import XaiTooltip from "@/components/XaiTooltip";

type StatusFilter = "ALL" | "CLEAN" | "FLAGGED";

export default function InvoicesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<InvoiceRecord[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) setSearch(q);
  }, []);

  useEffect(() => { if (!isLoggedIn()) router.replace("/login"); }, [router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchInvoices();
      setRows(data.items);
    } catch { setRows([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter((r) => {
    const matchStatus = filter === "ALL" || r.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || r.irn.toLowerCase().includes(q) || r.vendorGstin.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  if (!mounted) return null;
  if (!isLoggedIn()) return null;

  return (
    <div className="flex min-h-screen bg-[#060b14]">
      <Navbar />
      <main className="overflow-y-auto flex-1 p-8 pt-20">
        <p className="text-xs uppercase tracking-widest text-slate-500">Records</p>
        <h1 className="mt-1 mb-6 text-2xl font-bold text-white">Invoices</h1>

        {/* Controls */}
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search IRN or GSTIN…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500 w-64"
          />
          <div className="flex rounded-xl border border-slate-700 overflow-hidden">
            {(["ALL", "CLEAN", "FLAGGED"] as StatusFilter[]).map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-4 py-2.5 text-xs font-semibold transition ${filter === s ? "bg-indigo-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white"}`}>
                {s}
              </button>
            ))}
          </div>
          <span className="self-center text-xs text-slate-500 ml-auto">{filtered.length} records</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-slate-800 text-xs uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-6 py-4">IRN</th>
                  <th className="px-6 py-4">Vendor GSTIN</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Risk</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-t border-slate-800">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-6 py-4"><div className="h-4 animate-pulse rounded bg-slate-800 w-24" /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-500">No invoices found</td></tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.irn} className="border-t border-slate-800 hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">{row.irn}</td>
                      <td className="px-6 py-4 text-slate-300">{row.vendorGstin}</td>
                      <td className="px-6 py-4 text-slate-400">{row.invoiceDate}</td>
                      <td className="px-6 py-4 text-right text-white">₹{row.taxableValue.toLocaleString("en-IN")}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.status === "FLAGGED" ? "bg-red-500/10 text-red-400" : row.status === "CLEAN" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-700 text-slate-400"}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <RiskBadge score={row.riskScore} />
                          <XaiTooltip explanation={row.aiExplanation} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
