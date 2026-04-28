"use client";

import { useState } from "react";
import { Info } from "@phosphor-icons/react/dist/ssr";

type XaiTooltipProps = {
  explanation: string[] | null;
};

export default function XaiTooltip({ explanation }: XaiTooltipProps) {
  const [open, setOpen] = useState(false);

  const cues = explanation && explanation.length > 0 
    ? explanation 
    : ["No specific anomalies detected."];

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        className="rounded-full border border-slate-700/50 p-1 text-slate-400 hover:text-white hover:border-slate-400 transition"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-label="Show XAI cues"
      >
        <Info size={14} />
      </button>
      {open ? (
        <div className="absolute right-0 top-10 z-20 w-72 rounded-2xl border border-slate-700 bg-slate-900 p-4 text-xs text-slate-300 shadow-xl">
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">Plain-English AI Cues</p>
          <ul className="flex flex-col gap-2">
            {cues.map((cue, idx) => (
              <li key={idx} className="flex items-start justify-between gap-3">
                <span className="min-w-0 flex-1 leading-5">✨ {cue}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
