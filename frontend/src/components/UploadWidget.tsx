"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CloudArrowUp, Hourglass } from "@phosphor-icons/react/dist/ssr";

import { BatchResponse, fetchBatchStatus, uploadBatch } from "@/lib/api";

type UploadState = "idle" | "uploading" | "processing" | "completed" | "error";

export default function UploadWidget() {
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
        } else {
          setState("processing");
        }
      } catch {
        setState("processing");
      }
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [batch, state]);

  return (
    <section className="flex w-full items-center justify-center">
      <div
        className={`glass-panel flex w-full max-w-3xl flex-col gap-6 rounded-[28px] px-10 py-12 shadow-float transition ${
          dragActive ? "border-ink-900" : "border-transparent"
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
          <div className="flex items-center gap-3 text-sm text-ink-700">
            <CloudArrowUp size={20} />
            <span>PDF or CSV only</span>
          </div>
          {files.length ? (
            <button
              className="rounded-full bg-ink-900 px-5 py-2 text-sm font-medium text-white"
              onClick={handleUpload}
            >
              Upload {files.length} files
            </button>
          ) : null}
        </div>

        <label className="flex cursor-pointer flex-col gap-2 rounded-3xl border border-dashed border-ink-700/20 bg-white px-8 py-12 text-center">
          <input
            type="file"
            multiple
            accept=".pdf,.csv"
            className="hidden"
            onChange={(event) => handleFiles(event.target.files)}
          />
          <span className="text-2xl font-semibold text-ink-900">{label}</span>
          <span className="text-sm text-ink-700">Drop files here or click to browse.</span>
        </label>

        {state === "processing" ? (
          <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4">
            <div className="pulse-skeleton h-10 w-10 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="pulse-skeleton h-3 w-2/3 rounded-full" />
              <div className="pulse-skeleton h-3 w-1/3 rounded-full" />
            </div>
            <Hourglass size={20} className="text-ink-700" />
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </section>
  );
}
