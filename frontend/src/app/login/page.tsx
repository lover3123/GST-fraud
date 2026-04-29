"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeSlash, Lock, User } from "@phosphor-icons/react/dist/ssr";
import { apiLogin } from "@/lib/api";
import { saveSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("gst_guardian_token")) {
      router.replace("/");
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiLogin(username, password);
      saveSession(data.access_token, data.user);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex items-center justify-center bg-[#060b14] px-4">
      {/* Background grid */}
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(99,102,241,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/30">
            <Shield size={32} weight="fill" className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">GST E-Invoice Guardian</h1>
            <p className="mt-1 text-sm text-slate-400">Government of India — Fraud Detection Portal</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-sm">
          <h2 className="mb-6 text-lg font-semibold text-white">Officer Sign In</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-widest text-slate-400">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="admin / inspector / taxofficer"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 py-3 pl-9 pr-4 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-widest text-slate-400">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 py-3 pl-9 pr-10 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPass ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Demo Credentials</p>
            <div className="space-y-1 text-xs text-slate-400">
              <p><span className="text-indigo-400">admin</span> / Admin@123 — Senior Officer</p>
              <p><span className="text-indigo-400">inspector</span> / Inspect@123 — Inspection Officer</p>
              <p><span className="text-indigo-400">taxofficer</span> / Tax@123 — Tax Officer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
