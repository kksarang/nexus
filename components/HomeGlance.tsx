"use client";

import { ArrowRight, MapPin, MessageCircle, Navigation, Phone, Trophy } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useLivePrices } from "@/components/useLivePrices";
import { formatRupees } from "@/lib/format";
import { REWARD_MINUTES, WEEKLY_TARGET } from "@/lib/loyalty";
import { gameGenres, games, hours, messages, site, whatsappLink } from "@/lib/site";

function More({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan hover:text-paper">
      {children}
      <ArrowRight size={15} aria-hidden="true" />
    </Link>
  );
}

const action = "bevel inline-flex min-h-11 flex-1 items-center justify-center gap-2 border border-white/15 px-3 text-sm font-semibold whitespace-nowrap text-paper transition-colors hover:border-magenta";

export function HomeGlance() {
  const prices = useLivePrices();
  const rates = [
    { label: "PS5 station", note: "Stations 01–04", rupees: prices.station },
    { label: "Car simulator", note: "Station 05", rupees: prices.simulator },
    { label: "Private room", note: "Station 06", rupees: prices.privateRoom },
  ];

  return (
    <section className="py-16 sm:py-20">
      <div className="shell">
        <p className="eyebrow">Quick look</p>
        <h2 className="mt-5 text-[2.2rem] text-paper uppercase sm:text-5xl">
          The essentials, <span className="text-gradient">at a glance.</span>
        </h2>
        <div className="mt-10 grid gap-4 lg:grid-cols-12">
          <article className="panel flex flex-col justify-between gap-6 p-6 sm:p-8 lg:col-span-7">
            <div className="grid gap-5 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-white/10">
              {rates.map((rate) => (
                <div key={rate.label} className="sm:px-6 sm:first:pl-0 sm:last:pr-0">
                  <p className="font-tech text-4xl text-paper xl:text-5xl">{formatRupees(rate.rupees)}</p>
                  <p className="mt-2 font-display text-paper uppercase">{rate.label}</p>
                  <p className="mt-0.5 text-sm text-mist">{rate.note} · per hour</p>
                </div>
              ))}
            </div>
            <More href="/pricing">See pricing</More>
          </article>

          <article className="panel panel-featured flex flex-col justify-between gap-6 p-6 sm:p-8 lg:col-span-5">
            <div>
              <div className="flex items-start justify-between gap-4">
                <p className="font-display text-2xl text-paper uppercase sm:text-3xl">
                  {WEEKLY_TARGET} hours a week. <span className="text-gradient">{REWARD_MINUTES} minutes free.</span>
                </p>
                <Trophy size={26} className="shrink-0 text-magenta" aria-hidden="true" />
              </div>
              <div className="mt-5 grid gap-1.5 px-1" style={{ gridTemplateColumns: `repeat(${WEEKLY_TARGET}, minmax(0, 1fr))` }} aria-hidden="true">
                {Array.from({ length: WEEKLY_TARGET }, (_, cell) => (
                  <span key={cell} className="xp-cell" />
                ))}
              </div>
            </div>
            <More href="/player">How rewards work</More>
          </article>

          <article className="panel flex flex-col justify-between gap-6 p-6 sm:p-8 lg:col-span-7">
            <div>
              <p className="font-display text-2xl text-paper uppercase sm:text-3xl">
                <span className="font-tech text-4xl xl:text-5xl">{games.length}</span> games across every genre
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {gameGenres
                  .filter((genre) => genre !== "All")
                  .map((genre) => (
                    <li key={genre} className="chip px-3 py-1.5 text-xs">{genre}</li>
                  ))}
              </ul>
            </div>
            <More href="/games">Browse games</More>
          </article>

          <article className="panel flex flex-col justify-between gap-6 p-6 sm:p-8 lg:col-span-5">
            <div>
              <p className="flex items-center gap-2 font-display text-2xl text-paper uppercase sm:text-3xl">
                <MapPin size={24} className="shrink-0 text-magenta" aria-hidden="true" />
                Panoor, Kannur
              </p>
              <p className="mt-2 text-sm text-mist">
                A short trip from Thalassery. {hours.length ? hours.map((row) => `${row.days}: ${row.time}`).join(", ") : "Call or WhatsApp to check today’s hours."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={`tel:${site.phoneTel}`} className={action}>
                <Phone size={15} className="text-magenta" aria-hidden="true" /> Call
              </a>
              <a href={whatsappLink(messages.book)} target="_blank" rel="noopener noreferrer" className={action}>
                <MessageCircle size={15} className="text-magenta" aria-hidden="true" /> WhatsApp
              </a>
              <a href={site.directions} target="_blank" rel="noopener noreferrer" className={action}>
                <Navigation size={15} className="text-magenta" aria-hidden="true" /> Directions
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
