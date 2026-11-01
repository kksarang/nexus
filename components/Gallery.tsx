"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SectionIntro } from "@/components/SectionIntro";
import { gallery } from "@/lib/site";

export function Gallery({ heading = true }: { heading?: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const isOpen = open !== null;
  const count = gallery.length;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
      if (event.key === "ArrowRight") setOpen((value) => (value === null ? value : (value + 1) % count));
      if (event.key === "ArrowLeft") setOpen((value) => (value === null ? value : (value - 1 + count) % count));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, count]);

  const shown = open === null ? null : gallery[open];

  return (
    <section id="gallery" className="py-20 sm:py-28">
      <div className="shell">
        {heading ? (
          <SectionIntro
            eyebrow="Gallery"
            title={
              <>
                Inside the <span className="text-gradient">lounge.</span>
              </>
            }
            action={
              <Link href="/gallery" className="btn btn-secondary">
                Open gallery
              </Link>
            }
          >
            The consoles, the screens, the seats, and the private room.
          </SectionIntro>
        ) : null}

        <ul className={`${heading ? "mt-12" : ""} grid auto-rows-[11rem] grid-cols-2 gap-3 sm:auto-rows-[18rem] lg:grid-cols-4`}>
          {gallery.map((item, index) => (
            <li key={item.src} className={`reveal ${"wide" in item && item.wide ? "col-span-2" : ""}`}>
              <button
                type="button"
                data-shot
                onClick={() => setOpen(index)}
                aria-label={`Open photo: ${item.alt}`}
                className="group tile-link bevel relative block size-full overflow-hidden border border-white/10"
              >
                <Image
                  src={item.src}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
                <span className="chip absolute bottom-3 left-3">{item.tag}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <AnimatePresence>
        {shown ? (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={shown.alt}
            className="fixed inset-0 z-[80] grid place-items-center bg-ink/95 p-4 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            <div className="relative h-[72svh] w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
              <Image src={shown.src} alt={shown.alt} fill sizes="100vw" className="object-contain" />
            </div>
            <p className="font-display text-paper uppercase">{shown.tag}</p>
            <button type="button" autoFocus aria-label="Close photo" className="bevel absolute top-4 right-4 grid size-11 place-items-center border border-white/25 bg-ink text-paper" onClick={() => setOpen(null)}>
              <X size={20} aria-hidden="true" />
            </button>
            <button type="button" aria-label="Previous photo" className="bevel absolute bottom-4 left-4 grid size-11 place-items-center border border-white/25 bg-ink text-paper" onClick={(event) => { event.stopPropagation(); setOpen(((open ?? 0) - 1 + count) % count); }}>
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button type="button" aria-label="Next photo" className="bevel absolute right-4 bottom-4 grid size-11 place-items-center border border-white/25 bg-ink text-paper" onClick={(event) => { event.stopPropagation(); setOpen(((open ?? 0) + 1) % count); }}>
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
