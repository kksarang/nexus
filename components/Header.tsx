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
  const [scrolled, setScrolled] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = openPath === pathname;
  const adminHref = staff.status === "staff" ? "/admin" : "/admin/login";
  const adminLabel = staff.status === "staff" ? "Admin Dashboard" : "Admin Login";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)");
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
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
          scrolled || open ? "border-white/10 bg-[#070910]/92 backdrop-blur-xl" : "border-transparent bg-gradient-to-b from-[#070910]/80 to-transparent"
        }`}
      >
        <div className="shell flex h-[4.5rem] items-center gap-3">
          <Logo priority className="h-11 w-auto shrink-0 sm:h-12" />
          <nav className="ml-auto hidden items-center gap-0.5 xl:flex" aria-label="Primary">
            {nav.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-lg px-2.5 py-2 text-[0.78rem] font-medium tracking-wide transition-colors hover:bg-white/5 hover:text-paper ${
                    active ? "text-cyan" : "text-mist"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-2 hidden items-center gap-3 xl:flex">
            <Link href={adminHref} className="text-xs text-mist hover:text-paper">
              {adminLabel}
            </Link>
            <BookButton className="min-h-10 px-4">Book Now</BookButton>
          </div>
          <button
            type="button"
            className="ml-auto grid size-11 place-items-center rounded-xl border border-white/15 text-paper xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpenPath(open ? null : pathname)}
          >
            <Menu size={20} aria-hidden="true" />
            <span className="sr-only">Open menu</span>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-nav"
            className="fixed inset-0 z-[70] xl:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button type="button" className="absolute inset-0 bg-black/70" aria-label="Close menu" onClick={closeMenus} />
            <motion.div
              className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col overflow-y-auto border-l border-white/10 bg-[#070910]"
              initial={{ x: 24 }}
              animate={{ x: 0 }}
              exit={{ x: 24 }}
              transition={{ duration: 0.2 }}
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
            >
              <div className="flex h-[4.5rem] items-center justify-between px-5">
                <Logo className="h-11 w-auto" />
                <button
                  ref={closeRef}
                  type="button"
                  className="grid size-11 place-items-center rounded-xl border border-white/15"
                  onClick={closeMenus}
                >
                  <X size={20} aria-hidden="true" />
                  <span className="sr-only">Close menu</span>
                </button>
              </div>
              <nav className="grid gap-1 px-4" aria-label="Mobile">
                {nav.map((item) => {
                  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenus}
                      aria-current={active ? "page" : undefined}
                      className={`rounded-xl px-3 py-3 text-base ${active ? "bg-white/5 text-cyan" : "text-paper"}`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-auto grid gap-3 px-4 py-6">
                <BookButton className="w-full">Book Now</BookButton>
                <Link href={adminHref} onClick={closeMenus} className="btn btn-secondary w-full">
                  {adminLabel}
                </Link>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
