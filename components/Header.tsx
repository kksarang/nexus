"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BookButton } from "@/components/BookSlot";
import { Logo } from "@/components/Logo";
import { useStaff } from "@/components/StaffAccess";
import { nav } from "@/lib/site";

export function Header() {
  const pathname = usePathname();
  const staff = useStaff();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = openPath === pathname;
  const adminHref = staff.status === "staff" ? "/admin" : "/admin/login";
  const adminLabel = staff.status === "staff" ? "Admin Dashboard" : "Admin Login";

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
        <div className="shell flex h-20 items-center justify-between gap-4 lg:h-[5.5rem]">
          <Logo priority className="h-16 w-auto lg:h-[4.75rem]" />
          <div className="hidden items-center gap-5 lg:flex">
            <Link href={adminHref} className="text-xs tracking-[0.14em] text-mist uppercase hover:text-paper">
              {adminLabel}
            </Link>
            <BookButton className="min-h-11 px-5">Book Now</BookButton>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="grid size-11 place-items-center rounded-xl border border-white/15 text-paper lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpenPath(open ? null : pathname)}
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
        <nav className="hidden border-t border-white/10 lg:block" aria-label="Primary">
          <div className="shell flex items-stretch justify-between gap-2">
            {nav.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`border-b-2 py-3.5 text-[0.78rem] font-semibold tracking-[0.16em] uppercase transition-colors ${
                    active ? "border-cyan text-cyan" : "border-transparent text-mist hover:text-paper"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-nav"
            className="fixed inset-x-0 top-20 bottom-0 z-[70] overflow-y-auto bg-[#070910] lg:hidden"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <nav className="shell flex flex-col pt-2" aria-label="Mobile">
              {nav.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenus}
                    aria-current={active ? "page" : undefined}
                    className={`border-b border-white/10 py-4 font-display text-3xl tracking-wide uppercase ${
                      active ? "text-cyan" : "text-paper"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="shell grid gap-3 py-6 pb-28">
              <BookButton className="w-full">Book Now</BookButton>
              <Link href={adminHref} onClick={closeMenus} className="py-2 text-center text-sm tracking-[0.14em] text-mist uppercase">
                {adminLabel}
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
