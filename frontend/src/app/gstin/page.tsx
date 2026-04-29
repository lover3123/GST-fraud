"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { isLoggedIn } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import { lookupGSTIN, GSTINResult } from "@/lib/api";

const fmt = (n: number) => `₹${(n / 1e7).toFixed(2)} Cr`;

const RISK_COLOR = {
  LOW: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  MEDIUM: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  HIGH: "text-red-400 bg-red-500/10 border-red-500/30",
};

const SAMPLE_GSTINS = [
  "27AAPFU0939F1Z5", "29ABCDE1234F1Z5", "24AAACB2894G1ZQ",
  "25AAPGN4567P1ZA", "06AAECS1234B1Z7",
];

export default function GSTINPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<GSTINResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) {
      setQuery(q);
      setTimeout(() => handleLookup(q), 10);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (!isLoggedIn()) router.replace("/login"); }, [router]);

  async function handleLookup(gstin?: string) {
    const g = (gstin ?? query).trim().toUpperCase();
    if (!g) return;
    setLoading(true); setError(null); setResult(null);
    try {
      setResult(await lookupGSTIN(g));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;
  if (!isLoggedIn()) return null;

  return (
    <div className="flex min-h-screen bg-[#060b14]">
      <Navbar />
      <main className="overflow-y-auto flex-1 p-8 pt-20">
        <p className="text-xs uppercase tracking-widest text-slate-500">Verification</p>
        <h1 className="mt-1 mb-8 text-2xl font-bold text-white">GSTIN Lookup</h1>

        {/* Search bar */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <MagnifyingGlass size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              maxLength={15}
              placeholder="Enter 15-character GSTIN…"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={() => handleLookup()}
            disabled={loading || query.length !== 15}
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </div>

        {/* Sample GSTINs */}
        <div className="mb-8 flex flex-wrap gap-2">
          <span className="text-xs text-slate-600 mr-1 self-center">Try:</span>
          {SAMPLE_GSTINS.map((g) => (
            <button key={g} onClick={() => { setQuery(g); handleLookup(g); }}
              className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-400 hover:border-indigo-500 hover:text-indigo-400 transition">
              {g}
            </button>
          ))}
        </div>

        {error && <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">{error}</div>}

        {result && (
          <div className="space-y-4">
            {/* Header card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-slate-500 mb-1">{result.gstin}</p>
                  <h2 className="text-xl font-bold text-white">{result.company_name}</h2>
                  <p className="text-sm text-slate-400 mt-1">{result.state}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-bold ${RISK_COLOR[result.risk_label as keyof typeof RISK_COLOR]}`}>
                  {result.risk_label} RISK
                </span>
              </div>
              {/* Risk bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Risk Score</span><span>{Math.round(result.risk_score * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${result.risk_score >= 0.6 ? "bg-red-500" : result.risk_score >= 0.3 ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${result.risk_score * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Financial table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="mb-4 text-sm font-semibold text-white">Financial Details</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: "Annual Sales", val: fmt(result.annual_sales) },
                  { label: "Annual Purchases", val: fmt(result.annual_purchases) },
                  { label: "ITC Claimed", val: fmt(result.itc_claimed) },
                  { label: "Refund Claimed", val: fmt(result.refund_claimed) },
                ].map((f) => (
                  <div key={f.label} className="rounded-xl bg-slate-800 px-4 py-3">
                    <p className="text-xs text-slate-500">{f.label}</p>
                    <p className="mt-1 text-base font-bold text-white">{f.val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Flags */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="mb-4 text-sm font-semibold text-white">Detection Flags</h3>
              <div className="space-y-2">
                {result.flags.map((flag) => (
                  <div key={flag} className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${flag === "No anomalies detected" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" : "border-red-500/20 bg-red-500/5 text-red-400"}`}>
                    <span>{flag === "No anomalies detected" ? "✅" : "⚠️"}</span>{flag}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
