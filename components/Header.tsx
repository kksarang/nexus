"use client";

import { AnimatePresence, motion } from "framer-motion";
import { DoorOpen, Gamepad2, IndianRupee, Joystick, Menu, Phone, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BookButton } from "@/components/BookSlot";
import { Logo } from "@/components/Logo";
import { useStaff } from "@/components/StaffAccess";
import { nav } from "@/lib/site";

const menuMeta: Record<string, { hint: string; icon: LucideIcon }> = {
  "/stations": { hint: "Six PS5 consoles", icon: Gamepad2 },
  "/private-room": { hint: "A room for your crew", icon: DoorOpen },
  "/games": { hint: "What you can play", icon: Joystick },
  "/pricing": { hint: "Hourly rates", icon: IndianRupee },
  "/contact": { hint: "Panoor, Kannur", icon: Phone },
};

function isCurrent(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Header() {
  const pathname = usePathname();
  const staff = useStaff();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = openPath === pathname;
  const adminHref = staff.status === "staff" ? "/admin" : "/admin/login";

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const close = () => {
      if (media.matches) setOpenPath(null);
    };
    const frame = window.requestAnimationFrame(close);
    media.addEventListener("change", close);
    return () => {
      window.cancelAnimationFrame(frame);
      media.removeEventListener("change", close);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenPath(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function closeMenus() {
    setOpenPath(null);
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#070910]/95 backdrop-blur-xl">
        <div className="shell flex h-20 items-center gap-4">
          <Logo priority className="h-14 w-auto shrink-0" />
          <nav className="mx-auto hidden items-center rounded-full border border-white/10 bg-white/[0.04] p-1 lg:flex" aria-label="Primary">
            {nav.map((item) => {
              const active = isCurrent(pathname, item.href);
              const Icon = menuMeta[item.href]?.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold whitespace-nowrap ${
                    active ? "bg-cyan text-ink" : "text-paper hover:bg-white/10"
                  }`}
                >
                  {Icon ? <Icon size={16} aria-hidden="true" /> : null}
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto hidden items-center gap-4 lg:flex">
            <Link href={adminHref} className="text-xs text-mist hover:text-paper">
              Admin
            </Link>
            <BookButton className="min-h-10 px-4">Book Now</BookButton>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="ml-auto grid size-11 place-items-center rounded-xl border border-white/15 text-paper lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpenPath(open ? null : pathname)}
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-nav"
            className="fixed inset-x-0 top-20 bottom-0 z-[70] overflow-y-auto bg-[#070910] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <nav className="shell grid gap-2 py-4" aria-label="Mobile">
              {nav.map((item) => {
                const active = isCurrent(pathname, item.href);
                const meta = menuMeta[item.href];
                const Icon = meta?.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenus}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-4 rounded-2xl border px-4 py-4 ${
                      active ? "border-cyan/50 bg-cyan/10" : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    {Icon ? (
                      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${active ? "bg-cyan text-ink" : "bg-white/5 text-cyan"}`}>
                        <Icon size={20} aria-hidden="true" />
                      </span>
                    ) : null}
                    <span>
                      <span className="block text-lg text-paper">{item.label}</span>
                      {meta ? <span className="mt-0.5 block text-sm text-mist">{meta.hint}</span> : null}
                    </span>
                  </Link>
                );
              })}
              <BookButton className="mt-2 w-full">Book Now</BookButton>
              <Link href={adminHref} onClick={closeMenus} className="px-1 py-2 text-sm text-mist">
                Admin
              </Link>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
