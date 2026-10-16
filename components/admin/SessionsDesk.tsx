"use client";

import { useEffect, useState } from "react";
import { DeskNote, RangeBar } from "@/components/admin/RangeBar";
import { useDesk } from "@/components/admin/AdminShell";
import { formatIst, hoursLabel, inRange } from "@/lib/adminStats";
import { stations } from "@/lib/site";

export function SessionsDesk({ mode = "all" }: { mode?: "live" | "history" | "all" }) {
  const desk = useDesk();
  const [now, setNow] = useState(0);
  const [player, setPlayer] = useState("");
  const [station, setStation] = useState("all");
  const [staffId, setStaffId] = useState("all");
  const [status, setStatus] = useState(mode === "live" ? "active" : mode === "history" ? "completed" : "all");
  const [openId, setOpenId] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setNow(Date.now()));
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, []);

  const sessions = (desk.data?.sessions ?? []).filter((session) => {
    const text = player.trim().toLowerCase();
    const digits = player.replace(/\D/g, "");
    const matchesPlayer = !text || session.name.toLowerCase().includes(text) || (digits.length >= 3 && session.phone.includes(digits));
    const matchesStation = station === "all" || session.stationId === station;
    const matchesStaff = staffId === "all" || session.by === staffId;
    const matchesStatus = status === "all" || session.status === status;
    const matchesMode = mode === "live" ? session.status === "active" : mode === "history" ? session.status !== "active" : true;
    const matchesRange = session.status === "active" || inRange(session.endedAt, desk.from, desk.to);
    return matchesPlayer && matchesStation && matchesStaff && matchesStatus && matchesMode && matchesRange;
  });
  const staffIds = [...new Set((desk.data?.sessions ?? []).map((session) => session.by).filter(Boolean))];
  const selected = sessions.find((session) => session.id === openId);

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl tracking-wide text-paper uppercase">{mode === "live" ? "Live sessions" : mode === "history" ? "Session history" : "Sessions"}</h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          A running session is saved when a signed-in staff member starts the timer. Closing it writes points once. A second close does not add points again.
        </p>
      </div>
      <RangeBar />
      <DeskNote />
      <div className="grid gap-3 md:grid-cols-4">
        <input value={player} onChange={(event) => setPlayer(event.target.value)} className="desk-input" placeholder="Player or mobile" />
        <select value={station} onChange={(event) => setStation(event.target.value)} className="desk-input">
          <option value="all">All consoles</option>
          {stations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select value={staffId} onChange={(event) => setStaffId(event.target.value)} className="desk-input">
          <option value="all">All staff</option>
          {staffIds.map((id) => <option key={id} value={id}>{id.slice(0, 8)}</option>)}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="desk-input">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="text-[0.62rem] tracking-[0.12em] text-mist uppercase">
            <tr>{["Player", "Console", "Started", "Elapsed / paid", ...(desk.canSee("revenue") ? ["Amount"] : []), "Points", "Status"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr>
          </thead>
          <tbody>
            {sessions.length ? sessions.map((session) => {
              const elapsed = session.status === "active" && now ? Math.max(0, Math.floor((now - session.startedAt) / 60000)) : session.paidMinutes;
              return (
                <tr key={session.id} className="border-t border-white/10">
                  <td className="px-3 py-3">
                    <button type="button" className="text-left" onClick={() => setOpenId(session.id)}>
                      <span className="block text-paper">{session.name}</span>
                      <span className="text-xs text-mist">{session.phone || "No mobile"}</span>
                    </button>
                  </td>
                  <td className="px-3 py-3">{session.stationName}</td>
                  <td className="px-3 py-3 text-mist">{formatIst(session.startedAt)}</td>
                  <td className="px-3 py-3">{session.status === "active" ? `${hoursLabel(elapsed)} running` : `${session.paidMinutes} min`}</td>
                  {desk.canSee("revenue") ? <td className="px-3 py-3">{session.amountRecorded ? `₹${session.amountRupees}` : "Not recorded"}</td> : null}
                  <td className="px-3 py-3">{session.points}</td>
                  <td className="px-3 py-3">{session.status}</td>
                </tr>
              );
            }) : <tr><td colSpan={desk.canSee("revenue") ? 7 : 6} className="px-3 py-6 text-mist">No sessions in this view.</td></tr>}
          </tbody>
        </table>
      </div>
      {selected ? (
        <section className="rounded-2xl border border-white/10 bg-[#101624] p-4 text-sm">
          <h2 className="text-xl text-paper">{selected.name}</h2>
          <p className="mt-2 text-mist">Session {selected.id}</p>
          <p className="mt-2">Staff {selected.by || "—"} · Booked {selected.bookedMinutes} min · Paid {selected.paidMinutes} min · {selected.points} points</p>
        </section>
      ) : null}
    </div>
  );
}
