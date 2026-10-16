"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { SectionIntro } from "@/components/SectionIntro";
import { useLivePrices } from "@/components/useLivePrices";
import { formatRupees } from "@/lib/format";
import { memberPlans } from "@/lib/prices";

export function Membership() {
  const prices = useLivePrices();
  const plans = memberPlans(prices);

  return (
    <section id="membership" className="border-t border-white/10 bg-navy/40 py-20 sm:py-28">
      <div className="shell">
        <SectionIntro
          eyebrow="Membership"
          title={
            <>
              Monthly, quarterly, <span className="text-gradient">or yearly.</span>
            </>
          }
        >
          A walk-in PS5 hour is {formatRupees(prices.station)}. A plan covers Stations 01 to 04. The car simulator
          stays {formatRupees(prices.simulator)} an hour and the private room stays {formatRupees(prices.privateRoom)}.
        </SectionIntro>

        <ul className="mt-12 grid gap-5 lg:grid-cols-3">
          {plans.map((item) => {
            const each = item.sessions ? Math.round(item.rupees / item.sessions) : 0;
            const saved = prices.station * item.sessions - item.rupees;
            const length = item.months === 1 ? "1 month" : item.months === 3 ? "3 months" : "12 months";
            return (
              <li key={item.id}>
                <article className={`panel flex h-full flex-col p-6 sm:p-8 ${item.id === "quarterly" ? "panel-featured" : ""}`}>
                  <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-cyan uppercase">{item.label}</p>
                  <p className="mt-3 font-tech text-5xl leading-none text-paper">{formatRupees(item.rupees)}</p>
                  <p className="mt-2 text-sm text-mist">{item.sessions} sessions · {length} · {formatRupees(each)} each</p>
                  <ul className="mt-6 grid flex-1 gap-3">
                    {[
                      `${item.sessions} plays on Stations 01 to 04`,
                      `Valid for ${length} from the start date`,
                      saved > 0 ? `Saves ${formatRupees(saved)} against walk-in hours` : "Stations 01 to 04",
                    ].map((perk) => (
                      <li key={perk} className="flex items-start gap-2 text-sm text-paper">
                        <Check size={16} className="mt-0.5 shrink-0 text-cyan" aria-hidden="true" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                  <Link href={`/book?plan=${item.id}`} className="btn btn-primary mt-8 w-full">
                    Ask to join
                  </Link>
                </article>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 text-sm text-mist">Pay and join at the counter. Changing a plan price does not change members who already joined.</p>
      </div>
    </section>
  );
}
