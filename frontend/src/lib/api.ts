import { getToken } from "./auth";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function apiLogin(username: string, password: string) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Login failed");
  }
  return res.json();
}

// ── Invoices ──────────────────────────────────────────────────────────────────

export interface InvoiceRecord {
  irn: string;
  vendorGstin: string;
  invoiceDate: string;
  taxableValue: number;
  hsnCode: string | null;
  riskScore: number;
  aiExplanation: string[] | null;
  status: string;
  batchId: string | null;
}

export interface BatchResponse {
  batch_id: string;
  status: string;
}

export async function uploadBatch(files: File[]): Promise<BatchResponse> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  const res = await fetch(`${BASE}/api/v1/invoices/bulk-upload`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export async function fetchBatchStatus(batchId: string) {
  const res = await fetch(`${BASE}/api/v1/batches/${batchId}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch batch");
  return res.json();
}

export async function fetchInvoices(batchId?: string): Promise<{ items: InvoiceRecord[] }> {
  const url = batchId
    ? `${BASE}/api/v1/invoices?batch_id=${batchId}`
    : `${BASE}/api/v1/invoices`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch invoices");
  const raw = await res.json();
  const items: InvoiceRecord[] = (raw.items ?? []).map((i: Record<string, unknown>) => ({
    irn: i.irn as string,
    vendorGstin: i.vendor_gstin as string,
    invoiceDate: i.invoice_date as string,
    taxableValue: i.taxable_value as number,
    hsnCode: i.hsn_code as string | null,
    riskScore: i.risk_score as number,
    aiExplanation: i.ai_explanation as string[] | null,
    status: i.status as string,
    batchId: i.batch_id as string | null,
  }));
  return { items };
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function fetchDashboardStats() {
  const res = await fetch(`${BASE}/api/v1/dashboard/stats`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

// ── GSTIN ─────────────────────────────────────────────────────────────────────

export interface GSTINResult {
  gstin: string;
  company_name: string;
  state: string;
  annual_sales: number;
  annual_purchases: number;
  itc_claimed: number;
  refund_claimed: number;
  risk_score: number;
  risk_label: string;
  flags: string[];
}

export async function lookupGSTIN(gstin: string): Promise<GSTINResult> {
  const res = await fetch(`${BASE}/api/v1/gstin/lookup?gstin=${encodeURIComponent(gstin)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Lookup failed");
  }
  return res.json();
}
