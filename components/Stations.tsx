"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, type KeyboardEvent } from "react";
import { BookButton } from "@/components/BookSlot";
import { StatusPill } from "@/components/LiveStatus";
import { SectionIntro } from "@/components/SectionIntro";
import { useLivePrices } from "@/components/useLivePrices";
import { formatRupees } from "@/lib/format";
import { hourlyFor } from "@/lib/pricesCore";
import { stations } from "@/lib/site";

function zoneOf(station: (typeof stations)[number]) {
  if (station.privateRoom) return "Private room";
  return station.rate === "simulator" ? "Car simulator" : "Main floor";
}

function perksOf(station: (typeof stations)[number]) {
  if (station.privateRoom) return ["Your own room and PS5", "For friends, couples, and groups", "Book ahead"];
  if (station.rate === "simulator") return ["Car simulator", "On the main floor", "Book by the hour"];
  return ["New PlayStation 5", "Full game library", "Book by the hour"];
}

export function Stations({ heading = true }: { heading?: boolean }) {
  const prices = useLivePrices();
  const [activeId, setActiveId] = useState<string>(stations[0].id);
  const active = stations.find((station) => station.id === activeId) ?? stations[0];

  function onRosterKey(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = stations[(stations.indexOf(active) + step + stations.length) % stations.length];
    setActiveId(next.id);
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-station="${next.id}"]`)?.focus();
  }

  return (
    <section id="zones" className="py-20 sm:py-28">
      <div className="shell">
        {heading ? (
          <SectionIntro
            eyebrow="Station select"
            title={
              <>
                Choose your <span className="text-gradient">station.</span>
              </>
            }
            action={
              <Link href="/stations" className="btn btn-secondary">
                View all stations
              </Link>
            }
          >
            Four PS5 stations, one car simulator, and the private room. Choose a station when you book and we keep it ready for you.
          </SectionIntro>
        ) : null}

        <div className={`${heading ? "mt-12" : ""} grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]`}>
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-1" role="group" aria-label="Choose a station" onKeyDown={onRosterKey}>
            {stations.map((station) => {
              const selected = station.id === active.id;
              return (
                <button
                  key={station.id}
                  type="button"
                  data-station={station.id}
                  aria-pressed={selected}
                  onClick={() => setActiveId(station.id)}
                  onMouseEnter={() => setActiveId(station.id)}
                  className={`roster tile flex flex-col gap-1 p-3 text-left lg:flex-row lg:items-center lg:gap-4 lg:px-4 ${selected ? "is-active" : ""}`}
                >
                  <span className="font-tech text-xl text-paper lg:text-2xl">{station.id}</span>
                  <span className="min-w-0 font-display text-xs text-mist uppercase lg:text-sm">{station.name}</span>
                </button>
              );
            })}
          </div>

          <article className="panel panel-featured relative min-h-[32rem] overflow-hidden lg:min-h-[35rem]">
            <AnimatePresence mode="sync" initial={false}>
              <motion.div
                key={active.id}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <Image
                  src={active.image}
                  alt={active.alt}
                  fill
                  sizes="(min-width: 1024px) 70vw, 100vw"
                  className="object-cover"
                  style={{ objectPosition: active.objectPosition }}
                />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-transparent" />
            <div className="absolute top-4 right-4 left-4 flex items-start justify-between gap-3">
              <span className="chip">{zoneOf(active)}</span>
              <StatusPill id={active.id} className="bg-ink/70" />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
              <p className="font-tech text-6xl text-paper [text-shadow:0_0_30px_rgba(224,3,252,0.9)] sm:text-8xl">{active.id}</p>
              <h3 className="mt-2 text-3xl text-paper uppercase sm:text-5xl">{active.name}</h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-paper/85 sm:text-base">{active.summary}</p>
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-paper">
                {perksOf(active).map((perk) => (
                  <li key={perk} className="flex items-center gap-1.5">
                    <Check size={14} className="text-magenta" aria-hidden="true" />
                    {perk}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-4">
                <p className="text-sm text-mist">
                  <span className="font-tech text-3xl text-paper">{formatRupees(hourlyFor(active.id, prices))}</span> per hour
                </p>
                <div className="flex flex-wrap gap-2">
                  {active.privateRoom ? (
                    <Link href="/private-room" className="btn btn-secondary btn-sm">
                      Explore
                    </Link>
                  ) : null}
                  <BookButton station={active.id} className="btn-sm">
                    Select &amp; book
                  </BookButton>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
