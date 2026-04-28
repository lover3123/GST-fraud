"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, getUser } from "@/lib/auth";
import Navbar from "@/components/Navbar";

const CASES = [
  { id: "CASE-001", irn: "INV-000029", vendor: "29ABCDE1234F1Z5", amount: 4200000, risk: 0.81, assigned: "Inspector Raj Kumar", priority: "HIGH", status: "Under Review" },
  { id: "CASE-002", irn: "INV-000044", vendor: "25AAPGN4567P1ZA", amount: 8750000, risk: 0.78, assigned: "Tax Officer Priya", priority: "HIGH", status: "Pending" },
  { id: "CASE-003", irn: "INV-000012", vendor: "20AAKCI9012K1ZV", amount: 1350000, risk: 0.72, assigned: "Senior Officer Sharma", priority: "HIGH", status: "Escalated" },
  { id: "CASE-004", irn: "INV-000067", vendor: "23AAICG7890I1ZT", amount: 2800000, risk: 0.65, assigned: "Inspector Raj Kumar", priority: "MEDIUM", status: "Under Review" },
  { id: "CASE-005", irn: "INV-000089", vendor: "19AABCU9603R1ZX", amount: 950000, risk: 0.58, assigned: "Tax Officer Priya", priority: "MEDIUM", status: "Pending" },
  { id: "CASE-006", irn: "INV-000033", vendor: "08AADCA2345E1ZW", amount: 3600000, risk: 0.71, assigned: "Unassigned", priority: "HIGH", status: "Open" },
];

const PRIORITY_COLOR: Record<string, string> = {
  HIGH: "text-red-400 bg-red-500/10 border-red-500/30",
  MEDIUM: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  LOW: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
};
const STATUS_COLOR: Record<string, string> = {
  "Under Review": "text-indigo-400 bg-indigo-500/10",
  Pending: "text-slate-400 bg-slate-700",
  Escalated: "text-red-400 bg-red-500/10",
  Open: "text-amber-400 bg-amber-500/10",
};

export default function CasesPage() {
  const router = useRouter();
  useEffect(() => { if (!isLoggedIn()) router.replace("/login"); }, [router]);
  const user = getUser();
  if (!isLoggedIn()) return null;

  return (
    <div className="flex min-h-screen bg-[#060b14]">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-8">
        <p className="text-xs uppercase tracking-widest text-slate-500">Operations</p>
        <h1 className="mt-1 mb-2 text-2xl font-bold text-white">Case Assignments</h1>
        <p className="mb-8 text-sm text-slate-400">
          Logged in as <span className="text-indigo-400 font-medium">{user?.full_name ?? user?.username}</span> — {CASES.length} active cases
        </p>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label: "Open Cases", count: CASES.filter((c) => c.status !== "Escalated").length, color: "text-amber-400" },
            { label: "Escalated", count: CASES.filter((c) => c.status === "Escalated").length, color: "text-red-400" },
            { label: "Under Review", count: CASES.filter((c) => c.status === "Under Review").length, color: "text-indigo-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className={`mt-1 text-3xl font-bold ${s.color}`}>{s.count}</p>
            </div>
          ))}
        </div>

        {/* Cases list */}
        <div className="space-y-3">
          {CASES.map((c) => (
            <div key={c.id} className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 px-6 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <span className="text-xs font-bold text-slate-500">{c.id}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${PRIORITY_COLOR[c.priority]}`}>{c.priority}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[c.status]}`}>{c.status}</span>
                </div>
                <p className="font-mono text-sm text-white">{c.irn}</p>
                <p className="text-xs text-slate-500 mt-0.5">{c.vendor}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-white">₹{(c.amount / 1e5).toFixed(2)}L</p>
                <p className="text-xs text-slate-500 mt-0.5">Risk {Math.round(c.risk * 100)}%</p>
              </div>
              <div className="shrink-0 hidden sm:block text-right">
                <p className="text-xs text-slate-500">Assigned to</p>
                <p className="text-xs text-indigo-400 font-medium">{c.assigned}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
