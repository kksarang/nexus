"use client";

import {
  BarChart3,
  Gamepad2,
  Gift,
  LayoutDashboard,
  LogOut,
  Menu,
  Monitor,
  Settings,
  Timer,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { StaffSignIn, useStaff } from "@/components/StaffAccess";
import { loadOperations, type DeskData } from "@/lib/adminApi";
import { rangeFor } from "@/lib/adminStats";
import { firebaseServices } from "@/lib/firebaseClient";
import { signOut } from "firebase/auth";

type RangeKey = "today" | "week" | "month" | "year" | "all" | "custom";

type DeskState = {
  role: string;
  canOperate: boolean;
  isAdmin: boolean;
  loading: boolean;
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
  { href: "/admin/players", label: "Players", icon: Users },
  { href: "/admin/sessions", label: "Sessions", icon: Timer },
  { href: "/admin/stations", label: "Stations", icon: Monitor },
  { href: "/admin/loyalty", label: "Loyalty & Rewards", icon: Gift },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/staff", label: "Staff Management", icon: Gamepad2, admin: true },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function istStamp(value: string, end: boolean) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const start = Date.UTC(year, month - 1, day) - 330 * 60 * 1000;
  return end ? start + 24 * 60 * 60 * 1000 - 1 : start;
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const staff = useStaff();
  const initial = rangeFor("month");
  const [open, setOpen] = useState(false);
  const [rangeKey, setRangeKey] = useState<RangeKey>("month");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [data, setData] = useState<DeskData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [generation, setGeneration] = useState(0);

  const role = staff.role || "staff";
  const isAdmin = staff.status === "staff" && role === "admin";
  const canOperate = staff.status === "staff" && role !== "manager";

  useEffect(() => {
    if (staff.status !== "staff") return;
    let cancel = false;
    setLoading(true);
    setError("");
    void loadOperations(from, to)
      .then((next) => {
        if (!cancel) setData(next);
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
    error,
    data,
    rangeKey,
    from,
    to,
    setPreset: (key) => {
      const next = rangeFor(key);
      setRangeKey(key);
      setFrom(next.from);
      setTo(next.to);
    },
    setCustom: (start, end) => {
      const fromMs = istStamp(start, false);
      const toMs = istStamp(end, true);
      if (fromMs == null || toMs == null || toMs < fromMs) {
        setError("Choose a start date and an end date.");
        return;
      }
      setRangeKey("custom");
      setFrom(fromMs);
      setTo(toMs);
    },
    reload: () => setGeneration((current) => current + 1),
  };

  return (
    <DeskContext.Provider value={desk}>
      <div className="min-h-svh bg-[#070910] text-paper lg:grid lg:grid-cols-[16rem_1fr]">
        <aside className={`${open ? "fixed inset-0 z-40" : "hidden"} bg-black/70 lg:static lg:block lg:bg-transparent`}>
          <div className="flex h-full w-[16rem] flex-col border-r border-white/10 bg-[#0b1020] p-4">
            <div className="flex items-center justify-between">
              <p className="font-tech text-[0.62rem] tracking-[0.22em] text-cyan uppercase">Nexus desk</p>
              <button type="button" className="lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <nav className="mt-6 grid gap-1" aria-label="Admin">
              {links
                .filter((item) => !item.admin || isAdmin)
                .map((item) => {
                  const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${active ? "bg-cyan/15 text-cyan" : "text-mist hover:bg-white/5 hover:text-paper"}`}
                    >
                      <Icon size={16} aria-hidden="true" />
                      {item.label}
                    </Link>
                  );
                })}
            </nav>
            <button
              type="button"
              className="mt-auto flex items-center gap-2 px-3 py-2 text-sm text-mist"
              onClick={() => {
                const services = firebaseServices();
                if (services) void signOut(services.auth);
              }}
            >
              <LogOut size={16} aria-hidden="true" />
              Sign out
            </button>
          </div>
        </aside>
        <div className="min-w-0">
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 lg:px-8">
            <button type="button" className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
              <Menu size={20} />
            </button>
            <p className="text-sm text-mist">{staff.email || "Staff"}</p>
            <Link href="/room" className="btn btn-primary min-h-10 px-4">
              Start a session
            </Link>
          </header>
          <div className="px-4 py-6 lg:px-8">
            {staff.status === "staff" ? children : <StaffSignIn />}
            {staff.status === "denied" ? null : null}
          </div>
        </div>
      </div>
    </DeskContext.Provider>
  );
}
