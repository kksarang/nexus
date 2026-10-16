import { Check } from "lucide-react";
import Link from "next/link";
import { SectionIntro } from "@/components/SectionIntro";
import { formatRupees } from "@/lib/format";
import { memberships } from "@/lib/site";

export function Membership() {
  const plan = memberships[0];
  const each = plan.rupees / plan.sessions;

  return (
    <section id="membership" className="border-t border-white/10 bg-navy/40 py-20 sm:py-28">
      <div className="shell">
        <SectionIntro
          eyebrow="Monthly plan"
          title={
            <>
              {formatRupees(plan.rupees)} for <span className="text-gradient">{plan.sessions} sessions.</span>
            </>
          }
        >
          A PS5 station is {formatRupees(160)} an hour if you walk in. This plan brings Stations 01 to 04
          to {formatRupees(each)} a session. The car simulator stays {formatRupees(180)} an hour.
        </SectionIntro>

        <article className="panel panel-featured mt-12 grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[auto_1fr_auto]">
          <div>
            <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-cyan uppercase">Each month</p>
            <p className="mt-2 font-tech text-6xl leading-none text-paper sm:text-7xl">{formatRupees(plan.rupees)}</p>
            <p className="mt-3 text-sm text-mist">
              {plan.sessions} sessions · {formatRupees(each)} each
            </p>
          </div>
          <ul className="grid gap-3">
            {plan.perks.map((perk) => (
              <li key={perk} className="flex items-start gap-2 text-sm text-paper">
                <Check size={16} className="mt-0.5 shrink-0 text-cyan" aria-hidden="true" />
                {perk}
              </li>
            ))}
            <li className="flex items-start gap-2 text-sm text-paper">
              <Check size={16} className="mt-0.5 shrink-0 text-cyan" aria-hidden="true" />
              Saves {formatRupees(160 * plan.sessions - plan.rupees)} against {plan.sessions} walk-in hours
            </li>
          </ul>
          <div className="grid gap-2 lg:justify-items-end">
            <Link href={`/book?plan=${plan.key}`} className="btn btn-primary w-full lg:w-auto">
              Ask to join
            </Link>
            <p className="text-xs text-mist lg:text-right">Pay and join at the counter.</p>
          </div>
        </article>
      </div>
    </section>
  );
}
