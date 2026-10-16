"use client";

import { useState } from "react";
import Link from "next/link";
import { StaffSignIn, useStaff } from "@/components/StaffAccess";
import { loadAnalytics } from "@/lib/loyaltyApi";
import { stations } from "@/lib/site";

type Report = Awaited<ReturnType<typeof loadAnalytics>>;

function hoursLabel(minutes: number) {
  const hours = minutes / 60;
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

export function AdminDesk() {
  const staff = useStaff();
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const peak = Math.max(1, ...(report?.hours ?? [1]));

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
              {pending ? "Loading" : report ? "Refresh report" : "Load report"}
            </button>
          ) : (
            <p className="text-sm leading-relaxed text-mist">
              Analytics stay on this page for staff. Players see their card at the counter.{" "}
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
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              [String(report.registered), "Registered players"],
              [`${hoursLabel(report.weekMinutes)} h`, "Paid play, 7 days"],
              [String(report.weekPoints), "Points earned, 7 days"],
              [String(report.redemptions), "Rewards used this month"],
            ].map(([value, label]) => (
              <div key={label} className="border border-white/10 bg-navy px-4 py-4">
                <p className="font-tech text-3xl text-paper">{value}</p>
                <p className="mt-2 text-[0.65rem] tracking-[0.14em] text-mist uppercase">{label}</p>
              </div>
            ))}
          </dl>

          <section className="border border-white/10 bg-navy p-4">
            <h2 className="text-2xl text-paper">Sessions by station, 7 days</h2>
            <ul className="mt-4 grid gap-3">
              {stations.map((station) => {
                const count = report.stations.find(([id]) => id === station.id)?.[1] ?? 0;
                const max = Math.max(1, ...report.stations.map(([, value]) => value));
                return (
                  <li key={station.id} className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-3 text-sm">
                    <span className="text-mist">{station.id}</span>
                    <span className="h-2 bg-white/10">
                      <span className="block h-2 bg-cyan" style={{ width: `${(count / max) * 100}%` }} />
                    </span>
                    <span className="text-right text-paper">{count}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="border border-white/10 bg-navy p-4">
            <h2 className="text-2xl text-paper">Peak hours</h2>
            <p className="mt-1 text-sm text-mist">{report.activePlayers} players with a paid session in the last 7 days.</p>
            <div className="mt-4 flex h-28 items-end gap-1">
              {report.hours.map((count, hour) => (
                <div key={hour} className="flex h-full flex-1 items-end" title={`${hour}:00 · ${count}`}>
                  <div className="w-full bg-violet" style={{ height: `${(count / peak) * 100}%` }} />
                </div>
              ))}
            </div>
          </section>

          <section className="border border-white/10 bg-navy p-4">
            <h2 className="text-2xl text-paper">Most active players</h2>
            <ul className="mt-4 grid gap-2">
              {report.players.length ? (
                report.players.map((player) => (
                  <li key={player.id} className="flex items-center justify-between gap-3 border-b border-white/10 py-2 text-sm">
                    <span className="text-paper">{player.name}</span>
                    <span className="text-mist">
                      {player.lifetimePoints} pts · {hoursLabel(player.lifetimeMinutes)} h
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-mist">No registered players yet.</li>
              )}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
