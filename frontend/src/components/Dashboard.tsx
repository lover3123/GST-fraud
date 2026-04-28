"use client";

import { useCallback, useEffect, useState } from "react";
import RiskBadge from "@/components/RiskBadge";
import XaiTooltip from "@/components/XaiTooltip";
import UploadWidget from "@/components/UploadWidget";
import { fetchInvoices, InvoiceRecord } from "@/lib/api";

export default function Dashboard() {
  const [rows, setRows] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchInvoices();
      setRows(data.items || []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  return (
    <>
      <UploadWidget onUploadComplete={loadInvoices} />
      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">Supplier Risk</p>
            <h2 className="mt-0.5 text-base font-semibold text-white">Recent Invoices</h2>
          </div>
          <button className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:border-slate-500 transition">
            Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="text-xs uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-6 py-4">IRN</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Invoice Date</th>
                <th className="px-6 py-4 text-right">Taxable Value</th>
                <th className="px-6 py-4 text-right">Risk</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-sm text-slate-500 animate-pulse">Loading invoices…</td></tr>
              ) : rows.length ? (
                rows.slice(0, 50).map((row) => (
                  <tr key={row.irn} className="border-t border-slate-800 hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">{row.irn}</td>
                    <td className="px-6 py-4 text-slate-300">{row.vendorGstin}</td>
                    <td className="px-6 py-4 text-slate-400">{row.invoiceDate}</td>
                    <td className="px-6 py-4 text-right text-white">₹{row.taxableValue.toLocaleString("en-IN")}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3">
                        <RiskBadge score={row.riskScore} />
                        <XaiTooltip explanation={row.aiExplanation} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="px-6 py-8 text-sm text-slate-500">No invoices processed yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}