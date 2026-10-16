"use client";

import { useEffect, useState } from "react";
import { DeskNote } from "@/components/admin/RangeBar";
import { useDesk } from "@/components/admin/AdminShell";
import { useLiveStations } from "@/components/LiveStatus";
import { formatIst, hoursLabel } from "@/lib/adminStats";
import { istDayStart } from "@/lib/loyalty";
import { stations } from "@/lib/site";
import { describeStatus, istClock, reasons, setStationStatus, type StationState } from "@/lib/stationStatus";

const MINUTE = 60 * 1000;

const durations = [
  { id: "30", label: "30 min", minutes: 30 },
  { id: "60", label: "1 hour", minutes: 60 },
  { id: "120", label: "2 hours", minutes: 120 },
  { id: "180", label: "3 hours", minutes: 180 },
  { id: "time", label: "Until a time", minutes: 0 },
  { id: "open", label: "Until I change it", minutes: 0 },
] as const;

type DurationId = (typeof durations)[number]["id"];

const toneText = { free: "text-[#3BFF9D]", busy: "text-[#FFC53D]", off: "text-magenta", unknown: "text-mist" } as const;

function untilFromClock(value: string, now: number) {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  let target = istDayStart(now) + hours * 60 * MINUTE + minutes * MINUTE;
  if (target <= now) target += 24 * 60 * MINUTE;
  return target;
}

export function StationsDesk() {
  const desk = useDesk();
  const live = useLiveStations();
  const [now, setNow] = useState(0);
  const [error, setError] = useState<{ id: string; text: string } | null>(null);
  const [saved, setSaved] = useState<{ id: string; text: string } | null>(null);
  const [editing, setEditing] = useState("");
  const [duration, setDuration] = useState<DurationId>("60");
  const [clockValue, setClockValue] = useState("");
  const [reason, setReason] = useState<string>(reasons[0]);
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setNow(Date.now()));
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, []);

  const today = now ? istDayStart(now) : 0;

  function openEditor(id: string) {
    setEditing(id);
    setDuration("60");
    setClockValue("");
    setReason(reasons[0]);
    setError(null);
    setSaved(null);
  }

  async function save(id: string, status: StationState, until: number | null, why: string, message: string) {
    setBusyId(id);
    setError(null);
    setSaved(null);
    try {
      await setStationStatus(id, status, until, why);
      setSaved({ id, text: message });
      setEditing("");
      desk.reload();
    } catch (reason) {
      const text = reason instanceof Error ? reason.message : "Could not update this station.";
      setError({ id, text: /permission/i.test(text) ? "Firestore rules blocked this. Publish the latest rules in the Firebase console, then try again." : text });
    } finally {
      setBusyId("");
    }
  }

  function confirmUnavailable(id: string, name: string) {
    const choice = durations.find((item) => item.id === duration);
    let until: number | null = null;
    if (duration === "time") {
      until = untilFromClock(clockValue, now);
      if (!until) {
        setError({ id, text: "Pick the time it will be free again." });
        return;
      }
    } else if (choice && choice.minutes) {
      until = now + choice.minutes * MINUTE;
    }
    const why = reason.trim();
    void save(id, "unavailable", until, why, until ? `${name} shows “Not available” on the website until ${istClock(until)}.` : `${name} shows “Not available” on the website until you mark it available.`);
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl tracking-wide text-paper uppercase">Stations</h1>
        <p className="mt-2 text-sm text-mist">
          What you set here appears live on the website. Starting a session on the room desk shows the station as “In use” with its end time, and closing the session frees it again.
          A station marked unavailable for a set time comes back as available on its own.
        </p>
      </div>
      <DeskNote />
      {live.failed ? <p className="text-sm text-magenta">Live status could not load. Check the connection and the published Firestore rules.</p> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stations.map((station) => {
          const session = desk.data?.active.find((item) => item.stationId === station.id);
          const entry = live.map[station.id];
          const view = describeStatus(entry, now);
          const held = entry?.status === "unavailable" && view.tone === "off";
          const todaySessions = (desk.data?.sessions ?? []).filter((item) => item.stationId === station.id && item.status === "completed" && item.endedAt >= today);
          const todayMinutes = todaySessions.reduce((total, item) => total + item.paidMinutes, 0);
          const allTodayMinutes = (desk.data?.sessions ?? []).filter((item) => item.status === "completed" && item.endedAt >= today).reduce((total, item) => total + item.paidMinutes, 0);
          const share = allTodayMinutes ? Math.round((todayMinutes / allTodayMinutes) * 100) : 0;
          const working = busyId === station.id;
          return (
            <article key={station.id} className="rounded-2xl border border-white/10 bg-[#101624] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-tech text-3xl text-paper">{station.id}</p>
                  <h2 className="mt-1 text-xl text-paper">{station.name}</h2>
                  <p className="text-xs tracking-[0.14em] text-mist uppercase">{station.rate === "private" ? "Private room" : station.rate === "simulator" ? "Car simulator" : "PS5 station"}</p>
                </div>
                <p className={`text-sm font-semibold ${toneText[view.tone]}`}>{now ? view.label : ""}</p>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <p className="text-[11px] tracking-[0.14em] text-mist uppercase">Website shows</p>
                <p className={`text-sm ${toneText[view.tone]}`}>{now ? `${view.label} · ${view.detail}` : "Loading…"}</p>
              </div>

              {session ? (
                <p className="mt-3 text-sm text-paper">{session.name}{session.phone ? ` · ${session.phone}` : ""} · since {formatIst(session.startedAt)}</p>
              ) : (
                <p className="mt-3 text-sm text-mist">No player on this console.</p>
              )}
              {view.label === "Finishing up" ? (
                <p className="mt-2 text-sm text-paper">The booked time is over. End the session on Start a Session so the website shows this console as free.</p>
              ) : null}
              {!session && entry?.status === "busy" ? (
                <p className="mt-2 text-sm text-paper">The website says this console is in use, but no open session is saved yet. If you just started it, reload this page. Otherwise end it on Start a Session.</p>
              ) : null}
              <p className="mt-2 text-sm text-mist">{todaySessions.length} sessions today · {hoursLabel(todayMinutes)} h{desk.canSee("revenue") ? ` · ₹${todaySessions.reduce((total, item) => total + (item.amountRecorded ? item.amountRupees : 0), 0)} recorded${allTodayMinutes ? ` · ${share}% of today’s paid time` : ""}` : ""}</p>

              {error?.id === station.id ? <p role="alert" className="mt-3 rounded-lg border border-magenta/40 bg-magenta/10 px-3 py-2 text-sm text-magenta">{error.text}</p> : null}
              {saved?.id === station.id ? <p className="mt-3 rounded-lg border border-cyan/40 bg-cyan/10 px-3 py-2 text-sm text-cyan">{saved.text}</p> : null}

              {desk.canEdit("gaming") && editing === station.id ? (
                <div className="mt-4 grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <fieldset>
                    <legend className="text-xs tracking-[0.14em] text-mist uppercase">Not available for</legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {durations.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          aria-pressed={duration === item.id}
                          className={`rounded-full border px-3 py-1.5 text-sm ${duration === item.id ? "border-cyan bg-cyan text-ink" : "border-white/15 text-paper hover:border-white/40"}`}
                          onClick={() => setDuration(item.id)}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    {duration === "time" ? (
                      <label className="mt-3 block text-sm text-paper">
                        Free again at (IST)
                        <input type="time" value={clockValue} onChange={(event) => setClockValue(event.target.value)} className="mt-1 block w-full rounded-lg border border-white/15 bg-[#0B101B] px-3 py-2 text-paper" />
                      </label>
                    ) : null}
                    {duration !== "time" && duration !== "open" && now ? (
                      <p className="mt-2 text-xs text-mist">Back on the website as available at about {istClock(now + (durations.find((item) => item.id === duration)?.minutes ?? 0) * MINUTE)}.</p>
                    ) : null}
                  </fieldset>
                  <fieldset>
                    <legend className="text-xs tracking-[0.14em] text-mist uppercase">Reason shown to visitors</legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {reasons.map((item) => (
                        <button
                          key={item}
                          type="button"
                          aria-pressed={reason === item}
                          className={`rounded-full border px-3 py-1.5 text-sm ${reason === item ? "border-cyan bg-cyan text-ink" : "border-white/15 text-paper hover:border-white/40"}`}
                          onClick={() => setReason(item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                    <input
                      value={reason}
                      maxLength={60}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="Or type a short reason"
                      className="mt-2 block w-full rounded-lg border border-white/15 bg-[#0B101B] px-3 py-2 text-sm text-paper"
                    />
                  </fieldset>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn btn-primary" disabled={working} onClick={() => confirmUnavailable(station.id, station.name)}>
                      {working ? "Saving…" : "Mark unavailable"}
                    </button>
                    <button type="button" className="btn btn-secondary" disabled={working} onClick={() => setEditing("")}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}

              {desk.canEdit("gaming") && editing !== station.id ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {held ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={working}
                        onClick={() => {
                          if (session) {
                            void save(station.id, "busy", session.startedAt + session.bookedMinutes * MINUTE, "", `${station.name} still has a running session, so the website shows it as in use.`);
                            return;
                          }
                          void save(station.id, "available", null, "", `${station.name} shows “Available now” on the website.`);
                        }}
                      >
                        Mark available now
                      </button>
                      {entry?.until ? (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          disabled={working}
                          onClick={() => {
                            const until = Math.max(Date.now(), entry.until ?? 0) + 30 * MINUTE;
                            void save(station.id, "unavailable", until, entry.reason, `${station.name} now shows “Not available” until ${istClock(until)}.`);
                          }}
                        >
                          +30 min
                        </button>
                      ) : null}
                      <button type="button" className="btn btn-secondary" disabled={working} onClick={() => openEditor(station.id)}>
                        Change
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="btn btn-secondary" disabled={working} onClick={() => openEditor(station.id)}>
                        Mark unavailable
                      </button>
                      {entry?.status === "busy" && !session ? (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          disabled={working}
                          onClick={() => void save(station.id, "available", null, "", `${station.name} shows “Available now” on the website.`)}
                        >
                          Clear “In use”
                        </button>
                      ) : null}
                      {!entry ? (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          disabled={working}
                          onClick={() => void save(station.id, "available", null, "", `${station.name} shows “Available now” on the website.`)}
                        >
                          Show as available
                        </button>
                      ) : null}
                    </>
                  )}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
