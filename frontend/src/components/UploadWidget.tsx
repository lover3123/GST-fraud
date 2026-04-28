"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CloudArrowUp, Hourglass } from "@phosphor-icons/react/dist/ssr";

import { BatchResponse, fetchBatchStatus, uploadBatch } from "@/lib/api";

type UploadState = "idle" | "uploading" | "processing" | "completed" | "error";

interface UploadWidgetProps {
  onUploadComplete?: () => void;
}

export default function UploadWidget({ onUploadComplete }: UploadWidgetProps) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [state, setState] = useState<UploadState>("idle");
  const [batch, setBatch] = useState<BatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const label = useMemo(() => {
    if (state === "uploading") return "Uploading";
    if (state === "processing") return "Processing batch";
    if (state === "completed") return "Batch complete";
    if (state === "error") return "Upload failed";
    return "Drop invoice files";
  }, [state]);

  const handleFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const accepted = Array.from(incoming).filter((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase();
      return ["pdf", "csv"].includes(extension || "") || ["application/pdf", "text/csv"].includes(file.type);
    });
    setFiles(accepted);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!files.length) return;
    setState("uploading");
    setError(null);
    try {
      const response = await uploadBatch(files);
      setBatch(response);
      setState(response.status === "COMPLETED" ? "completed" : "processing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not upload the batch.");
      setState("error");
    }
  }, [files]);

  useEffect(() => {
    if (state !== "processing" || !batch) return;
    const timer = window.setTimeout(async () => {
      try {
        const data = await fetchBatchStatus(batch.batch_id);
        if (data.status === "COMPLETED") {
          setState("completed");
          // Trigger refetch of invoices after batch completes
          onUploadComplete?.();
          // Reset after a short delay
          setTimeout(() => {
            setState("idle");
            setBatch(null);
            setFiles([]);
          }, 2000);
        } else {
          setState("processing");
        }
      } catch {
        setState("processing");
      }
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [batch, state, onUploadComplete]);

  return (
    <section className="w-full">
      <div
        className={`flex w-full flex-col gap-4 rounded-2xl border bg-slate-900 p-6 transition ${
          dragActive
            ? "border-indigo-500 bg-indigo-500/5"
            : "border-slate-800"
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          handleFiles(event.dataTransfer.files);
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-widest">
            <CloudArrowUp size={16} />
            <span>PDF or CSV only</span>
          </div>
          {files.length ? (
            <button
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition"
              onClick={handleUpload}
            >
              Upload {files.length} file{files.length > 1 ? "s" : ""}
            </button>
          ) : null}
        </div>

        <label
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-8 py-10 text-center transition ${
            dragActive
              ? "border-indigo-500 bg-indigo-500/5"
              : "border-slate-700 hover:border-slate-500"
          }`}
        >
          <input
            type="file"
            multiple
            accept=".pdf,.csv"
            className="hidden"
            onChange={(event) => handleFiles(event.target.files)}
          />
          <CloudArrowUp
            size={32}
            className={dragActive ? "text-indigo-400" : "text-slate-500"}
            weight="duotone"
          />
          <span className="text-base font-semibold text-white">{label}</span>
          <span className="text-sm text-slate-500">
            Drop files here or click to browse.
          </span>
          {files.length > 0 && (
            <span className="mt-1 text-xs text-indigo-400">
              {files.length} file{files.length > 1 ? "s" : ""} ready — click Upload above
            </span>
          )}
        </label>

        {state === "processing" ? (
          <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/50 px-5 py-4">
            <div className="h-8 w-8 animate-pulse rounded-full bg-slate-700" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-2.5 w-2/3 animate-pulse rounded-full bg-slate-700" />
              <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-slate-700" />
            </div>
            <Hourglass size={18} className="text-slate-400" />
          </div>
        ) : null}

        {state === "completed" ? (
          <div className="rounded-xl border border-emerald-800 bg-emerald-500/10 px-5 py-3 text-sm text-emerald-400">
            ✓ Batch processed successfully
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-800 bg-red-500/10 px-5 py-3 text-sm text-red-400">
            {error}
          </div>
        ) : null}
      </div>
    </section>
  );
}
