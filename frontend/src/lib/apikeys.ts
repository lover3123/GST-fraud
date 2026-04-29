import { getToken } from "./auth";
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

export interface ApiKeyRecord {
  id: number;
  name: string;
  key_prefix: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

export interface CreatedApiKey extends ApiKeyRecord {
  full_key: string;
}

export async function listApiKeys(): Promise<ApiKeyRecord[]> {
  const res = await fetch(`${BASE}/api/v1/admin/api-keys`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch API keys");
  return res.json();
}

export async function createApiKey(name: string): Promise<CreatedApiKey> {
  const res = await fetch(`${BASE}/api/v1/admin/api-keys`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to create API key");
  return res.json();
}

export async function revokeApiKey(id: number): Promise<void> {
  const res = await fetch(`${BASE}/api/v1/admin/api-keys/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to revoke API key");
}
