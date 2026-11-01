"use client";

import { AnimatePresence, motion } from "framer-motion";
import { DoorOpen, Gamepad2, Images, Info, IndianRupee, Joystick, Menu, Phone, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BookButton } from "@/components/BookSlot";
import { BrandLogo } from "@/components/BrandLogo";
import { ScrollXp } from "@/components/ScrollXp";
import { nav } from "@/lib/site";

const menuMeta: Record<string, { hint: string; icon: LucideIcon }> = {
  "/stations": { hint: "Six gaming stations", icon: Gamepad2 },
  "/private-room": { hint: "A room for your crew", icon: DoorOpen },
  "/games": { hint: "What you can play", icon: Joystick },
  "/pricing": { hint: "Hourly rates", icon: IndianRupee },
  "/gallery": { hint: "Inside the lounge", icon: Images },
  "/about": { hint: "The founders", icon: Info },
  "/contact": { hint: "Panoor, Kannur", icon: Phone },
};

function isCurrent(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Header() {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = openPath === pathname;

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 240);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The home title screen already shows the full logo, so the bar stays clear until it scrolls away.
  const onTitleScreen = pathname === "/" && !scrolled && !open;

  function closeMenus() {
    setOpenPath(null);
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
          onTitleScreen ? "border-transparent bg-transparent" : "border-white/10 bg-ink/90 backdrop-blur-xl"
        }`}
      >
        <div className="shell flex h-20 items-center gap-4">
          <div className={`transition-opacity duration-300 ${onTitleScreen ? "pointer-events-none opacity-0" : ""}`} inert={onTitleScreen}>
            <BrandLogo preload className="h-9 w-auto shrink-0 sm:h-10" />
          </div>
          <nav className="mx-auto hidden items-center gap-1 xl:flex" aria-label="Primary">
            {nav.map((item) => {
              const active = isCurrent(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`border-b-2 px-3 py-2 font-display text-sm tracking-[0.08em] whitespace-nowrap uppercase transition-colors ${
                    active ? "border-magenta text-paper" : "border-transparent text-mist hover:border-cyan hover:text-paper"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto hidden items-center gap-4 xl:flex">
            <BookButton className="btn-sm">Book Now</BookButton>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="bevel ml-auto grid size-11 place-items-center border border-white/20 bg-ink/50 text-paper xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpenPath(open ? null : pathname)}
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
        <ScrollXp />
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-nav"
            className="fixed inset-x-0 top-20 bottom-0 z-[70] overflow-y-auto bg-ink xl:hidden"
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
                    className={`bevel flex items-center gap-4 border px-4 py-4 ${
                      active ? "border-magenta/60 bg-magenta/10" : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    {Icon ? (
                      <span className={`bevel grid size-11 shrink-0 place-items-center ${active ? "bg-magenta text-ink" : "bg-white/5 text-cyan"}`}>
                        <Icon size={20} aria-hidden="true" />
                      </span>
                    ) : null}
                    <span>
                      <span className="block font-display text-lg text-paper uppercase">{item.label}</span>
                      {meta ? <span className="mt-0.5 block text-sm text-mist">{meta.hint}</span> : null}
                    </span>
                  </Link>
                );
              })}
              <BookButton className="mt-2 w-full">Book Now</BookButton>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
