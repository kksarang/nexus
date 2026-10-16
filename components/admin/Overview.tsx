"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DeskNote, RangeBar } from "@/components/admin/RangeBar";
import { useDesk } from "@/components/admin/AdminShell";
import { closedSessions, dailyTotals, hourTotals, hoursLabel, inRange, playerKind, stationTotals, type OpsSession } from "@/lib/adminStats";
import { istDayStart, WEEKLY_TARGET } from "@/lib/loyalty";

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

function recordedTotal(sessions: OpsSession[]) {
  return sessions.reduce((total, session) => total + (session.amountRecorded ? session.amountRupees : 0), 0);
}

export function Overview() {
  const desk = useDesk();
  const [now, setNow] = useState(0);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setNow(Date.now()));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  const data = desk.data;
  const todayStart = now ? istDayStart(now) : 0;
  const yesterdayStart = todayStart ? todayStart - 24 * 60 * 60 * 1000 : 0;
  const todaySessions = data && todayStart ? closedSessions(data.sessions, todayStart, now) : [];
  const yesterdaySessions = data && yesterdayStart ? closedSessions(data.sessions, yesterdayStart, todayStart - 1) : [];
  const todayPlayers = new Set(todaySessions.map((session) => session.customerId).filter(Boolean));
  const todayRevenue = recordedTotal(todaySessions);
  const yesterdayRevenue = recordedTotal(yesterdaySessions);
  const sessions = data ? closedSessions(data.sessions, desk.from, desk.to) : [];
  const days = data ? dailyTotals(data.sessions, desk.from, desk.to) : [];
  const stations = data ? stationTotals(data.sessions, desk.from, desk.to) : [];
  const hours = data ? hourTotals(data.sessions, desk.from, desk.to) : [];
  const amount = recordedTotal(sessions);
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
          Hours, sessions, and points come from saved Firestore sessions. Revenue counts only when staff record an amount collected. A rate times hours is not treated as money received.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card label="Recorded revenue today" value={`₹${todayRevenue.toLocaleString("en-IN")}`} note={yesterdayStart ? `Yesterday ₹${yesterdayRevenue.toLocaleString("en-IN")}.` : "Waiting for the clock."} />
        <Card label="Paid sessions today" value={String(todaySessions.length)} note={`${yesterdaySessions.length} completed yesterday.`} />
        <Card label="Paid hours today" value={`${hoursLabel(todaySessions.reduce((total, session) => total + session.paidMinutes, 0))} h`} note={`${hoursLabel(yesterdaySessions.reduce((total, session) => total + session.paidMinutes, 0))} h yesterday.`} />
        <Card label="Customers who played" value={String(todayPlayers.size)} note="Unique players on completed sessions today." />
        <Card label="New customers today" value={String((data?.players ?? []).filter((player) => player.createdAt >= todayStart && player.createdAt <= now).length)} note="Registrations since midnight IST." />
        <Card label="Active sessions" value={String(data?.active.length ?? 0)} note="Running now. Not counted as finished revenue." />
        <Card label="Points earned today" value={String(todaySessions.reduce((total, session) => total + session.points, 0))} note={`${yesterdaySessions.reduce((total, session) => total + session.points, 0)} yesterday.`} />
        <Card label="Rewards redeemed today" value={String((data?.weeks ?? []).filter((week) => week.redeemedAt && week.redeemedAt >= todayStart && week.redeemedAt <= now).length)} note={`A reward is ${WEEKLY_TARGET} weekly points, not a payment.`} />
      </div>
      <RangeBar />
      <DeskNote />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Card label="Recorded revenue" value={`₹${amount.toLocaleString("en-IN")}`} note={recordedPayments ? `${recordedPayments} sessions stored a collected amount in this range.` : "No collected amount was recorded in this range."} />
        <Card label="Paid hours" value={`${hoursLabel(minutes)} h`} note="Completed paid minutes in the selected range." />
        <Card label="Registered players" value={String(data?.players.length ?? 0)} note={`${createdInRange.length} registered in this range.`} />
        <Card label="Sessions completed" value={String(sessions.length)} note={`${data?.active.length ?? 0} still running.`} />
        <Card label="Points earned" value={String(points)} note="Awarded when a session is closed. One point per 60 paid minutes." />
        <Card label="Rewards redeemed" value={String(rewards)} note="Free sessions are not added to revenue." />
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/room" className="btn btn-primary">Start a session</Link>
        <Link href="/admin/players" className="btn btn-secondary">View all players</Link>
        <Link href="/admin/sessions" className="btn btn-secondary">View active sessions</Link>
        <Link href="/admin/loyalty" className="btn btn-secondary">View rewards</Link>
        <Link href="/admin/reports" className="btn btn-secondary">Open reports</Link>
        <Link href="/admin/revenue" className="btn btn-secondary">Revenue</Link>
      </div>
      <section className="rounded-2xl border border-white/10 bg-[#101624] p-4">
        <h2 className="text-xl text-paper">Customers</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card label="Registered" value={String(data?.players.length ?? 0)} note="All customer records loaded." />
          <Card label="New players" value={String(now ? (data?.players ?? []).filter((player) => playerKind(player, now) === "new").length : 0)} note="Registered in the last 30 days with fewer than two sessions." />
          <Card label="Inactive" value={String(now ? (data?.players ?? []).filter((player) => playerKind(player, now) === "inactive").length : 0)} note="No play in the last 30 days, or never played after the first month." />
          <Card label="Frequent" value={String(now ? (data?.players ?? []).filter((player) => playerKind(player, now) === "frequent").length : 0)} note="Eight sessions, or 10 paid hours." />
        </div>
        <div className="mt-4 grid gap-2">
          {[...(data?.players ?? [])].sort((a, b) => b.lifetimeMinutes - a.lifetimeMinutes).slice(0, 5).map((player) => (
            <Link key={player.id} href={`/admin/players/${player.id}`} className="flex items-center justify-between rounded-xl px-2 py-2 text-sm hover:bg-white/5">
              <span className="text-paper">{player.name}</span>
              <span className="text-mist">{hoursLabel(player.lifetimeMinutes)} h · {player.lifetimePoints} pts</span>
            </Link>
          ))}
        </div>
      </section>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-[#101624] p-4">
          <h2 className="text-xl text-paper">Recorded revenue by day</h2>
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
