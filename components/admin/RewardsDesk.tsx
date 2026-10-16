"use client";

import Link from "next/link";
import { DeskNote } from "@/components/admin/RangeBar";
import { useDesk } from "@/components/admin/AdminShell";
import { hoursLabel } from "@/lib/adminStats";
import { REWARD_MINUTES, WEEKLY_TARGET } from "@/lib/loyalty";

export function RewardsDesk() {
  const desk = useDesk();
  const players = desk.data?.players ?? [];
  const weeks = desk.data?.weeks ?? [];
  const earned = players.reduce((total, player) => total + player.lifetimePoints, 0);
  const unlocked = weeks.filter((week) => week.points >= WEEKLY_TARGET);
  const ready = unlocked.filter((week) => !week.redeemedAt);
  const close = weeks.filter((week) => week.points >= WEEKLY_TARGET - 3 && week.points < WEEKLY_TARGET && !week.redeemedAt);
  const redeemed = weeks.filter((week) => week.redeemedAt);

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl tracking-wide text-paper uppercase">Loyalty and rewards</h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          One point for every 60 paid minutes. {WEEKLY_TARGET} points from Monday to Sunday IST unlocks {REWARD_MINUTES} free minutes.
          The free minutes earn no points and are used once, when that session is completed. Lifetime points stay on the card.
        </p>
      </div>
      <DeskNote />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[
          ["Lifetime points earned", String(earned)],
          ["Available balance", String(earned)],
          ["Outstanding weekly rewards", String(ready.length)],
          ["Close to this week's reward", String(close.length)],
          ["Unlocked this week", String(unlocked.length)],
          ["Redeemed this week", String(redeemed.length)],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-white/10 bg-[#101624] p-4">
            <p className="text-[0.62rem] tracking-[0.14em] text-mist uppercase">{label}</p>
            <p className="mt-2 font-tech text-3xl text-paper">{value}</p>
          </article>
        ))}
      </div>
      <p className="text-sm text-mist">Available balance matches lifetime points because a weekly reward is a free session, not a points purchase.</p>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="text-[0.62rem] tracking-[0.12em] text-mist uppercase">
            <tr>{["Player", "Week points", "Week hours", "Lifetime points", "Reward"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr>
          </thead>
          <tbody>
            {players.length ? players.map((player) => {
              const week = weeks.find((row) => row.customerId === player.id);
              const points = week?.points ?? player.weekPoints;
              const label = week?.redeemedAt ? "Used" : points >= WEEKLY_TARGET ? "Ready" : `${Math.max(0, WEEKLY_TARGET - points)} to go`;
              return (
                <tr key={player.id} className="border-t border-white/10">
                  <td className="px-3 py-3"><Link href={`/admin/players/${player.id}`} className="text-cyan">{player.name}</Link></td>
                  <td className="px-3 py-3">{points}{points > WEEKLY_TARGET ? ` · reward uses ${WEEKLY_TARGET}` : ` / ${WEEKLY_TARGET}`}</td>
                  <td className="px-3 py-3">{hoursLabel(week?.minutes ?? player.weekMinutes)}</td>
                  <td className="px-3 py-3">{player.lifetimePoints}</td>
                  <td className="px-3 py-3">{label}</td>
                </tr>
              );
            }) : <tr><td colSpan={5} className="px-3 py-6 text-mist">No players saved yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RedemptionsDesk() {
  const desk = useDesk();
  const players = desk.data?.players ?? [];
  const redeemed = (desk.data?.weeks ?? []).filter((week) => week.redeemedAt);

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl tracking-wide text-paper uppercase">Rewards and redemptions</h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          A redemption is the free 30-minute session unlocked by 10 points in the India week. It does not subtract lifetime points and it is not recorded revenue.
        </p>
      </div>
      <DeskNote />
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="text-[0.62rem] tracking-[0.12em] text-mist uppercase">
            <tr>{["Player", "Week points", "Redeemed"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr>
          </thead>
          <tbody>
            {redeemed.length ? redeemed.map((week) => {
              const player = players.find((item) => item.id === week.customerId);
              return (
                <tr key={`${week.customerId}-${week.redeemedAt}`} className="border-t border-white/10">
                  <td className="px-3 py-3">{player ? <Link href={`/admin/players/${player.id}`} className="text-cyan">{player.name}</Link> : week.customerId}</td>
                  <td className="px-3 py-3">{week.points}</td>
                  <td className="px-3 py-3 text-mist">{week.redeemedAt ? new Date(week.redeemedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—"}</td>
                </tr>
              );
            }) : <tr><td colSpan={3} className="px-3 py-6 text-mist">No rewards redeemed in the loaded weeks.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
