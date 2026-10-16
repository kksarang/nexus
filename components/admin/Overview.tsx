"use client";

import Link from "next/link";
import { DeskNote, RangeBar } from "@/components/admin/RangeBar";
import { useDesk } from "@/components/admin/AdminShell";
import { closedSessions, dailyTotals, hourTotals, hoursLabel, inRange, stationTotals } from "@/lib/adminStats";
import { WEEKLY_TARGET } from "@/lib/loyalty";

function Card({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#101624] p-4">
      <p className="text-[0.62rem] tracking-[0.16em] text-mist uppercase">{label}</p>
      <p className="mt-2 font-tech text-3xl text-paper">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-mist">{note}</p>
    </article>
  );
}

function Bars({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  if (!rows.length) return <p className="text-sm text-mist">Nothing in this range yet.</p>;
  return (
    <ul className="grid gap-2">
      {rows.map((row) => (
        <li key={row.label} className="grid grid-cols-[4.2rem_1fr_3.2rem] items-center gap-2 text-xs">
          <span className="truncate text-mist">{row.label}</span>
          <span className="h-2 bg-white/10">
            <span className="block h-2 bg-cyan" style={{ width: `${(row.value / max) * 100}%` }} />
          </span>
          <span className="text-right text-paper">{row.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function Overview() {
  const desk = useDesk();
  const data = desk.data;
  const sessions = data ? closedSessions(data.sessions, desk.from, desk.to) : [];
  const days = data ? dailyTotals(data.sessions, desk.from, desk.to) : [];
  const stations = data ? stationTotals(data.sessions, desk.from, desk.to) : [];
  const hours = data ? hourTotals(data.sessions, desk.from, desk.to) : [];
  const amount = sessions.reduce((total, session) => total + session.amountRupees, 0);
  const minutes = sessions.reduce((total, session) => total + session.paidMinutes, 0);
  const points = sessions.reduce((total, session) => total + session.points, 0);
  const rewards = data
    ? data.weeks.filter((week) => week.redeemedAt && inRange(week.redeemedAt, desk.from, desk.to)).length
    : 0;
  const playersInRange = new Set(sessions.map((session) => session.customerId).filter(Boolean));
  const createdInRange = (data?.players ?? []).filter((player) => player.createdAt && inRange(player.createdAt, desk.from, desk.to));
  const returning = [...playersInRange].filter((id) => {
    const player = data?.players.find((item) => item.id === id);
    return player && player.createdAt > 0 && player.createdAt < desk.from;
  }).length;
  const newcomers = [...playersInRange].filter((id) => createdInRange.some((player) => player.id === id)).length;
  const recordedPayments = sessions.filter((session) => session.amountRecorded).length;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-4xl tracking-wide text-paper uppercase sm:text-5xl">Overview</h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          Hours, sessions, and points come from saved Firestore sessions. Amounts are estimated from the hourly rate
          unless a session stored a recorded amount.
        </p>
      </div>
      <RangeBar />
      <DeskNote />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Card label="Estimated takings" value={`₹${amount.toLocaleString("en-IN")}`} note={recordedPayments ? `${recordedPayments} sessions stored an amount.` : "No separate payment records. This is rate × paid hours."} />
        <Card label="Paid hours" value={`${hoursLabel(minutes)} h`} note="Completed paid minutes in the selected range." />
        <Card label="Registered players" value={String(data?.players.length ?? 0)} note={`${createdInRange.length} registered in this range.`} />
        <Card label="Sessions completed" value={String(sessions.length)} note={`${data?.active.length ?? 0} still running.`} />
        <Card label="Points earned" value={String(points)} note="Awarded when a session is closed. One point per 60 paid minutes." />
        <Card label="Rewards redeemed" value={String(rewards)} note={`A reward is one free 30-minute session after ${WEEKLY_TARGET} weekly points.`} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/room" className="btn btn-primary">Start a session</Link>
        <Link href="/admin/players" className="btn btn-secondary">View all players</Link>
        <Link href="/admin/sessions" className="btn btn-secondary">View active sessions</Link>
        <Link href="/admin/loyalty" className="btn btn-secondary">View rewards</Link>
        <Link href="/admin/reports" className="btn btn-secondary">Open reports</Link>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-[#101624] p-4">
          <h2 className="text-xl text-paper">Estimated takings by day</h2>
          <div className="mt-4">
            <Bars rows={days.map((day) => ({ label: day.label, value: day.amount }))} />
          </div>
        </section>
        <section className="rounded-2xl border border-white/10 bg-[#101624] p-4">
          <h2 className="text-xl text-paper">Gaming hours by day</h2>
          <div className="mt-4">
            <Bars rows={days.map((day) => ({ label: day.label, value: Math.round(day.hours * 10) / 10 }))} />
          </div>
        </section>
        <section className="rounded-2xl border border-white/10 bg-[#101624] p-4">
          <h2 className="text-xl text-paper">New and returning players</h2>
          <div className="mt-4">
            <Bars rows={[{ label: "New", value: newcomers }, { label: "Returning", value: returning }]} />
          </div>
        </section>
        <section className="rounded-2xl border border-white/10 bg-[#101624] p-4">
          <h2 className="text-xl text-paper">Most-used consoles</h2>
          <div className="mt-4">
            <Bars rows={stations.map((station) => ({ label: station.id, value: station.sessions }))} />
          </div>
        </section>
        <section className="rounded-2xl border border-white/10 bg-[#101624] p-4">
          <h2 className="text-xl text-paper">Points and rewards</h2>
          <div className="mt-4">
            <Bars rows={[{ label: "Points", value: points }, { label: "Rewards", value: rewards }]} />
          </div>
          <p className="mt-3 text-xs text-mist">Rewards are a count of free sessions used. They are not subtracted from lifetime points.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-[#101624] p-4">
          <h2 className="text-xl text-paper">Sessions by hour</h2>
          <div className="mt-4 flex h-28 items-end gap-1">
            {hours.map((count, hour) => (
              <div key={hour} className="flex h-full flex-1 items-end" title={`${hour}:00 · ${count}`}>
                <div className="w-full bg-violet" style={{ height: `${(count / Math.max(1, ...hours)) * 100}%` }} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
