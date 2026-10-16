"use client";

import {
  BadgeCheck,
  BarChart3,
  Gift,
  ClipboardList,
  History,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Menu,
  Monitor,
  PanelLeft,
  PlayCircle,
  Settings,
  Timer,
  UserCog,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, Suspense, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { useStaff } from "@/components/StaffAccess";
import { loadOperations, type DeskData } from "@/lib/adminApi";
import { rangeFor } from "@/lib/adminStats";
import { displayLogin, edits, homeFor, pathAllowed, sees, type AccessMap, type ModuleId } from "@/lib/deskAccess";
import { firebaseServices } from "@/lib/firebaseClient";
import { signOut } from "firebase/auth";

type RangeKey = "today" | "yesterday" | "week" | "month" | "year" | "all" | "custom";

type DeskState = {
  role: string;
  canOperate: boolean;
  isAdmin: boolean;
  access: AccessMap;
  canSee: (id: ModuleId) => boolean;
  canEdit: (id: ModuleId) => boolean;
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

const links: { href: string; label: string; icon: typeof LayoutDashboard; module: ModuleId | "home" | "admin" | "all" }[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, module: "home" },
  { href: "/admin/room", label: "Start a Session", icon: PlayCircle, module: "gaming" },
  { href: "/admin/players", label: "Players / Customers", icon: Users, module: "customers" },
  { href: "/admin/members", label: "Memberships", icon: BadgeCheck, module: "members" },
  { href: "/admin/sessions", label: "Live Sessions", icon: Timer, module: "gaming" },
  { href: "/admin/history", label: "Session History", icon: History, module: "history" },
  { href: "/admin/activity", label: "Activity", icon: ClipboardList, module: "all" },
  { href: "/admin/stations", label: "Consoles / Stations", icon: Monitor, module: "gaming" },
  { href: "/admin/revenue", label: "Revenue", icon: IndianRupee, module: "revenue" },
  { href: "/admin/loyalty", label: "Loyalty Points", icon: Gift, module: "loyalty" },
  { href: "/admin/rewards", label: "Rewards & Redemptions", icon: Gift, module: "loyalty" },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, module: "reports" },
  { href: "/admin/reports", label: "Reports & Export", icon: BarChart3, module: "reports" },
  { href: "/admin/staff", label: "Office staff", icon: UserCog, module: "admin" },
  { href: "/admin/settings", label: "Utility", icon: Settings, module: "admin" },
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
  access,
  compact,
  onNavigate,
}: {
  pathname: string;
  isAdmin: boolean;
  access: AccessMap;
  compact: boolean;
  onNavigate: () => void;
}) {
  return (
    <nav className="mt-4 grid gap-1 overflow-y-auto" aria-label="Admin">
      {links
        .filter((item) => item.module === "all" || (item.module === "home" || item.module === "admin" ? isAdmin : isAdmin || sees(access, item.module)))
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
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${active ? "bg-blue-50 font-semibold text-blue-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
            >
              <Icon size={16} aria-hidden="true" />
              <span className={compact ? "sr-only" : ""}>{item.label}</span>
            </Link>
          );
        })}
    </nav>
  );
}

function LiveNav({ isAdmin, access, compact, onNavigate }: { isAdmin: boolean; access: AccessMap; compact: boolean; onNavigate: () => void }) {
  const pathname = usePathname();
  return <NavLinks pathname={pathname} isAdmin={isAdmin} access={access} compact={compact} onNavigate={onNavigate} />;
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

  const role = staff.role === "office" ? "office" : "admin";
  const isAdmin = staff.status === "staff" && role === "admin";
  const access = staff.access;
  const canOperate = isAdmin || Object.values(access).includes("edit");
  const onLogin = pathname === "/admin/login";

  useEffect(() => {
    if (staff.status === "pending") return;
    if (staff.status === "staff") {
      if (onLogin) router.replace(homeFor(isAdmin, access));
      else if (!pathAllowed(pathname, isAdmin, access)) router.replace(homeFor(isAdmin, access));
      return;
    }
    if (!onLogin) router.replace("/admin/login");
  }, [staff.status, onLogin, router, pathname, isAdmin, access]);

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

  useEffect(() => {
    if (!isAdmin || pathname !== "/admin") return;
    const timer = window.setInterval(() => setGeneration((current) => current + 1), 60000);
    return () => window.clearInterval(timer);
  }, [isAdmin, pathname]);

  const desk: DeskState = {
    role,
    canOperate,
    isAdmin,
    access,
    canSee: (id) => isAdmin || sees(access, id),
    canEdit: (id) => isAdmin || edits(access, id),
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

  if (onLogin) return <div className="admin-light min-h-svh bg-slate-50 text-slate-900">{children}</div>;
  if (staff.status !== "staff") return <div className="admin-light min-h-svh bg-slate-50" />;

  return (
    <DeskContext.Provider value={desk}>
      <div className={`admin-light min-h-svh bg-slate-50 text-slate-900 lg:grid ${collapsed ? "lg:grid-cols-[4.5rem_1fr]" : "lg:grid-cols-[16.5rem_1fr]"}`}>
        <aside className={`${open ? "fixed inset-0 z-40" : "hidden"} bg-slate-900/40 lg:sticky lg:top-0 lg:block lg:h-svh lg:bg-transparent`}>
          <div className={`flex h-full w-[16.5rem] flex-col border-r border-slate-200 bg-white p-3 ${collapsed ? "lg:w-[4.5rem]" : ""}`}>
            <div className="flex items-center justify-between gap-2 px-1">
              <div className={collapsed ? "lg:sr-only" : ""}>
                <p className="text-base font-semibold text-slate-900">Nexus Playzone</p>
                <p className="text-xs text-slate-500">Business desk</p>
              </div>
              <button type="button" className="hidden size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 lg:grid" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setCollapsed((current) => !current)}>
                <PanelLeft size={16} />
              </button>
              <button type="button" className="text-slate-600 lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <Suspense fallback={<NavLinks pathname="" isAdmin={isAdmin} access={access} compact={collapsed} onNavigate={() => setOpen(false)} />}>
              <LiveNav isAdmin={isAdmin} access={access} compact={collapsed} onNavigate={() => setOpen(false)} />
            </Suspense>
            <button
              type="button"
              className="mt-auto flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:px-8">
            <button type="button" className="text-slate-700 lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
              <Menu size={20} />
            </button>
            <p className="min-w-0 truncate text-sm text-slate-600">
              Signed in as <span className="font-medium text-slate-900">{displayLogin(staff.email, staff.username) || "Staff"}</span>
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{isAdmin ? "Admin" : "Office staff"}</span>
            </p>
            {isAdmin || sees(access, "gaming") ? (
              <Link href="/admin/room" className="btn btn-primary min-h-10 shrink-0 px-4">
                Start a session
              </Link>
            ) : <span />}
          </header>
          <div className="px-4 py-6 lg:px-8">
            {pathAllowed(pathname, isAdmin, access) ? children : (
              <p className="text-sm text-mist">This dashboard is for admins. Office staff only see the sections an admin turned on for them.</p>
            )}
          </div>
        </div>
      </div>
    </DeskContext.Provider>
  );
}
