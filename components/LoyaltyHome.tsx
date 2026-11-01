import Link from "next/link";
import { LoyaltySim } from "@/components/LoyaltySim";
import { SectionIntro } from "@/components/SectionIntro";
import { POINT_MINUTES, REWARD_MINUTES, WEEKLY_TARGET } from "@/lib/loyalty";

export function LoyaltyHome() {
  return (
    <section className="py-20 sm:py-28">
      <div className="shell">
        <SectionIntro
          eyebrow="Loyalty XP"
          title={
            <>
              Come back. <span className="text-gradient">The hours add up.</span>
            </>
          }
        >
          Paid play earns points at the counter. The card is shown there. This website does not open anyone’s points from a phone number.
        </SectionIntro>
        <div className="mt-10">
          <LoyaltySim />
        </div>
        <ul className="mt-6 grid gap-5 sm:grid-cols-3">
          {[
            [`1 point`, `Every ${POINT_MINUTES} paid minutes. Leftover minutes carry forward.`],
            [`${WEEKLY_TARGET} points`, "Earned Monday 00:00 to Sunday 23:59, India time."],
            [`${REWARD_MINUTES} min`, "One free session that week. Those minutes do not earn points. Lifetime points stay on the card."],
          ].map(([title, body]) => (
            <li key={title}>
              <p className="font-tech text-xl text-paper">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-mist">{body}</p>
            </li>
          ))}
        </ul>
        <Link href="/player" className="mt-5 inline-block text-sm text-cyan hover:text-paper">
          How the player card works →
        </Link>
      </div>
    </section>
  );
}
