"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DeskNote, RangeBar } from "@/components/admin/RangeBar";
import { useDesk } from "@/components/admin/AdminShell";
import { closedSessions, dailyTotals, hourTotals, hoursLabel, inRange, playerKind, stationTotals, type OpsSession } from "@/lib/adminStats";
import { istDayStart, istHour, WEEKLY_TARGET } from "@/lib/loyalty";
import { listMemberships, type Membership } from "@/lib/membershipApi";

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

function hourLabel(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}${suffix}`;
}

function istClock(ms: number) {
  return new Date(ms).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" });
}

function ColumnChart({ rows }: { rows: { label: string; value: number; text: string }[] }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  if (!rows.some((row) => row.value > 0)) return <p className="text-sm text-mist">No collected amount yet today.</p>;
  return (
    <div className="flex h-44 items-end gap-1">
      {rows.map((row) => (
        <div key={row.label} className="flex h-full min-w-0 flex-1 flex-col justify-end" title={row.text}>
          <div className="w-full rounded-t bg-cyan" style={{ height: `${row.value ? Math.max(8, (row.value / max) * 100) : 0}%` }} />
          <span className="mt-1 truncate text-center text-[10px] text-mist">{row.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Overview() {
  const desk = useDesk();
  const [now, setNow] = useState(0);
  const [members, setMembers] = useState<Membership[]>([]);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 30000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    let cancel = false;
    void listMemberships()
      .then((list) => {
        if (!cancel) setMembers(list);
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, [desk.data]);
  const data = desk.data;
  const todayStart = now ? istDayStart(now) : 0;
  const yesterdayStart = todayStart ? todayStart - 24 * 60 * 60 * 1000 : 0;
  const todaySessions = data && todayStart ? closedSessions(data.sessions, todayStart, now) : [];
  const yesterdaySessions = data && yesterdayStart ? closedSessions(data.sessions, yesterdayStart, todayStart - 1) : [];
  const todayPlayers = new Set(todaySessions.map((session) => session.customerId).filter(Boolean));
  const todaySessionRevenue = recordedTotal(todaySessions);
  const todayMembers = members.filter((item) => {
    const paidAt = item.createdAt || item.startAt;
    return todayStart > 0 && paidAt >= todayStart && paidAt <= now && item.amountPaid > 0;
  });
  const todayMemberRevenue = todayMembers.reduce((total, item) => total + item.amountPaid, 0);
  const todayRevenue = todaySessionRevenue + todayMemberRevenue;
  const yesterdayRevenue = recordedTotal(yesterdaySessions);
  const currentHour = now ? istHour(now) : 0;
  const hourlyRevenue = Array.from({ length: currentHour + 1 }, (_, hour) => {
    const amount = todaySessions.reduce((total, session) => {
      if (!session.amountRecorded || istHour(session.endedAt) !== hour) return total;
      return total + session.amountRupees;
    }, 0);
    return { label: hourLabel(hour), value: amount, text: `${hourLabel(hour)} · ₹${amount.toLocaleString("en-IN")}` };
  });
  const customerBars = [...todaySessions.reduce((map, session) => {
    const key = session.customerId || session.name || session.id;
    const row = map.get(key) ?? { name: session.name || "Guest", sessions: 0, amount: 0 };
    row.sessions += 1;
    if (session.amountRecorded) row.amount += session.amountRupees;
    map.set(key, row);
    return map;
  }, new Map<string, { name: string; sessions: number; amount: number }>()).values()]
    .sort((a, b) => b.amount - a.amount || b.sessions - a.sessions)
    .slice(0, 8);
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
  const showRevenue = desk.canSee("revenue");
  const showCustomers = desk.canSee("customers");
  const showGaming = desk.canSee("gaming");
  const showLoyalty = desk.canSee("loyalty");
  const showReports = desk.canSee("reports");

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-4xl tracking-wide text-paper uppercase sm:text-5xl">Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          Today’s revenue follows the clock. It adds collected session amounts and membership payments from midnight IST until {now ? istClock(now) : "now"}, and refreshes every minute. Office staff do not see this page.
        </p>
      </div>
      <section className="grid gap-4 rounded-2xl border border-white/10 bg-[#101624] p-5 lg:grid-cols-[16rem_1fr]">
        <div>
          <p className="text-[0.62rem] tracking-[0.16em] text-mist uppercase">Today’s revenue</p>
          <p className="mt-2 font-tech text-5xl text-paper">₹{todayRevenue.toLocaleString("en-IN")}</p>
          <p className="mt-3 text-sm text-mist">Sessions ₹{todaySessionRevenue.toLocaleString("en-IN")} · Memberships ₹{todayMemberRevenue.toLocaleString("en-IN")}</p>
          <p className="mt-1 text-xs text-mist">{yesterdayStart ? `Yesterday’s sessions ₹${yesterdayRevenue.toLocaleString("en-IN")}.` : "Waiting for the clock."} {todayMembers.length} membership{todayMembers.length === 1 ? "" : "s"} added today.</p>
        </div>
        <div>
          <p className="text-sm text-paper">Collected by hour</p>
          <div className="mt-3">
            <ColumnChart rows={hourlyRevenue} />
          </div>
        </div>
      </section>
      <section className="rounded-2xl border border-white/10 bg-[#101624] p-5">
        <h2 className="text-xl text-paper">Customers today</h2>
        <p className="mt-1 text-sm text-mist">{todayPlayers.size} played · {(data?.players ?? []).filter((player) => player.createdAt >= todayStart && player.createdAt <= now).length} new registrations.</p>
        <div className="mt-4">
          {customerBars.length ? (
            <Bars rows={customerBars.map((row) => ({ label: row.name, value: customerBars.some((item) => item.amount > 0) ? row.amount : row.sessions }))} />
          ) : (
            <p className="text-sm text-mist">No completed customers yet today.</p>
          )}
        </div>
        {customerBars.length ? <p className="mt-2 text-xs text-mist">{customerBars.some((row) => row.amount > 0) ? "Bar length is rupees collected today." : "No money recorded yet. Bar length is the number of sessions."}</p> : null}
        {customerBars.length ? (
          <ul className="mt-3 grid gap-1 text-xs text-mist">
            {customerBars.map((row) => (
              <li key={row.name} className="flex justify-between gap-3">
                <span>{row.name}</span>
                <span>{row.sessions} session{row.sessions === 1 ? "" : "s"} · ₹{row.amount.toLocaleString("en-IN")}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card label="Paid sessions today" value={String(todaySessions.length)} note={`${yesterdaySessions.length} completed yesterday.`} />
        <Card label="Paid hours today" value={`${hoursLabel(todaySessions.reduce((total, session) => total + session.paidMinutes, 0))} h`} note={`${hoursLabel(yesterdaySessions.reduce((total, session) => total + session.paidMinutes, 0))} h yesterday.`} />
        <Card label="Customers who played" value={String(todayPlayers.size)} note="Unique players on completed sessions today." />
        <Card label="New customers today" value={String((data?.players ?? []).filter((player) => player.createdAt >= todayStart && player.createdAt <= now).length)} note="Registrations since midnight IST." />
        <Card label="Active sessions" value={String(data?.active.length ?? 0)} note="Running now. Not counted as finished revenue." />
        {showLoyalty ? <Card label="Points earned today" value={String(todaySessions.reduce((total, session) => total + session.points, 0))} note={`${yesterdaySessions.reduce((total, session) => total + session.points, 0)} yesterday.`} /> : null}
        {showLoyalty ? <Card label="Rewards redeemed today" value={String((data?.weeks ?? []).filter((week) => week.redeemedAt && week.redeemedAt >= todayStart && week.redeemedAt <= now).length)} note={`A reward is ${WEEKLY_TARGET} weekly points, not a payment.`} /> : null}
      </div>
      <RangeBar />
      <DeskNote />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {showRevenue ? <Card label="Recorded revenue" value={`₹${amount.toLocaleString("en-IN")}`} note={recordedPayments ? `${recordedPayments} sessions stored a collected amount in this range.` : "No collected amount was recorded in this range."} /> : null}
        <Card label="Paid hours" value={`${hoursLabel(minutes)} h`} note="Completed paid minutes in the selected range." />
        {showCustomers ? <Card label="Registered players" value={String(data?.players.length ?? 0)} note={`${createdInRange.length} registered in this range.`} /> : null}
        <Card label="Sessions completed" value={String(sessions.length)} note={`${data?.active.length ?? 0} still running.`} />
        {showLoyalty ? <Card label="Points earned" value={String(points)} note="Awarded when a session is closed. One point per 60 paid minutes." /> : null}
        {showLoyalty ? <Card label="Rewards redeemed" value={String(rewards)} note="Free sessions are not added to revenue." /> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {showGaming ? <Link href="/admin/room" className="btn btn-primary">Start a session</Link> : null}
        {showCustomers ? <Link href="/admin/players" className="btn btn-secondary">View all players</Link> : null}
        {showGaming ? <Link href="/admin/sessions" className="btn btn-secondary">View active sessions</Link> : null}
        {showLoyalty ? <Link href="/admin/loyalty" className="btn btn-secondary">View rewards</Link> : null}
        {showReports ? <Link href="/admin/reports" className="btn btn-secondary">Open reports</Link> : null}
        {showRevenue ? <Link href="/admin/revenue" className="btn btn-secondary">Revenue</Link> : null}
      </div>
      {showCustomers ? <section className="rounded-2xl border border-white/10 bg-[#101624] p-4">
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
      </section> : null}
      <div className="grid gap-4 xl:grid-cols-2">
        {showRevenue ? <section className="rounded-2xl border border-white/10 bg-[#101624] p-4">
          <h2 className="text-xl text-paper">Recorded revenue by day</h2>
          <div className="mt-4">
            <Bars rows={days.map((day) => ({ label: day.label, value: day.amount }))} />
          </div>
        </section> : null}
        {showGaming ? <section className="rounded-2xl border border-white/10 bg-[#101624] p-4">
          <h2 className="text-xl text-paper">Gaming hours by day</h2>
          <div className="mt-4">
            <Bars rows={days.map((day) => ({ label: day.label, value: Math.round(day.hours * 10) / 10 }))} />
          </div>
        </section> : null}
        {showCustomers ? <section className="rounded-2xl border border-white/10 bg-[#101624] p-4">
          <h2 className="text-xl text-paper">New and returning players</h2>
          <div className="mt-4">
            <Bars rows={[{ label: "New", value: newcomers }, { label: "Returning", value: returning }]} />
          </div>
        </section> : null}
        {showGaming ? <section className="rounded-2xl border border-white/10 bg-[#101624] p-4">
          <h2 className="text-xl text-paper">Most-used consoles</h2>
          <div className="mt-4">
            <Bars rows={stations.map((station) => ({ label: station.id, value: station.sessions }))} />
          </div>
        </section> : null}
        {showLoyalty ? <section className="rounded-2xl border border-white/10 bg-[#101624] p-4">
          <h2 className="text-xl text-paper">Points and rewards</h2>
          <div className="mt-4">
            <Bars rows={[{ label: "Points", value: points }, { label: "Rewards", value: rewards }]} />
          </div>
          <p className="mt-3 text-xs text-mist">Rewards are a count of free sessions used. They are not subtracted from lifetime points.</p>
        </section> : null}
        {showGaming ? <section className="rounded-2xl border border-white/10 bg-[#101624] p-4">
          <h2 className="text-xl text-paper">Sessions by hour</h2>
          <div className="mt-4 flex h-28 items-end gap-1">
            {hours.map((count, hour) => (
              <div key={hour} className="flex h-full flex-1 items-end" title={`${hour}:00 · ${count}`}>
                <div className="w-full bg-violet" style={{ height: `${(count / Math.max(1, ...hours)) * 100}%` }} />
              </div>
            ))}
          </div>
        </section> : null}
      </div>
    </div>
  );
}
