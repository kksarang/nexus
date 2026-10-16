"use client";

import { Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BookButton } from "@/components/BookSlot";
import { StatusLine, StatusPill } from "@/components/LiveStatus";
import { SectionIntro } from "@/components/SectionIntro";
import { useLivePrices } from "@/components/useLivePrices";
import { formatRupees } from "@/lib/format";
import { hourlyFor } from "@/lib/prices";
import { stations } from "@/lib/site";

function PriceTag({ rupees, unit }: { rupees: number | null | undefined; unit?: string }) {
  if (rupees == null) {
    return (
      <p className="text-sm text-mist">
        <span className="font-tech text-2xl text-white/40">₹ —</span>
        <span className="ml-2">{unit ?? "per hour"}</span>
      </p>
    );
  }
  return (
    <p className="text-sm text-mist">
      <span className="font-tech text-3xl text-paper">{formatRupees(rupees)}</span> {unit}
    </p>
  );
}

export function Stations({ heading = true }: { heading?: boolean }) {
  const prices = useLivePrices();
  const floor = stations.filter((station) => !station.privateRoom);
  const room = stations.find((station) => station.privateRoom);

  return (
    <section id="zones" className="py-20 sm:py-28">
      <div className="shell">
        {heading ? (
          <div className="reveal">
            <SectionIntro
              eyebrow="Gaming zones"
              title={
                <>
                  Six PS5 stations. <span className="text-gradient">Pick yours.</span>
                </>
              }
              action={
                <Link href="/stations" className="btn btn-secondary">
                  View all stations
                </Link>
              }
            >
              Four PS5 stations, one car simulator, and the private room. Choose a station
              when you book and we keep it ready for you.
            </SectionIntro>
          </div>
        ) : null}

        <div className={`${heading ? "mt-12" : ""} grid gap-5 sm:grid-cols-2 lg:grid-cols-3`}>
          {floor.map((station) => (
            <article key={station.id} className="reveal panel panel-hover group overflow-hidden">
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={station.image}
                  alt={station.alt}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  style={{ objectPosition: station.objectPosition }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/10 to-transparent" />
                <span className={`absolute top-4 left-4 chip ${station.rate === "simulator" ? "border-[#D6FF3F]/50 text-[#D6FF3F]" : ""}`}>
                  {station.rate === "simulator" ? "Car simulator" : "Main floor"}
                </span>
                <StatusPill id={station.id} className="absolute top-4 right-4" />
                <span className="absolute right-4 bottom-3 font-tech text-5xl text-white/90">{station.id}</span>
              </div>
              <div className="p-6">
                <h3 className="text-2xl tracking-wide text-paper uppercase">{station.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mist">{station.summary}</p>
                <StatusLine id={station.id} />
                <ul className="mt-4 space-y-1.5 text-sm text-paper/90">
                  {(station.rate === "simulator"
                    ? ["Car simulator", "₹180 an hour", "Book by the hour"]
                    : ["New PlayStation 5", "Full game library", "Book by the hour"]
                  ).map((perk) => (
                    <li key={perk} className="flex items-center gap-2">
                      <Check size={14} className="text-cyan" aria-hidden="true" />
                      {perk}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
                  <PriceTag rupees={hourlyFor(station.id, prices)} unit="per hour" />
                  <BookButton station={station.id} className="min-h-10 px-4">
                    Book
                  </BookButton>
                </div>
              </div>
            </article>
          ))}

          {room ? (
            <article className="reveal panel panel-featured panel-hover group overflow-hidden">
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={room.image}
                  alt={room.alt}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/10 to-transparent" />
                <span className="absolute top-4 left-4 chip border-magenta/50 text-magenta">Private room</span>
                <StatusPill id={room.id} className="absolute top-4 right-4" />
                <span className="absolute right-4 bottom-3 font-tech text-5xl text-white/90">{room.id}</span>
              </div>
              <div className="p-6">
                <h3 className="text-2xl tracking-wide text-paper uppercase">{room.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mist">{room.summary}</p>
                <StatusLine id={room.id} />
                <ul className="mt-4 space-y-1.5 text-sm text-paper/90">
                  {["Your own room and PS5", "For friends, couples, and groups", "Book ahead"].map((perk) => (
                    <li key={perk} className="flex items-center gap-2">
                      <Check size={14} className="text-magenta" aria-hidden="true" />
                      {perk}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
                  <PriceTag rupees={hourlyFor(room.id, prices)} unit="per hour" />
                  <Link href="/private-room" className="btn btn-primary min-h-10 px-4">
                    Explore
                  </Link>
                </div>
              </div>
            </article>
          ) : null}
        </div>
      </div>
    </section>
  );
}
