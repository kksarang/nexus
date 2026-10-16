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
        <div className="shell flex h-20 items-center gap-3">
          <Logo priority className="h-14 w-auto shrink-0" />
          <nav className="mx-auto hidden items-center gap-0.5 lg:flex" aria-label="Primary">
            {nav.map((item) => {
              const active = isCurrent(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-3 py-2 text-[0.78rem] font-semibold tracking-wide whitespace-nowrap ${
                    active ? "bg-cyan/15 text-cyan" : "text-mist hover:bg-white/5 hover:text-paper"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto hidden items-center gap-3 lg:flex">
            <Link href={adminHref} className="text-[0.68rem] tracking-[0.14em] text-mist uppercase hover:text-paper">
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
            <div className="shell grid gap-2 py-4">
              <BookButton className="w-full">Book Now</BookButton>
              <nav className="mt-2 grid gap-1" aria-label="Mobile">
                {nav.map((item) => {
                  const active = isCurrent(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenus}
                      aria-current={active ? "page" : undefined}
                      className={`rounded-xl px-4 py-3 text-lg ${active ? "bg-cyan/15 text-cyan" : "text-paper hover:bg-white/5"}`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <Link href={adminHref} onClick={closeMenus} className="mt-4 px-4 py-2 text-sm tracking-[0.14em] text-mist uppercase">
                Admin
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
