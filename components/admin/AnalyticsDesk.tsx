"use client";

import { useEffect, useState } from "react";
import { DeskNote, RangeBar } from "@/components/admin/RangeBar";
import { useDesk } from "@/components/admin/AdminShell";
import { closedSessions, hourTotals, hoursLabel, stationTotals } from "@/lib/adminStats";
import { istDayStart, istMonthStart, weekStartMonday } from "@/lib/loyalty";

export function AnalyticsDesk() {
  const desk = useDesk();
  const [now, setNow] = useState(0);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setNow(Date.now()));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  const all = (desk.data?.sessions ?? []).filter((session) => session.status === "completed");
  const today = now ? closedSessions(all, istDayStart(now), now) : [];
  const week = now ? closedSessions(all, weekStartMonday(now), now) : [];
  const month = now ? closedSessions(all, istMonthStart(now), now) : [];
  const range = desk.data ? closedSessions(desk.data.sessions, desk.from, desk.to) : [];
  const stations = desk.data ? stationTotals(desk.data.sessions, desk.from, desk.to) : [];
  const busiest = [...stations].sort((a, b) => b.minutes - a.minutes)[0];
  const privateMinutes = range.filter((session) => session.stationId === "06").reduce((total, session) => total + session.paidMinutes, 0);
  const average = range.length ? Math.round(range.reduce((total, session) => total + session.paidMinutes, 0) / range.length) : 0;
  const hours = desk.data ? hourTotals(desk.data.sessions, desk.from, desk.to) : [];
  const peak = hours.reduce((best, count, hour) => (count > best.count ? { hour, count } : best), { hour: 0, count: 0 });

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl tracking-wide text-paper uppercase">Analytics</h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">Play time comes from completed session start and end records. Running sessions are listed separately and are not mixed into finished hours.</p>
      </div>
      <RangeBar />
      <DeskNote />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Hours today", `${hoursLabel(today.reduce((total, session) => total + session.paidMinutes, 0))} h`],
          ["Hours this week", `${hoursLabel(week.reduce((total, session) => total + session.paidMinutes, 0))} h`],
          ["Hours this month", `${hoursLabel(month.reduce((total, session) => total + session.paidMinutes, 0))} h`],
          ["Hours in loaded history", `${hoursLabel(all.reduce((total, session) => total + session.paidMinutes, 0))} h`],
          ["Running now", String(desk.data?.active.length ?? 0)],
          ["Average finished session", range.length ? `${average} min` : "—"],
          ["Most-used console", busiest && busiest.sessions ? busiest.name : "—"],
          ["Private room", `${hoursLabel(privateMinutes)} h in this range`],
          ["Peak hour", peak.count ? `${String(peak.hour).padStart(2, "0")}:00 · ${peak.count} sessions` : "—"],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-white/10 bg-[#101624] p-4">
            <p className="text-[0.62rem] tracking-[0.14em] text-mist uppercase">{label}</p>
            <p className="mt-2 text-lg text-paper">{value}</p>
          </article>
        ))}
      </div>
      <section className="rounded-2xl border border-white/10 bg-[#101624] p-4">
        <h2 className="text-xl text-paper">Sessions by hour</h2>
        <div className="mt-4 flex h-28 items-end gap-1">
          {hours.map((count, hour) => (
            <div key={hour} className="flex h-full flex-1 items-end" title={`${hour}:00 · ${count}`}>
              <div className="w-full bg-cyan" style={{ height: `${(count / Math.max(1, ...hours)) * 100}%` }} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
