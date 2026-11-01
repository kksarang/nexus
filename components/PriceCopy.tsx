"use client";

import { formatRupees } from "@/lib/format";
import { useLivePrices } from "@/components/useLivePrices";
import { memberPlans } from "@/lib/prices";
import { games } from "@/lib/site";

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
        <div key={label} className="tile px-3 py-2">
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

export function HomeStats() {
  const prices = useLivePrices();
  const lowest = Math.min(...memberPlans(prices).map((plan) => Math.round(plan.rupees / plan.sessions)));
  const shown = [
    ["06", "Gaming stations"],
    ["01", "Private room"],
    [`${games.length}`, "Games"],
    [formatRupees(prices.station), "Per hour, from"],
    [formatRupees(lowest), "Member session, from"],
    ["Panoor", "Kannur, Kerala"],
  ];
  return (
    <section className="border-y border-white/10 bg-navy/70">
      <dl className="shell grid grid-cols-2 gap-x-4 sm:grid-cols-3 xl:grid-cols-6">
        {shown.map(([value, label]) => (
          <div key={label} className="py-6 sm:py-8">
            <dd className="font-tech text-2xl text-paper sm:text-4xl">{value}</dd>
            <dt className="mt-1.5 text-xs tracking-[0.14em] text-mist uppercase">{label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
