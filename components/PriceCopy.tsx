"use client";

import { formatRupees } from "@/lib/format";
import { useLivePrices } from "@/components/useLivePrices";

export function RateChips() {
  const prices = useLivePrices();
  const shown = [
    ["PS5 · 01–04", prices.station],
    ["Car simulator · 05", prices.simulator],
    ["Private room · 06", prices.privateRoom],
  ] as const;
  return (
    <dl className="flex flex-wrap gap-2">
      {shown.map(([label, rupees]) => (
        <div key={label} className="rounded-lg border border-white/10 bg-[#101624] px-3 py-2">
          <dt className="text-xs text-mist">{label}</dt>
          <dd className="text-sm font-semibold text-paper">{formatRupees(rupees)} / hour</dd>
        </div>
      ))}
    </dl>
  );
}

export function StationsIntro() {
  const prices = useLivePrices();
  return (
    <>
      Stations 01 to 04 are PS5 consoles at {formatRupees(prices.station)} an hour. Station 05 is the car simulator at {formatRupees(prices.simulator)} an hour. Station 06 is the private room at {formatRupees(prices.privateRoom)} an hour.
    </>
  );
}

export function HeroRates() {
  const prices = useLivePrices();
  const shown = [
    ["PS5", prices.station],
    ["Car simulator", prices.simulator],
    ["Private room", prices.privateRoom],
  ] as const;
  return (
    <dl className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm">
      {shown.map(([label, rupees]) => (
        <div key={label} className="flex items-baseline gap-2">
          <dt className="text-paper/85">{label}</dt>
          <dd className="font-tech text-paper">{formatRupees(rupees)}/hr</dd>
        </div>
      ))}
    </dl>
  );
}
