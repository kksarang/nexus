"use client";

import { useLivePrices } from "@/components/useLivePrices";
import { formatRupees } from "@/lib/format";
import { memberPlans } from "@/lib/pricesCore";

export function MembershipCompare() {
  const prices = useLivePrices();
  const plans = memberPlans(prices);
  const rows: [string, (plan: (typeof plans)[number]) => string][] = [
    ["Price", (plan) => formatRupees(plan.rupees)],
    ["Sessions", (plan) => `${plan.sessions}`],
    ["Valid for", (plan) => (plan.months === 1 ? "1 month" : `${plan.months} months`)],
    ["Per session", (plan) => formatRupees(Math.round(plan.rupees / plan.sessions))],
    ["Walk-in cost", (plan) => formatRupees(prices.station * plan.sessions)],
    ["You save", (plan) => formatRupees(Math.max(0, prices.station * plan.sessions - plan.rupees))],
    ["Stations", () => "01 to 04"],
  ];
  return (
    <section className="pb-20 sm:pb-28">
      <div className="shell">
        <h2 className="text-3xl text-paper uppercase sm:text-4xl">
          Compare <span className="text-gradient">plans.</span>
        </h2>
        <div className="panel mt-6 overflow-x-auto">
          <table data-compare className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-white/15">
                <th scope="col" className="p-4 font-normal text-mist">Plan</th>
                {plans.map((plan) => (
                  <th key={plan.id} scope="col" className="p-4 font-display text-base text-paper uppercase">{plan.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label} className="border-b border-white/10 last:border-0">
                  <th scope="row" className="p-4 font-normal text-mist">{label}</th>
                  {plans.map((plan) => (
                    <td key={plan.id} className="p-4 font-semibold text-paper">{value(plan)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
