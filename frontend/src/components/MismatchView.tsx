"use client";

import { LinkSimpleHorizontal } from "@phosphor-icons/react/dist/ssr";

type MismatchRow = {
  key: string;
  gstr1: string;
  gstr2b: string;
  mismatched: boolean;
};

const SAMPLE_MISMATCH: MismatchRow[] = [
  {
    key: "Invoice value",
    gstr1: "₹1,285,000",
    gstr2b: "₹1,255,000",
    mismatched: true,
  },
  {
    key: "GSTIN",
    gstr1: "29ABCDE1234F1Z5",
    gstr2b: "29ABCDE1234F1Z5",
    mismatched: false,
  },
  {
    key: "Invoice date",
    gstr1: "14 Oct 2024",
    gstr2b: "15 Oct 2024",
    mismatched: true,
  },
];

export default function MismatchView() {
  return (
    <section className="grid gap-6 rounded-[28px] bg-white px-10 py-12 shadow-subtle">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-700">Mismatch view</p>
        <h2 className="text-2xl font-semibold text-ink-900">GSTR-1 vs GSTR-2B</h2>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-3xl border border-ink-700/10 bg-shell-50/70 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-700">GSTR-1</p>
          <div className="mt-4 flex flex-col gap-3">
            {SAMPLE_MISMATCH.map((row) => (
              <div
                key={row.key}
                className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm ${
                  row.mismatched ? "bg-amber-50 text-amber-700" : "bg-white"
                }`}
              >
                <span className="text-ink-700">{row.key}</span>
                <span className="font-mono text-ink-900">{row.gstr1}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center text-ink-700">
          <LinkSimpleHorizontal size={28} />
        </div>
        <div className="rounded-3xl border border-ink-700/10 bg-shell-50/70 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-700">GSTR-2B</p>
          <div className="mt-4 flex flex-col gap-3">
            {SAMPLE_MISMATCH.map((row) => (
              <div
                key={row.key}
                className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm ${
                  row.mismatched ? "bg-red-50 text-red-700" : "bg-white"
                }`}
              >
                <span className="text-ink-700">{row.key}</span>
                <span className="font-mono text-ink-900">{row.gstr2b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
