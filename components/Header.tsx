"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, MessageCircle, Phone, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BookButton } from "@/components/BookSlot";
import { Logo } from "@/components/Logo";
import { messages, nav, site, whatsappLink } from "@/lib/site";

export function Header() {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = openPath === pathname;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
          scrolled || open
            ? "border-white/10 bg-ink/85 backdrop-blur-xl"
            : "border-transparent bg-gradient-to-b from-ink/80 to-transparent"
        }`}
      >
        <div className="shell flex h-[4.75rem] items-center justify-between gap-4">
          <Logo priority className="h-12 w-auto sm:h-14" />
          <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-lg px-3 py-2 text-[0.8rem] font-medium transition-colors hover:bg-white/5 hover:text-paper ${
                    active ? "bg-white/5 text-cyan" : "text-mist"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="hidden items-center gap-2 xl:flex">
            <a
              href={whatsappLink(messages.book)}
              target="_blank"
              rel="noopener noreferrer"
              className="grid size-11 place-items-center rounded-xl border border-white/10 text-paper hover:border-cyan/50"
              aria-label="Chat on WhatsApp"
            >
              <MessageCircle size={18} aria-hidden="true" />
            </a>
            <a
              href={`tel:${site.phoneTel}`}
              className="grid size-11 place-items-center rounded-xl border border-white/10 text-paper hover:border-cyan/50"
              aria-label={`Call ${site.phoneDisplay}`}
            >
              <Phone size={18} aria-hidden="true" />
            </a>
            <BookButton>Book now</BookButton>
          </div>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-xl border border-white/15 text-paper xl:hidden"
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
            className="fixed inset-0 z-[70] overflow-y-auto bg-ink/97 backdrop-blur-xl xl:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="shell flex h-[4.75rem] items-center justify-between">
              <Logo className="h-12 w-auto" />
              <button
                ref={closeRef}
                type="button"
                className="grid size-11 place-items-center rounded-xl border border-white/15"
                onClick={() => setOpenPath(null)}
              >
                <X size={20} aria-hidden="true" />
                <span className="sr-only">Close menu</span>
              </button>
            </div>
            <nav className="shell grid gap-1 pt-6" aria-label="Mobile">
              {nav.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpenPath(null)}
                  className="flex items-baseline gap-4 border-b border-white/10 py-4 font-display text-4xl tracking-wide text-paper uppercase"
                >
                  <span className="font-tech text-xs text-cyan">0{index + 1}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="shell grid gap-3 py-8">
              <BookButton className="w-full">Book your session</BookButton>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={whatsappLink(messages.book)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp w-full"
                >
                  <MessageCircle size={16} aria-hidden="true" />
                  WhatsApp
                </a>
                <a href={`tel:${site.phoneTel}`} className="btn btn-secondary w-full">
                  <Phone size={16} aria-hidden="true" />
                  Call
                </a>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
