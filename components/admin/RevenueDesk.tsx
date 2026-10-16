"use client";

import { DeskNote, RangeBar } from "@/components/admin/RangeBar";
import { useDesk } from "@/components/admin/AdminShell";
import { closedSessions, dailyTotals, hoursLabel, stationTotals } from "@/lib/adminStats";

export function RevenueDesk() {
  const desk = useDesk();
  const closed = desk.data ? closedSessions(desk.data.sessions, desk.from, desk.to) : [];
  const recorded = closed.filter((session) => session.amountRecorded);
  const gross = recorded.reduce((total, session) => total + session.amountRupees, 0);
  const days = desk.data ? dailyTotals(desk.data.sessions, desk.from, desk.to) : [];
  const stations = desk.data ? stationTotals(desk.data.sessions, desk.from, desk.to) : [];
  const privateRoom = stations.find((station) => station.id === "06");
  const standard = stations.filter((station) => station.id !== "06").reduce((total, station) => total + station.amount, 0);
  const average = recorded.length ? Math.round(gross / recorded.length) : 0;

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl tracking-wide text-paper uppercase">Revenue</h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          Only amounts a staff member typed as collected are included. Free reward sessions and sessions with no collected amount stay out of these totals. Refunds are not tracked, so net revenue is the same as recorded gross.
        </p>
      </div>
      <RangeBar />
      <DeskNote />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Recorded gross", `₹${gross.toLocaleString("en-IN")}`],
          ["Refunds", "Not tracked"],
          ["Net recorded", `₹${gross.toLocaleString("en-IN")}`],
          ["Paid sessions", String(recorded.length)],
          ["Average recorded payment", recorded.length ? `₹${average.toLocaleString("en-IN")}` : "—"],
          ["Sessions without a payment", String(closed.length - recorded.length)],
          ["Private room", `₹${(privateRoom?.amount ?? 0).toLocaleString("en-IN")}`],
          ["Other consoles", `₹${standard.toLocaleString("en-IN")}`],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-white/10 bg-[#101624] p-4">
            <p className="text-[0.62rem] tracking-[0.14em] text-mist uppercase">{label}</p>
            <p className="mt-2 font-tech text-2xl text-paper">{value}</p>
          </article>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-[#101624] p-4">
          <h2 className="text-xl text-paper">By day</h2>
          <ul className="mt-4 grid gap-2 text-sm">
            {days.length ? days.map((day) => (
              <li key={day.label} className="flex justify-between text-mist">
                <span>{day.label}</span>
                <span className="text-paper">₹{day.amount.toLocaleString("en-IN")} · {hoursLabel(day.hours * 60)} h</span>
              </li>
            )) : <li className="text-mist">No completed sessions in this range.</li>}
          </ul>
        </section>
        <section className="rounded-2xl border border-white/10 bg-[#101624] p-4">
          <h2 className="text-xl text-paper">By console</h2>
          <ul className="mt-4 grid gap-2 text-sm">
            {stations.map((station) => (
              <li key={station.id} className="flex justify-between text-mist">
                <span>{station.name}</span>
                <span className="text-paper">₹{station.amount.toLocaleString("en-IN")}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-mist">Payment method is not stored.</p>
        </section>
      </div>
    </div>
  );
}
