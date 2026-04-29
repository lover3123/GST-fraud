"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MagnifyingGlass,
  Bell,
  Code,
  SignOut,
  House,
  ChartBar,
  ShieldWarning,
  Invoice,
  Briefcase,
  Key,
  Shield,
} from "@phosphor-icons/react/dist/ssr";
import { clearSession, getUser } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: House },
  { href: "/analytics", label: "Analytics", icon: ChartBar },
  { href: "/alerts", label: "Fraud Alerts", icon: ShieldWarning },
  { href: "/invoices", label: "Invoices", icon: Invoice },
  { href: "/gstin", label: "GSTIN Lookup", icon: MagnifyingGlass },
  { href: "/cases", label: "Cases", icon: Briefcase },
  { href: "/api-keys", label: "API Keys", icon: Key },
];

export default function TopNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const user = getUser();
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <>
      {/* ── TOP BAR ───────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-4 border-b border-slate-800/80 bg-[#0a1120]/95 backdrop-blur-md px-5">

        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3 min-w-0 mr-4">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 transition"
            aria-label="Toggle menu"
          >
            <Shield size={16} weight="fill" className="text-white" />
          </button>
          <div className="leading-tight hidden sm:block">
            <p className="text-sm font-bold text-white whitespace-nowrap">Fraud Detection Dashboard</p>
            <p className="text-[10px] text-slate-400">
              {user?.full_name ?? user?.username ?? "Admin"} · FY 2025–26
            </p>
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex flex-1 justify-center px-2">
          <div className="relative w-full max-w-sm">
            <MagnifyingGlass
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search GSTIN, Invoice, entity…"
              className="w-full rounded-lg border border-slate-700/60 bg-slate-800/60 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-indigo-600 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 ml-4">
          {/* Notification Bell */}
          <button className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-800/60 hover:bg-slate-700 transition">
            <Bell size={15} className="text-slate-300" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              3
            </span>
          </button>

          {/* API Docs */}
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-800/60 hover:bg-slate-700 transition"
            title="Open API Docs"
          >
            <Code size={15} className="text-slate-300" />
          </a>

          {/* Live Monitoring pill */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-emerald-800/60 bg-emerald-950/50 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-emerald-400">Live Monitoring</span>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/60 hover:bg-red-900/30 hover:border-red-800/60 hover:text-red-400 px-3 py-1.5 text-xs text-slate-300 transition"
          >
            <SignOut size={13} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* ── SLIDE-OUT SIDEBAR ─────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex" onClick={() => setSidebarOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Panel */}
          <aside
            className="relative z-50 flex h-full w-56 flex-col border-r border-slate-800 bg-[#0a1120] px-3 py-5 pt-20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-3 px-2 text-[10px] uppercase tracking-widest text-slate-500">Navigation</p>
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      active
                        ? "bg-indigo-600/20 text-indigo-400"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon size={17} weight={active ? "fill" : "regular"} />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name ?? user?.username}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.role ?? "admin"}</p>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
