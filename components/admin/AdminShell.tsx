"use client";

import {
  BarChart3,
  Gamepad2,
  Gift,
  History,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Menu,
  Monitor,
  PanelLeft,
  Settings,
  Timer,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, Suspense, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { useStaff } from "@/components/StaffAccess";
import { loadOperations, type DeskData } from "@/lib/adminApi";
import { rangeFor } from "@/lib/adminStats";
import { firebaseServices } from "@/lib/firebaseClient";
import { signOut } from "firebase/auth";

type RangeKey = "today" | "yesterday" | "week" | "month" | "year" | "all" | "custom";

type DeskState = {
  role: string;
  canOperate: boolean;
  isAdmin: boolean;
  loading: boolean;
  signedIn: boolean;
  error: string;
  data: DeskData | null;
  rangeKey: RangeKey;
  from: number;
  to: number;
  setPreset: (key: Exclude<RangeKey, "custom">) => void;
  setCustom: (from: string, to: string) => void;
  reload: () => void;
};

const DeskContext = createContext<DeskState | null>(null);

export function useDesk() {
  const value = useContext(DeskContext);
  if (!value) throw new Error("Admin data is only available inside the admin desk.");
  return value;
}

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/players", label: "Players / Customers", icon: Users },
  { href: "/admin/sessions", label: "Live Sessions", icon: Timer },
  { href: "/admin/history", label: "Session History", icon: History },
  { href: "/admin/stations", label: "Consoles / Stations", icon: Monitor },
  { href: "/admin/revenue", label: "Revenue", icon: IndianRupee },
  { href: "/admin/loyalty", label: "Loyalty Points", icon: Gift },
  { href: "/admin/rewards", label: "Rewards & Redemptions", icon: Gift },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/reports", label: "Reports & Export", icon: BarChart3 },
  { href: "/admin/staff", label: "Staff Management", icon: Gamepad2, admin: true },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

let monthBounds: { from: number; to: number } | null = null;

function monthBoundsClient() {
  monthBounds ??= rangeFor("month");
  return monthBounds;
}

function emptySubscribe() {
  return () => undefined;
}

function noMonthBounds() {
  return null;
}

function istStamp(value: string, end: boolean) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const start = Date.UTC(year, month - 1, day) - 330 * 60 * 1000;
  return end ? start + 24 * 60 * 60 * 1000 - 1 : start;
}

function NavLinks({
  pathname,
  isAdmin,
  compact,
  onNavigate,
}: {
  pathname: string;
  isAdmin: boolean;
  compact: boolean;
  onNavigate: () => void;
}) {
  return (
    <nav className="mt-4 grid gap-1 overflow-y-auto" aria-label="Admin">
      {links
        .filter((item) => !item.admin || isAdmin)
        .map((item) => {
          const active = pathname !== "" && (item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              title={item.label}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${active ? "bg-cyan/15 text-cyan" : "text-mist hover:bg-white/5 hover:text-paper"}`}
            >
              <Icon size={16} aria-hidden="true" />
              <span className={compact ? "sr-only" : ""}>{item.label}</span>
            </Link>
          );
        })}
    </nav>
  );
}

function LiveNav({ isAdmin, compact, onNavigate }: { isAdmin: boolean; compact: boolean; onNavigate: () => void }) {
  const pathname = usePathname();
  return <NavLinks pathname={pathname} isAdmin={isAdmin} compact={compact} onNavigate={onNavigate} />;
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const staff = useStaff();
  const liveMonth = useSyncExternalStore(emptySubscribe, monthBoundsClient, noMonthBounds);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [rangeKey, setRangeKey] = useState<RangeKey>("month");
  const [override, setOverride] = useState<{ from: number; to: number } | null>(null);
  const from = override?.from ?? liveMonth?.from ?? 0;
  const to = override?.to ?? liveMonth?.to ?? 0;
  const [data, setData] = useState<DeskData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [generation, setGeneration] = useState(0);

  const role = staff.role || "staff";
  const isAdmin = staff.status === "staff" && role === "admin";
  const canOperate = staff.status === "staff" && role !== "manager";
  const onLogin = pathname === "/admin/login";

  useEffect(() => {
    if (staff.status === "pending") return;
    if (staff.status === "staff") {
      if (onLogin) router.replace("/admin");
      return;
    }
    if (!onLogin) router.replace("/admin/login");
  }, [staff.status, onLogin, router]);

  useEffect(() => {
    if (staff.status !== "staff") return;
    let cancel = false;
    void loadOperations(from, to)
      .then((next) => {
        if (!cancel) {
          setData(next);
          setError("");
        }
      })
      .catch((reason: unknown) => {
        if (!cancel) setError(reason instanceof Error ? reason.message : "Could not load the desk.");
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [staff.status, from, to, generation]);

  const desk: DeskState = {
    role,
    canOperate,
    isAdmin,
    loading,
    signedIn: staff.status === "staff",
    error,
    data,
    rangeKey,
    from,
    to,
    setPreset: (key) => {
      setLoading(true);
      setRangeKey(key);
      setOverride(rangeFor(key));
    },
    setCustom: (start, end) => {
      const fromMs = istStamp(start, false);
      const toMs = istStamp(end, true);
      if (fromMs == null || toMs == null || toMs < fromMs) {
        setError("Choose a start date and an end date.");
        return;
      }
      setLoading(true);
      setRangeKey("custom");
      setOverride({ from: fromMs, to: toMs });
    },
    reload: () => {
      setLoading(true);
      setGeneration((current) => current + 1);
    },
  };

  if (onLogin) return <div className="min-h-svh bg-[#070910] text-paper">{children}</div>;
  if (staff.status !== "staff") return <div className="min-h-svh bg-[#070910]" />;

  return (
    <DeskContext.Provider value={desk}>
      <div className={`min-h-svh bg-[#070910] text-paper lg:grid ${collapsed ? "lg:grid-cols-[4.5rem_1fr]" : "lg:grid-cols-[16.5rem_1fr]"}`}>
        <aside className={`${open ? "fixed inset-0 z-40" : "hidden"} bg-black/70 lg:static lg:block lg:bg-transparent`}>
          <div className={`flex h-full w-[16.5rem] flex-col border-r border-white/10 bg-[#0b1020] p-3 ${collapsed ? "lg:w-[4.5rem]" : ""}`}>
            <div className="flex items-center justify-between gap-2 px-1">
              <div className={collapsed ? "lg:sr-only" : ""}>
                <p className="font-tech text-[0.62rem] tracking-[0.22em] text-cyan uppercase">Nexus desk</p>
                <p className="mt-2 truncate text-xs text-paper">{staff.email || "Staff"}</p>
                <p className="text-[0.62rem] tracking-[0.14em] text-mist uppercase">{role}</p>
              </div>
              <button type="button" className="hidden lg:grid size-9 place-items-center text-mist" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setCollapsed((current) => !current)}>
                <PanelLeft size={16} />
              </button>
              <button type="button" className="lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <Suspense fallback={<NavLinks pathname="" isAdmin={isAdmin} compact={collapsed} onNavigate={() => setOpen(false)} />}>
              <LiveNav isAdmin={isAdmin} compact={collapsed} onNavigate={() => setOpen(false)} />
            </Suspense>
            <button
              type="button"
              className="mt-auto flex items-center gap-2 px-3 py-2 text-sm text-mist"
              onClick={() => {
                const services = firebaseServices();
                if (!services) return;
                void signOut(services.auth).then(() => router.replace("/admin/login"));
              }}
            >
              <LogOut size={16} aria-hidden="true" />
              <span className={collapsed ? "sr-only" : ""}>Sign Out</span>
            </button>
          </div>
        </aside>
        <div className="min-w-0">
          <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 lg:px-8">
            <button type="button" className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
              <Menu size={20} />
            </button>
            <p className="min-w-0 truncate text-sm text-mist">
              {staff.email || "Staff"} · {role}
            </p>
            <Link href="/room" className="btn btn-primary min-h-10 shrink-0 px-4">
              Start a session
            </Link>
          </header>
          <div className="px-4 py-6 lg:px-8">{children}</div>
        </div>
      </div>
    </DeskContext.Provider>
  );
}
