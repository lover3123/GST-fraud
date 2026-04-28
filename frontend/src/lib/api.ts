export type BatchStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface InvoiceRecord {
  irn: string;
  vendorGstin: string;
  invoiceDate: string;
  taxableValue: number;
  riskScore: number;
  aiExplanation: Record<string, number> | null;
  status: string;
}

export interface BatchResponse {
  batch_id: string;
  status: BatchStatus;
}

type InvoiceApiRecord = {
  irn: string;
  vendor_gstin: string;
  invoice_date: string;
  taxable_value: number;
  risk_score: number;
  ai_explanation: Record<string, number> | null;
  status: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export async function uploadBatch(files: File[]): Promise<BatchResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await fetch(`${API_BASE_URL}/api/v1/invoices/bulk-upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = "Upload failed";
    try {
      const payload = await response.json();
      if (payload?.detail) {
        message = typeof payload.detail === "string" ? payload.detail : JSON.stringify(payload.detail);
      }
    } catch {
      // Keep the fallback error when the backend response is not JSON.
    }
    throw new Error(message);
  }

  return response.json();
}

export async function fetchBatchStatus(batchId: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/batches/${batchId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch batch status");
  }
  return response.json();
}

export async function fetchInvoices(batchId?: string) {
  const url = batchId
    ? `${API_BASE_URL}/api/v1/invoices?batch_id=${batchId}`
    : `${API_BASE_URL}/api/v1/invoices`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch invoices");
  }
  const data = await response.json();
  const items = (data.items || []).map((item: InvoiceApiRecord) => ({
    irn: item.irn,
    vendorGstin: item.vendor_gstin,
    invoiceDate: item.invoice_date,
    taxableValue: item.taxable_value,
    riskScore: item.risk_score,
    aiExplanation: item.ai_explanation,
    status: item.status,
  }));
  return { items };
}
