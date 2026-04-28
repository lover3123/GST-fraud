"use client";

import { useCallback, useEffect, useState } from "react";

import RiskBadge from "@/components/RiskBadge";
import XaiTooltip from "@/components/XaiTooltip";
import UploadWidget from "@/components/UploadWidget";
import { fetchInvoices, InvoiceRecord } from "@/lib/api";

type InvoiceRow = InvoiceRecord;

export default function Dashboard() {
  const [rows, setRows] = useState<InvoiceRow[]>([]);
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

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  return (
    <>
      <UploadWidget onUploadComplete={loadInvoices} />
      <section className="rounded-[28px] bg-white px-10 py-12 shadow-subtle">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-700">Supplier risk</p>
          <h2 className="text-2xl font-semibold text-ink-900">Risk dashboard</h2>
        </div>
        <button className="rounded-full border border-ink-700/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-ink-700">
          Export
        </button>
      </div>
      <div className="mt-8 rounded-3xl border border-ink-700/10">
        <div className="overflow-x-auto overflow-y-visible rounded-3xl">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-shell-50 text-xs uppercase tracking-[0.2em] text-ink-700">
            <tr>
              <th className="px-6 py-4">IRN</th>
              <th className="px-6 py-4">Vendor</th>
              <th className="px-6 py-4">Invoice date</th>
              <th className="px-6 py-4 text-right">Taxable value</th>
              <th className="px-6 py-4 text-right">Risk</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-sm text-ink-700">
                  Loading invoices...
                </td>
              </tr>
            ) : rows.length ? (
              rows.map((row) => (
                <tr key={row.irn} className="border-t border-ink-700/10">
                  <td className="px-6 py-4 font-mono text-xs text-ink-800">{row.irn}</td>
                  <td className="px-6 py-4 text-ink-900">{row.vendorGstin}</td>
                  <td className="px-6 py-4 text-ink-700">{row.invoiceDate}</td>
                  <td className="px-6 py-4 text-right text-ink-900">
                    ₹{row.taxableValue.toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <RiskBadge score={row.riskScore} />
                      <XaiTooltip explanation={row.aiExplanation} />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-sm text-ink-700">
                  No invoices processed yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </section>
    </>
  );
}