"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { StaffSignIn, useStaff } from "@/components/StaffAccess";
import { loadAnalytics, type PeriodSummary, type PlayerLedger } from "@/lib/loyaltyApi";

type Report = Awaited<ReturnType<typeof loadAnalytics>>;

function hoursLabel(minutes: number) {
  const hours = minutes / 60;
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

function periodCells(player: PlayerLedger, key: PeriodSummary["key"]) {
  if (key === "today") return [player.todayPoints, player.todayMinutes];
  if (key === "week") return [player.weekPoints, player.weekMinutes];
  if (key === "month") return [player.monthPoints, player.monthMinutes];
  if (key === "year") return [player.yearPoints, player.yearMinutes];
  return [player.lifetimePoints, player.lifetimeMinutes];
}

function downloadLedger(players: PlayerLedger[]) {
  const header = ["Name", "Mobile", "All-time points", "All-time hours", "Today points", "Week points", "Month points", "Year points"];
  const cell = (value: string | number) => `"${String(value).replaceAll("\"", "\"\"")}"`;
  const lines = players.map((player) =>
    [
      cell(player.name),
      cell(player.phone),
      player.lifetimePoints,
      hoursLabel(player.lifetimeMinutes),
      player.todayPoints,
      player.weekPoints,
      player.monthPoints,
      player.yearPoints,
    ].join(","),
  );
  const file = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = "nexus-players.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function AdminDesk() {
  const staff = useStaff();
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<PeriodSummary["key"]>("all");
  const [openId, setOpenId] = useState("");

  const needle = query.replace(/\D/g, "").length >= 3 ? query.replace(/\D/g, "") : query.trim().toLowerCase();
  const visible = (report?.players ?? []).filter((player) => {
    if (!needle) return true;
    return player.name.toLowerCase().includes(needle) || player.phone.includes(needle);
  });

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start">
        <StaffSignIn />
        <div>
          {staff.status === "staff" ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={pending}
              onClick={() => {
                setPending(true);
                setError("");
                void loadAnalytics()
                  .then(setReport)
                  .catch((reason: unknown) => {
                    setError(reason instanceof Error ? reason.message : "Could not load the report.");
                  })
                  .finally(() => setPending(false));
              }}
            >
              {pending ? "Loading" : report ? "Refresh list" : "Show all players"}
            </button>
          ) : (
            <p className="text-sm leading-relaxed text-mist">
              After you sign in, this page lists every player and their points for today, this week, this month, this
              year, and all time. Players still see their card only at the counter.{" "}
              <Link href="/player" className="text-cyan">
                How points work
              </Link>
              .
            </p>
          )}
          {error ? <p className="mt-3 text-sm text-magenta">{error}</p> : null}
        </div>
      </div>

      {report ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {report.periods.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setPeriod(item.key)}
                className={`border px-4 py-4 text-left ${period === item.key ? "border-cyan bg-cyan/10" : "border-white/10 bg-navy"}`}
              >
                <p className="text-[0.62rem] tracking-[0.14em] text-mist uppercase">{item.label}</p>
                <p className="mt-2 font-tech text-3xl text-paper">{item.points}</p>
                <p className="mt-1 text-xs text-mist">
                  {item.points === 1 ? "point" : "points"} · {hoursLabel(item.minutes)} h · {item.players} players ·{" "}
                  {item.sessions} sessions
                </p>
              </button>
            ))}
          </div>
          <p className="text-sm text-mist">Rewards used this month: {report.redemptions}</p>

          <section className="border border-white/10 bg-navy p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl text-paper">Players</h2>
                <p className="mt-1 text-sm text-mist">{visible.length} people. Points are the coins for each player.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="desk-input"
                  placeholder="Search name or mobile"
                />
                <button type="button" className="btn btn-secondary" onClick={() => downloadLedger(visible)}>
                  Download list
                </button>
              </div>
            </div>
            {report.capped ? (
              <p className="mt-3 text-sm text-magenta">Showing the latest 1,000 sessions from this year.</p>
            ) : null}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[46rem] text-left text-sm">
                <thead className="text-[0.62rem] tracking-[0.14em] text-mist uppercase">
                  <tr>
                    <th className="py-2 pr-3 font-medium">Player</th>
                    <th className="py-2 pr-3 font-medium">Mobile</th>
                    <th className="py-2 pr-3 font-medium">Today</th>
                    <th className="py-2 pr-3 font-medium">Week</th>
                    <th className="py-2 pr-3 font-medium">Month</th>
                    <th className="py-2 pr-3 font-medium">Year</th>
                    <th className="py-2 font-medium">All-time points</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length ? (
                    visible.map((player) => {
                      const [points, minutes] = periodCells(player, period);
                      const history = report.sessions.filter((session) => session.customerId === player.id).slice(0, 12);
                      return (
                        <Fragment key={player.id}>
                          <tr className="border-t border-white/10">
                            <td className="py-3 pr-3">
                              <button type="button" className="text-left text-paper" onClick={() => setOpenId(openId === player.id ? "" : player.id)}>
                                {player.name}
                              </button>
                            </td>
                            <td className="py-3 pr-3 text-mist">{player.phone || "—"}</td>
                            <td className="py-3 pr-3 text-paper">{player.todayPoints}</td>
                            <td className="py-3 pr-3 text-paper">{player.weekPoints}</td>
                            <td className="py-3 pr-3 text-paper">{player.monthPoints}</td>
                            <td className="py-3 pr-3 text-paper">{player.yearPoints}</td>
                            <td className="py-3 font-tech text-paper">
                              {player.lifetimePoints}
                              <span className="ml-2 font-sans text-xs text-mist">{hoursLabel(player.lifetimeMinutes)} h</span>
                            </td>
                          </tr>
                          {openId === player.id ? (
                            <tr className="border-t border-white/10">
                              <td colSpan={7} className="bg-black/30 px-3 py-3 text-mist">
                                <p className="text-paper">
                                  {period === "all" ? "All time" : report.periods.find((item) => item.key === period)?.label}: {points}{" "}
                                  points · {hoursLabel(minutes)} h
                                </p>
                                {history.length ? (
                                  <ul className="mt-2 grid gap-1">
                                    {history.map((session) => (
                                      <li key={session.id}>
                                        {new Date(session.endedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} · {session.stationName} ·{" "}
                                        {session.paidMinutes} min · {session.points} pts
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="mt-2">No saved sessions this year.</p>
                                )}
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-4 text-mist">
                        No players saved yet. End a paid session on the room desk after signing in.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
