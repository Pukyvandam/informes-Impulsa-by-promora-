"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard, Users, MessageSquare, Lightbulb,
  TrendingUp, FileText, RefreshCw, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const NAV = [
  { href: "/dashboard",       label: "Dashboard",   icon: LayoutDashboard },
  { href: "/impulsados",      label: "Impulsados",  icon: Users },
  { href: "/meetings/nuevo",  label: "Nueva sesión",icon: MessageSquare },
  { href: "/insights",        label: "Insights",    icon: Lightbulb },
  { href: "/patrones",        label: "Patrones",    icon: TrendingUp },
  { href: "/informes",        label: "Informes",    icon: FileText },
];

interface SidebarProps {
  isAdmin?: boolean;
}

export function Sidebar({ isAdmin }: SidebarProps) {
  const pathname = usePathname();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("lastSync");
    if (stored) setLastSync(stored);
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/sync/notion", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_SYNC_SECRET ?? ""}` },
      });
      const now = new Date().toISOString();
      localStorage.setItem("lastSync", now);
      setLastSync(now);
    } finally {
      setSyncing(false);
    }
  };

  const syncAgo = lastSync ? formatAgo(new Date(lastSync)) : null;

  return (
    <aside className="w-56 shrink-0 flex flex-col h-screen sticky top-0"
      style={{ background: "#0d1642", borderRight: "1px solid rgba(59,81,157,0.3)" }}>

      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
          <Image src="/logo.svg" alt="Impulsa" width={36} height={36} />
        </div>
        <div>
          <p className="font-display text-sm font-semibold text-white leading-tight">Impulsa</p>
          <p className="text-xs" style={{ color: "#8993b8" }}>Intelligence</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
                active
                  ? "text-white"
                  : "text-[#8993b8] hover:text-white hover:bg-white/5"
              )}
              style={active ? { background: "rgba(11,88,168,0.3)", color: "#e8ecf5" } : {}}>
              <Icon size={16} className={cn("shrink-0", active ? "text-[#73ACCA]" : "text-[#8993b8] group-hover:text-[#73ACCA]")} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={12} style={{ color: "#73ACCA" }} />}
            </Link>
          );
        })}
      </nav>

      {/* Sync status (admin only) */}
      {isAdmin && (
        <div className="px-4 py-4 border-t" style={{ borderColor: "rgba(59,81,157,0.3)" }}>
          {syncAgo && (
            <p className="text-xs mb-2" style={{ color: "#8993b8" }}>
              Sincronizado {syncAgo}
            </p>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg w-full transition-colors"
            style={{ background: "rgba(11,88,168,0.2)", color: "#73ACCA", border: "1px solid rgba(11,88,168,0.3)" }}>
            <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Sincronizando…" : "Refrescar Notion"}
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(59,81,157,0.2)" }}>
        <p className="text-xs italic" style={{ color: "#8993b8", fontFamily: "Fraunces, serif" }}>
          by Promora
        </p>
      </div>
    </aside>
  );
}

function formatAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return "hace unos segundos";
  if (secs < 3600) return `hace ${Math.floor(secs / 60)} min`;
  if (secs < 86400) return `hace ${Math.floor(secs / 3600)} h`;
  return `hace ${Math.floor(secs / 86400)} días`;
}
