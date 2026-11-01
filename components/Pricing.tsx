"use client";

import { BadgePercent, Car, Clock, Crown, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BookButton } from "@/components/BookSlot";
import { WhatsAppButton } from "@/components/ContactButtons";
import { SectionIntro } from "@/components/SectionIntro";
import { useLivePrices } from "@/components/useLivePrices";
import { formatRupees } from "@/lib/format";
import { messages, offers } from "@/lib/site";

const MAX_HOURS = 8;

export function Pricing({ heading = true }: { heading?: boolean }) {
  const prices = useLivePrices();
  const [modeKey, setModeKey] = useState("station");
  const [hours, setHours] = useState(2);
  const modes = [
    { key: "station", label: "PS5 station", detail: "Stations 01 to 04 on the main floor.", rupees: prices.station, icon: Clock, station: undefined },
    { key: "simulator", label: "Car simulator", detail: "Station 05. The driving simulator on the main floor.", rupees: prices.simulator, icon: Car, station: "05" },
    { key: "private", label: "Private room", detail: "Station 06. The room and the PS5 are yours for the session.", rupees: prices.privateRoom, icon: Crown, station: "06" },
  ];
  const mode = modes.find((item) => item.key === modeKey) ?? modes[0];

  return (
    <section id="pricing" className="py-20 sm:py-28">
      <div className="shell">
        {heading ? (
          <SectionIntro
            eyebrow="Pricing"
            title={
              <>
                Select your <span className="text-gradient">mode.</span>
              </>
            }
            action={
              <Link href="/pricing" className="btn btn-secondary">
                Rates and membership
              </Link>
            }
          >
            {formatRupees(prices.station)} an hour on a PS5, {formatRupees(prices.simulator)} on the car simulator, and {formatRupees(prices.privateRoom)} in the private room. Memberships are monthly, quarterly, or yearly.
          </SectionIntro>
        ) : null}

        <div className={`${heading ? "mt-12" : ""} grid gap-4 md:grid-cols-3`} role="group" aria-label="Choose a mode">
          {modes.map((item) => {
            const Icon = item.icon;
            const selected = item.key === mode.key;
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={selected}
                onClick={() => setModeKey(item.key)}
                className={`roster panel p-6 text-left sm:p-7 ${selected ? "is-active" : ""}`}
              >
                <span className="icon-well">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="mt-5 block font-display text-2xl text-paper uppercase">{item.label}</span>
                <span className="mt-2 block min-h-10 text-sm leading-relaxed text-mist">{item.detail}</span>
                <span className="mt-5 block font-tech text-5xl leading-none text-paper">{formatRupees(item.rupees)}</span>
                <span className="mt-2 block text-xs tracking-[0.18em] text-cyan uppercase">per hour</span>
              </button>
            );
          })}
        </div>

        <div className="panel panel-featured mt-4 grid items-center gap-6 p-6 sm:p-8 md:grid-cols-[1fr_auto_auto]">
          <div>
            <p className="font-display text-sm tracking-[0.18em] text-cyan uppercase">Session calculator</p>
            <div className="mt-3 flex items-center gap-3">
              <button type="button" className="bevel grid size-11 place-items-center border border-white/20 text-paper disabled:opacity-40" aria-label="One hour less" disabled={hours <= 1} onClick={() => setHours(hours - 1)}>
                <Minus size={16} aria-hidden="true" />
              </button>
              <p className="min-w-28 text-center font-display text-2xl text-paper uppercase" aria-live="polite">
                {hours} {hours === 1 ? "hour" : "hours"}
              </p>
              <button type="button" className="bevel grid size-11 place-items-center border border-white/20 text-paper disabled:opacity-40" aria-label="One hour more" disabled={hours >= MAX_HOURS} onClick={() => setHours(hours + 1)}>
                <Plus size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div>
            <p className="text-sm text-mist">{mode.label} total</p>
            <p data-total className="mt-1 font-tech text-5xl leading-none text-paper">{formatRupees(mode.rupees * hours)}</p>
          </div>
          <BookButton station={mode.station}>Book this session</BookButton>
        </div>

        <div className="reveal panel mt-4 flex flex-col gap-6 p-6 sm:p-7 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-4">
            <span className="icon-well">
              <BadgePercent size={18} aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-2xl text-paper uppercase">Special offers</h3>
              {offers.length ? (
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  {offers.map((offer) => (
                    <li key={offer.title}>
                      <p className="font-semibold text-paper">{offer.title}</p>
                      <p className="text-sm text-mist">{offer.body}</p>
                      {offer.code ? <p className="mt-1 font-tech text-xs text-cyan">{offer.code}</p> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-mist">
                  Group deals and limited-time offers change through the month. Message us for what is running right now.
                </p>
              )}
            </div>
          </div>
          <WhatsAppButton message={messages.pricing} className="shrink-0">
            Get current offers
          </WhatsAppButton>
        </div>
      </div>
    </section>
  );
}
