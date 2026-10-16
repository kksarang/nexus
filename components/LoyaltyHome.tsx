import Link from "next/link";
import { POINT_MINUTES, REWARD_MINUTES, WEEKLY_TARGET } from "@/lib/loyalty";

export function LoyaltyHome() {
  return (
    <section className="py-20 sm:py-28">
      <div className="shell grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
        <div>
          <p className="text-[0.72rem] font-semibold tracking-[0.22em] text-cyan uppercase">Loyalty rewards</p>
          <h2 className="mt-3 text-4xl tracking-wide text-paper uppercase sm:text-5xl">Come back. The hours add up.</h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-mist sm:text-base">
            Paid play earns points at the counter. The card is shown there. This website does not open anyone’s points from a phone number.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-3">
          {[
            [`1 point`, `Every ${POINT_MINUTES} paid minutes. Leftover minutes carry forward.`],
            [`${WEEKLY_TARGET} points`, "Earned Monday 00:00 to Sunday 23:59, India time."],
            [`${REWARD_MINUTES} min`, "One free session that week. Lifetime points stay on the card."],
          ].map(([title, body]) => (
            <li key={title} className="border border-white/10 bg-[#101624] p-4">
              <p className="font-tech text-xl text-paper">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-mist">{body}</p>
            </li>
          ))}
        </ul>
        <Link href="/player" className="text-sm text-cyan hover:text-paper lg:col-span-2">
          How the player card works
        </Link>
      </div>
    </section>
  );
}
