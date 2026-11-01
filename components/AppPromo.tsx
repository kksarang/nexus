"use client";

import { Check, Smartphone } from "lucide-react";
import Image from "next/image";
import { BookButton } from "@/components/BookSlot";
import { useLivePrices } from "@/components/useLivePrices";
import { formatRupees } from "@/lib/format";
import { hourlyFor } from "@/lib/prices";
import { playStoreUrl, stations } from "@/lib/site";

export function PlayStoreButton({ className = "" }: { className?: string }) {
  if (!playStoreUrl) return null;
  return (
    <a href={playStoreUrl} target="_blank" rel="noopener noreferrer" className={`play-badge ${className}`.trim()}>
      <svg viewBox="0 0 24 24" className="size-7 shrink-0" aria-hidden="true">
        <path fill="#ee4bff" d="M4 2.5v19L20.5 12 4 2.5Z" />
      </svg>
      <span className="text-left leading-tight">
        <span className="block text-[0.65rem] tracking-[0.08em] text-mist uppercase">Get it on</span>
        <span className="block font-display text-lg text-paper">Google Play</span>
      </span>
    </a>
  );
}

const points = ["Book your session from your phone", "Pick your station and time", "Your booking, always in your pocket"];

export function AppPromo() {
  const prices = useLivePrices();
  const preview = [stations[0], stations[4], stations[5]];

  return (
    <section id="app" className="pb-20 sm:pb-28">
      <div className="shell">
        <div className="panel panel-featured relative grid items-center gap-10 overflow-hidden p-6 sm:p-10 lg:grid-cols-[1.2fr_0.8fr] lg:p-14">
          <div>
            <p className="eyebrow">Nexus Playzone mobile app</p>
            <h2 className="mt-5 text-[2.2rem] text-balance text-paper uppercase sm:text-5xl">
              Book from <span className="text-gradient">your phone.</span>
            </h2>
            <ul className="mt-6 grid gap-3">
              {points.map((point) => (
                <li key={point} className="flex items-center gap-2.5 text-paper">
                  <Check size={16} className="shrink-0 text-magenta" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              {playStoreUrl ? (
                <PlayStoreButton />
              ) : (
                <>
                  <p data-app-soon className="chip w-fit px-4 py-2 text-sm">
                    <Smartphone size={15} aria-hidden="true" />
                    Coming soon to Google Play
                  </p>
                  <BookButton variant="secondary" className="btn-sm">
                    Book on the website
                  </BookButton>
                </>
              )}
            </div>
          </div>

          <div className="phone mx-auto" aria-hidden="true">
            <div className="phone-screen">
              <Image src="/brand/nexus-wordmark.png" alt="" width={1052} height={252} className="mx-auto mt-4 w-28" />
              <p className="mt-4 font-display text-sm text-paper uppercase">Book a session</p>
              <div className="mt-3 grid gap-2">
                {preview.map((station, index) => (
                  <div key={station.id} className={`phone-row ${index === 0 ? "is-active" : ""}`}>
                    <span className="font-tech text-sm text-paper">{station.id}</span>
                    <span className="min-w-0 flex-1 truncate text-[0.68rem] text-mist">{station.name}</span>
                    <span className="text-[0.68rem] font-semibold text-paper">{formatRupees(hourlyFor(station.id, prices))}</span>
                  </div>
                ))}
              </div>
              <div className="phone-cta">Book now</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
