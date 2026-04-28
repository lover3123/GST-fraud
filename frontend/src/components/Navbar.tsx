"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChartBar,
  House,
  MagnifyingGlass,
  ShieldWarning,
  SignOut,
  Briefcase,
  Invoice,
  Shield,
} from "@phosphor-icons/react/dist/ssr";
import { clearSession, getUser, ROLE_LABELS } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: House },
  { href: "/analytics", label: "Analytics", icon: ChartBar },
  { href: "/alerts", label: "Fraud Alerts", icon: ShieldWarning },
  { href: "/invoices", label: "Invoices", icon: Invoice },
  { href: "/gstin", label: "GSTIN Lookup", icon: MagnifyingGlass },
  { href: "/cases", label: "Case Assignments", icon: Briefcase },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-slate-800 bg-slate-950 px-4 py-6">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600">
          <Shield size={18} weight="fill" className="text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-white">GST Guardian</p>
          <p className="text-[10px] text-slate-500">Fraud Detection</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "bg-indigo-600/20 text-indigo-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={18} weight={active ? "fill" : "regular"} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-3">
        <p className="text-sm font-semibold text-white truncate">{user?.full_name ?? user?.username}</p>
        <p className="text-xs text-slate-500 truncate">{ROLE_LABELS[user?.role ?? ""] ?? user?.role}</p>
        <button
          onClick={handleLogout}
          className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition"
        >
          <SignOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
