"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDesk } from "@/components/admin/AdminShell";
import { adjustPoints, loadPlayerDetail, renamePlayer, type PlayerDetail } from "@/lib/adminApi";
import { downloadCsv, formatIst, hoursLabel } from "@/lib/adminStats";

export function PlayerProfile({ playerId }: { playerId: string }) {
  const desk = useDesk();
  const [detail, setDetail] = useState<PlayerDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (!desk.signedIn || !playerId) return;
    let cancel = false;
    void loadPlayerDetail(playerId)
      .then((next) => {
        if (cancel) return;
        setDetail(next);
        setName(next.player.name);
      })
      .catch((reasonCaught: unknown) => {
        if (!cancel) setError(reasonCaught instanceof Error ? reasonCaught.message : "Could not open this player.");
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [desk.signedIn, playerId]);

  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-white/5" />;
  if (error || !detail) return <p className="text-sm text-magenta">{error || "Player not found."}</p>;
  const { player, sessions, ledger } = detail;

  return (
    <div className="grid gap-6">
      <div>
        <Link href="/admin/players" className="text-sm text-cyan">All players</Link>
        <h1 className="mt-2 text-4xl tracking-wide text-paper uppercase">{player.name}</h1>
        <p className="mt-2 text-sm text-mist">{player.phone || "No mobile number"} · Registered {formatIst(player.createdAt)}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Paid hours", `${hoursLabel(player.lifetimeMinutes)} h`],
          ["Sessions", String(player.sessionCount)],
          ["Available points", String(player.lifetimePoints)],
          ["Amount paid", `₹${sessions.reduce((total, session) => total + (session.amountRecorded ? session.amountRupees : 0), 0).toLocaleString("en-IN")}`],
          ["Rewards used", String(player.rewardsRedeemed)],
          ["This week", String(player.weekPoints)],
          ["This month", String(player.monthPoints)],
          ["This year", String(player.yearPoints)],
          ["Last session", formatIst(player.lastPlayedAt)],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-white/10 bg-[#101624] p-4">
            <p className="text-[0.62rem] tracking-[0.14em] text-mist uppercase">{label}</p>
            <p className="mt-2 text-2xl text-paper">{value}</p>
          </article>
        ))}
      </div>
      <p className="text-sm text-mist">
        Available points are the lifetime balance. This week&apos;s reward progress is separate and is not removed from that balance.
        {player.bankedMinutes ? ` ${player.bankedMinutes} paid minutes are waiting toward the next point.` : ""}
      </p>
      {desk.canEdit("customers") ? (
        <form
          className="grid gap-3 rounded-2xl border border-white/10 bg-[#101624] p-4 sm:grid-cols-[1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            void renamePlayer(player.id, name)
              .then(() => setError(""))
              .catch((reasonCaught: unknown) => setError(reasonCaught instanceof Error ? reasonCaught.message : "Could not rename."));
          }}
        >
          <label className="text-xs text-mist">Name
            <input value={name} onChange={(event) => setName(event.target.value)} className="desk-input mt-1" />
          </label>
          <button type="submit" className="btn btn-secondary mt-5">Save name</button>
        </form>
      ) : null}
      {desk.isAdmin ? (
        <form
          className="grid gap-3 rounded-2xl border border-white/10 bg-[#101624] p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!confirm) {
              setError("Tick the confirmation before changing points.");
              return;
            }
            void adjustPoints(player.id, Number(delta), reason)
              .then(() => loadPlayerDetail(player.id))
              .then((next) => {
                setDetail(next);
                setDelta("");
                setReason("");
                setConfirm(false);
                setError("");
              })
              .catch((reasonCaught: unknown) => setError(reasonCaught instanceof Error ? reasonCaught.message : "Could not adjust points."));
          }}
        >
          <h2 className="text-xl text-paper">Correct points</h2>
          <p className="text-sm text-mist">The reason, your staff id, the time, and the balance before and after are stored. This does not erase the old balance quietly.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-mist">Points to add or remove
              <input value={delta} onChange={(event) => setDelta(event.target.value)} className="desk-input mt-1" inputMode="numeric" placeholder="-2 or 3" />
            </label>
            <label className="text-xs text-mist">Reason
              <input value={reason} onChange={(event) => setReason(event.target.value)} className="desk-input mt-1" />
            </label>
          </div>
          <label className="flex items-start gap-2 text-sm text-mist">
            <input type="checkbox" checked={confirm} onChange={(event) => setConfirm(event.target.checked)} className="mt-1" />
            I confirm this correction should be written to the points ledger.
          </label>
          <button type="submit" className="btn btn-primary w-fit">Save correction</button>
        </form>
      ) : null}
      {error ? <p className="text-sm text-magenta">{error}</p> : null}
      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl text-paper">Sessions</h2>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => downloadCsv(`${player.name}-sessions.csv`, [
              ["Session", "Station", "Start", "End", "Paid minutes", "Estimated rupees", "Points", "Status", "Staff id"],
              ...sessions.map((session) => [session.id, session.stationName, formatIst(session.startedAt), formatIst(session.endedAt), session.paidMinutes, session.amountRupees, session.points, session.status, session.by]),
            ])}
          >
            Export history
          </button>
        </div>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[60rem] text-left text-sm">
            <thead className="text-[0.62rem] tracking-[0.12em] text-mist uppercase">
              <tr>{["Session", "Station", "Start", "End", "Paid", "Amount", "Points", "Status", "Staff"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr>
            </thead>
            <tbody>
              {sessions.length ? sessions.map((session) => (
                <tr key={session.id} className="border-t border-white/10">
                  <td className="px-3 py-3 text-mist">{session.id}</td>
                  <td className="px-3 py-3">{session.stationName}</td>
                  <td className="px-3 py-3">{formatIst(session.startedAt)}</td>
                  <td className="px-3 py-3">{session.status === "active" ? "Running" : formatIst(session.endedAt)}</td>
                  <td className="px-3 py-3">{session.paidMinutes} min</td>
                  <td className="px-3 py-3">{session.amountRecorded ? `₹${session.amountRupees}` : "Not recorded"}</td>
                  <td className="px-3 py-3">{session.points}</td>
                  <td className="px-3 py-3">{session.status}</td>
                  <td className="px-3 py-3 text-mist">{session.by ? session.by.slice(0, 8) : "—"}</td>
                </tr>
              )) : <tr><td colSpan={9} className="px-3 py-4 text-mist">No sessions saved for this player.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2 className="text-2xl text-paper">Points ledger</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-[0.62rem] tracking-[0.12em] text-mist uppercase">
              <tr>{["When", "Change", "Reason", "Related", "Balance after", "Staff"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr>
            </thead>
            <tbody>
              {ledger.length ? ledger.map((entry) => (
                <tr key={entry.id} className="border-t border-white/10">
                  <td className="px-3 py-3">{formatIst(entry.at)}</td>
                  <td className="px-3 py-3">{entry.type === "redeem" ? "Reward used" : entry.points}</td>
                  <td className="px-3 py-3">{entry.reason}</td>
                  <td className="px-3 py-3 text-mist">{entry.sessionId || "—"}</td>
                  <td className="px-3 py-3">{entry.balanceAfter ?? "—"}</td>
                  <td className="px-3 py-3 text-mist">{entry.by ? entry.by.slice(0, 8) : "—"}</td>
                </tr>
              )) : <tr><td colSpan={6} className="px-3 py-4 text-mist">No ledger entries yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
