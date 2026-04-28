"use client";

import { useMemo, useState } from "react";
import { Info } from "@phosphor-icons/react/dist/ssr";

type XaiTooltipProps = {
  explanation: Record<string, number> | null;
};

const FALLBACK_COPY = [
  "Transaction amount is unusually round",
  "Vendor appears newly introduced",
];

function mapKeyToCopy(key: string) {
  if (key === "amount_round_figure") return "Transaction amount is unusually round";
  if (key === "new_vendor") return "Vendor appears newly introduced";
  if (key === "rules") return "Deterministic validation rule triggered";
  return "Elevated anomaly signal detected";
}

export default function XaiTooltip({ explanation }: XaiTooltipProps) {
  const [open, setOpen] = useState(false);
  const entries = useMemo(() => {
    if (!explanation) return FALLBACK_COPY.map((item) => ({ label: item, value: 0.0 }));
    return Object.entries(explanation).map(([key, value]) => ({
      label: mapKeyToCopy(key),
      value: typeof value === "number" ? value : 0.0,
    }));
  }, [explanation]);

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        className="rounded-full border border-ink-700/20 p-1 text-ink-700"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-label="Show XAI cues"
      >
        <Info size={14} />
      </button>
      {open ? (
        <div className="absolute right-0 top-10 z-20 w-72 rounded-2xl border border-ink-700/10 bg-white p-4 text-xs text-ink-700 shadow-float">
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-ink-700">XAI cues</p>
          <ul className="flex flex-col gap-2">
            {entries.map((entry) => (
              <li key={entry.label} className="flex items-start justify-between gap-3">
                <span className="min-w-0 flex-1 leading-5">{entry.label}</span>
                <span className="shrink-0 font-mono text-[11px] text-ink-800">
                  +{entry.value.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
