import { REWARD_MINUTES, WEEKLY_TARGET, pointsProgress } from "@/lib/loyalty";
import type { CustomerProfile } from "@/lib/loyaltyApi";

function hoursLabel(minutes: number) {
  const hours = minutes / 60;
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

export function PlayerCard({ customer }: { customer: CustomerProfile }) {
  const progress = pointsProgress(customer.weeklyPoints, customer.rewardRedeemed);
  const shown = Math.min(customer.weeklyPoints, WEEKLY_TARGET);

  return (
    <article className="overflow-hidden rounded-3xl border border-violet/40 bg-navy">
      <div className="bg-gradient-to-r from-violet/30 via-blue/20 to-transparent px-5 py-4">
        <p className="font-tech text-[0.62rem] tracking-[0.28em] text-violet uppercase">Nexus Playzone</p>
        <h2 className="mt-1 text-3xl tracking-wide text-paper uppercase">Player card</h2>
        <p className="mt-1 text-lg text-paper">{customer.name}</p>
      </div>
      <div className="grid gap-5 p-5">
        <div>
          <div className="flex items-end justify-between gap-3">
            <p className="text-[0.65rem] tracking-[0.18em] text-mist uppercase">Weekly progress</p>
            <p className="font-tech text-2xl text-paper">
              {shown} / {WEEKLY_TARGET}
            </p>
          </div>
          <div className="mt-3 h-2 bg-white/10">
            <div className="h-2 bg-gradient-to-r from-violet to-magenta" style={{ width: `${progress.percent}%` }} />
          </div>
          <p className="mt-3 text-sm text-paper">
            {customer.rewardRedeemed
              ? "This week's free session is already used."
              : progress.ready
                ? `Free ${REWARD_MINUTES}-minute session is ready at the counter.`
                : `${progress.remaining} more point${progress.remaining === 1 ? "" : "s"} to unlock a free ${REWARD_MINUTES}-minute session.`}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-3">
          <div className="border border-white/10 px-4 py-3">
            <dt className="text-[0.62rem] tracking-[0.16em] text-mist uppercase">Lifetime playtime</dt>
            <dd className="mt-1 font-tech text-3xl text-paper">{hoursLabel(customer.lifetimeMinutes)} hrs</dd>
          </div>
          <div className="border border-white/10 px-4 py-3">
            <dt className="text-[0.62rem] tracking-[0.16em] text-mist uppercase">Lifetime points</dt>
            <dd className="mt-1 font-tech text-3xl text-paper">{customer.lifetimePoints}</dd>
          </div>
        </dl>
        <p className="text-sm text-mist">
          Next reward: {REWARD_MINUTES} minutes of free gaming after {WEEKLY_TARGET} points in the Monday–Sunday week.
          {customer.bankedMinutes > 0 ? ` ${customer.bankedMinutes} paid minutes are saved toward the next point.` : ""}
        </p>
      </div>
    </article>
  );
}
