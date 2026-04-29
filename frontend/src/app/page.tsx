"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import StatsCards from "@/components/StatsCards";
import Dashboard from "@/components/Dashboard";
import { fetchDashboardStats } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats] = useState<null | Record<string, number>>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
    }
  }, [router]);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await fetchDashboardStats();
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (!mounted) return null;
  if (!isLoggedIn()) return null;

  return (
    <div className="min-h-screen bg-[#060b14]">
      <Navbar />
      <main className="pt-14 overflow-y-auto p-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-slate-500">Overview</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Command Dashboard</h1>
        </div>

        {loadingStats ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-800" />
            ))}
          </div>
        ) : stats ? (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <StatsCards stats={stats as any} />
        ) : null}

        <div className="mt-8">
          <Dashboard />
        </div>
      </main>
    </div>
  );
}
