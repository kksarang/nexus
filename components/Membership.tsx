"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { SectionIntro } from "@/components/SectionIntro";
import { useLivePrices } from "@/components/useLivePrices";
import { formatRupees } from "@/lib/format";
import { memberPlans } from "@/lib/prices";

export function Membership({ heading = true }: { heading?: boolean }) {
  const prices = useLivePrices();
  const plans = memberPlans(prices);
  const eachOf = (plan: (typeof plans)[number]) => (plan.sessions ? Math.round(plan.rupees / plan.sessions) : 0);
  const lowest = Math.min(...plans.map(eachOf));

  return (
    <section id="membership" className={heading ? "band py-16 sm:py-20" : "py-16 sm:py-20"}>
      <div className="shell">
        {heading ? (
          <SectionIntro
            eyebrow="Membership"
            title={
              <>
                Play more. <span className="text-gradient">Pay less.</span>
              </>
            }
            action={
              <Link href="/membership" className="btn btn-secondary">
                Compare plans
              </Link>
            }
          >
            A walk-in PS5 hour is {formatRupees(prices.station)}. A plan covers Stations 01 to 04. The car simulator
            stays {formatRupees(prices.simulator)} an hour and the private room stays {formatRupees(prices.privateRoom)}.
          </SectionIntro>
        ) : null}

        <ul className={`${heading ? "mt-10" : ""} grid gap-4 lg:grid-cols-3`}>
          {plans.map((item) => {
            const each = eachOf(item);
            const saved = prices.station * item.sessions - item.rupees;
            const length = item.months === 1 ? "1 month" : `${item.months} months`;
            const best = each === lowest;
            return (
              <li key={item.id}>
                <article className={`panel panel-hover relative flex h-full flex-col p-6 sm:p-8 ${best ? "panel-featured" : ""}`}>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-2xl text-paper uppercase">{item.label}</h3>
                    {best ? <span className="chip border-magenta/60 text-paper">Lowest per session</span> : null}
                  </div>
                  <p data-plan-price className="mt-6 font-tech text-5xl leading-none text-paper">{formatRupees(item.rupees)}</p>
                  <p className="mt-2 text-sm text-mist">for {length}</p>
                  {saved > 0 ? (
                    <p className="mt-4 text-sm font-semibold text-[#3BFF9D]">You save {formatRupees(saved)} against walk-in hours</p>
                  ) : null}
                  <ul className="mt-5 grid flex-1 content-start gap-2.5 border-t border-white/10 pt-5">
                    {[`${item.sessions} sessions on Stations 01 to 04`, `${formatRupees(each)} per session, walk-in hour ${formatRupees(prices.station)}`, `Valid for ${length}`].map((perk) => (
                      <li key={perk} className="flex items-start gap-2 text-sm text-paper">
                        <Check size={16} className="mt-0.5 shrink-0 text-magenta" aria-hidden="true" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                  <Link href={`/book?plan=${item.id}`} className={`btn mt-7 w-full ${best ? "btn-primary" : "btn-secondary"}`}>
                    Ask to join
                  </Link>
                </article>
              </li>
            );
          })}
        </ul>
        <p className="mt-5 text-sm text-mist">Pay and join at the counter. Changing a plan price does not change members who already joined.</p>
      </div>
    </section>
  );
}
