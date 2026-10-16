"use client";

import { useEffect, useState } from "react";
import { DeskNote } from "@/components/admin/RangeBar";
import { useDesk } from "@/components/admin/AdminShell";
import { setStationAvailability } from "@/lib/adminApi";
import { formatIst, hoursLabel } from "@/lib/adminStats";
import { istDayStart } from "@/lib/loyalty";
import { stations } from "@/lib/site";

export function StationsDesk() {
  const desk = useDesk();
  const [now, setNow] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setNow(Date.now()));
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, []);

  const today = istDayStart(now || Date.now());

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl tracking-wide text-paper uppercase">Stations</h1>
        <p className="mt-2 text-sm text-mist">A station with a running session stays occupied until that session is closed on the room desk.</p>
      </div>
      <DeskNote />
      {error ? <p className="text-sm text-magenta">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stations.map((station) => {
          const live = desk.data?.active.find((session) => session.stationId === station.id);
          const unavailable = desk.data?.unavailable.includes(station.id) ?? false;
          const todaySessions = (desk.data?.sessions ?? []).filter((session) => session.stationId === station.id && session.status === "completed" && session.endedAt >= today);
          const status = live ? "Occupied" : unavailable ? "Unavailable" : "Available";
          return (
            <article key={station.id} className="rounded-2xl border border-white/10 bg-[#101624] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-tech text-3xl text-paper">{station.id}</p>
                  <h2 className="mt-1 text-xl text-paper">{station.name}</h2>
                  <p className="text-xs tracking-[0.14em] text-mist uppercase">{station.rate === "private" ? "Private room" : station.rate === "simulator" ? "Car simulator" : "PS5 station"}</p>
                </div>
                <p className={`text-sm ${live ? "text-cyan" : unavailable ? "text-magenta" : "text-mist"}`}>{status}</p>
              </div>
              {live ? (
                <p className="mt-4 text-sm text-paper">{live.name}{live.phone ? ` · ${live.phone}` : ""} · since {formatIst(live.startedAt)}</p>
              ) : (
                <p className="mt-4 text-sm text-mist">No player on this console.</p>
              )}
              <p className="mt-3 text-sm text-mist">{todaySessions.length} sessions today · {hoursLabel(todaySessions.reduce((total, session) => total + session.paidMinutes, 0))} h</p>
              {desk.canOperate ? (
                <button
                  type="button"
                  className="btn btn-secondary mt-4"
                  onClick={() => {
                    if (live && unavailable) return;
                    if (live && !unavailable) {
                      setError(`${station.name} still has a running session.`);
                      return;
                    }
                    const next = unavailable ? "available" : "unavailable";
                    if (live && next === "available") {
                      setError(`${station.name} still has a running session.`);
                      return;
                    }
                    setError("");
                    void setStationAvailability(station.id, next).then(() => desk.reload()).catch((reason: unknown) => {
                      setError(reason instanceof Error ? reason.message : "Could not update this station.");
                    });
                  }}
                >
                  {unavailable ? "Mark available" : "Mark unavailable"}
                </button>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
