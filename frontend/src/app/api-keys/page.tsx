"use client";

import { useEffect, useState, useCallback } from "react";
import { listApiKeys, createApiKey, revokeApiKey, ApiKeyRecord, CreatedApiKey } from "@/lib/apikeys";

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newlyCreated, setNewlyCreated] = useState<CreatedApiKey | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listApiKeys();
      setKeys(data);
    } catch {
      setError("Failed to load API keys.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const created = await createApiKey(newName.trim());
      setNewlyCreated(created);
      setNewName("");
      await load();
    } catch {
      setError("Failed to create API key. Is the backend running?");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: number, name: string) => {
    if (!confirm(`Permanently revoke key "${name}"? This cannot be undone.`)) return;
    try {
      await revokeApiKey(id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch {
      setError("Failed to revoke key.");
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Developer Access</p>
          <h1 className="text-2xl font-bold text-white">API Key Management</h1>
          <p className="mt-1 text-sm text-slate-400">
            Create keys to authorize external apps (Tally, SAP, etc.) to call the <code className="bg-slate-800 px-1 rounded text-emerald-400">POST /api/v1/detect</code> endpoint.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="rounded-xl border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-400">
            ⚠️ {error}
          </div>
        )}

        {/* Newly Created Key - One-time reveal */}
        {newlyCreated && (
          <div className="rounded-xl border border-emerald-700 bg-emerald-950/40 p-5 space-y-3">
            <p className="text-sm font-semibold text-emerald-400">✅ Key Created — Save it now! It will never be shown again.</p>
            <div className="flex items-center gap-3">
              <code className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-xs font-mono text-white break-all">
                {newlyCreated.full_key}
              </code>
              <button
                onClick={() => handleCopy(newlyCreated.full_key)}
                className="shrink-0 rounded-lg bg-emerald-700 hover:bg-emerald-600 px-4 py-3 text-xs font-semibold transition"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <button
              onClick={() => setNewlyCreated(null)}
              className="text-xs text-slate-500 hover:text-slate-300 transition"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Create New Key Form */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Create New Key</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder='e.g. "Tally Integration" or "SAP ERP"'
              className="flex-1 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 transition"
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2.5 text-sm font-semibold transition"
            >
              {creating ? "Creating…" : "Generate Key"}
            </button>
          </div>
        </div>

        {/* Keys Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">Active API Keys</h2>
          </div>
          {loading ? (
            <div className="px-6 py-8 text-sm text-slate-500 animate-pulse">Loading keys…</div>
          ) : keys.length === 0 ? (
            <div className="px-6 py-8 text-sm text-slate-500">No API keys created yet.</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase tracking-widest text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Key Prefix</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3">Last Used</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key) => (
                  <tr key={key.id} className="border-t border-slate-800 hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-medium text-white">{key.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">{key.key_prefix}••••••••</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        key.is_active
                          ? "bg-emerald-900/50 text-emerald-400 border border-emerald-800"
                          : "bg-red-900/50 text-red-400 border border-red-800"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${key.is_active ? "bg-emerald-400" : "bg-red-400"}`} />
                        {key.is_active ? "Active" : "Revoked"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{new Date(key.created_at).toLocaleDateString("en-IN")}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {key.last_used_at ? new Date(key.last_used_at).toLocaleString("en-IN") : "Never"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRevoke(key.id, key.name)}
                        className="rounded-lg border border-red-800 text-red-400 hover:bg-red-900/40 hover:text-red-300 px-3 py-1.5 text-xs font-medium transition"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Usage Example */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-3">
          <h2 className="text-sm font-semibold text-white">Usage Example</h2>
          <p className="text-xs text-slate-400">Use your key in the <code className="text-emerald-400">X-API-Key</code> header to call the real-time detection endpoint:</p>
          <pre className="rounded-xl bg-slate-950 border border-slate-800 p-4 text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">
{`curl -X POST http://localhost:8000/api/v1/detect \\
  -H "X-API-Key: sk_grd_YOUR_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "irn": "INV-2024-001",
    "vendor_gstin": "29ABCDE1234F1Z5",
    "invoice_date": "2024-01-15",
    "taxable_value": 49800,
    "hsn_code": "9983"
  }'`}
          </pre>
        </div>

      </div>
    </div>
  );
}
