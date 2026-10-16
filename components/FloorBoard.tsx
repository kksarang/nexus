"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { formatClock, formatRupees } from "@/lib/format";
import type { FinishedPlay } from "@/lib/loyalty";
import { rateForStation, stations } from "@/lib/site";

type Session = {
  name: string;
  phone: string;
  note: string;
  players: number;
  hours: number;
  startedAt: number;
  endsAt: number;
  alarmed: boolean;
  extraMinutes: number;
};

type Draft = {
  name: string;
  phone: string;
  note: string;
  players: number;
  hours: number;
};

const STORAGE_KEY = "nexus-floor";
const MIN_PLAYERS = 1;
const MAX_PLAYERS = 8;
const MIN_HOURS = 1;
const MAX_HOURS = 6;

const emptyDraft = (): Draft => ({
  name: "",
  phone: "",
  note: "",
  players: 2,
  hours: 1,
});

let alarmContext: AudioContext | null = null;

function armAlarm() {
  if (!alarmContext) alarmContext = new AudioContext();
  if (alarmContext.state === "suspended") void alarmContext.resume();
  return alarmContext;
}

function playAlarm() {
  const ctx = alarmContext;
  if (!ctx || ctx.state !== "running") return;
  const now = ctx.currentTime;
  [784, 988, 784].forEach((frequency, index) => {
    const offset = index * 0.18;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.045, now + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + offset);
    osc.stop(now + offset + 0.16);
  });
}

function asSession(value: unknown): Session | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<Session>;
  if (typeof item.endsAt !== "number" || typeof item.players !== "number" || typeof item.hours !== "number") {
    return null;
  }
  return {
    name: typeof item.name === "string" ? item.name : "",
    phone: typeof item.phone === "string" ? item.phone : "",
    note: typeof item.note === "string" ? item.note : "",
    players: item.players,
    hours: item.hours,
    startedAt:
      typeof item.startedAt === "number"
        ? item.startedAt
        : item.endsAt - item.hours * 60 * 60 * 1000 - (typeof item.extraMinutes === "number" ? item.extraMinutes : 0) * 60 * 1000,
    endsAt: item.endsAt,
    alarmed: Boolean(item.alarmed),
    extraMinutes: typeof item.extraMinutes === "number" ? item.extraMinutes : 0,
  };
}

function loadSessions() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const now = Date.now();
    const sessions: Record<string, Session> = {};
    for (const [id, value] of Object.entries(parsed)) {
      const session = asSession(value);
      if (!session) continue;
      if (session.endsAt <= now) session.alarmed = true;
      sessions[id] = session;
    }
    return sessions;
  } catch {
    return {};
  }
}

export function FloorBoard({
  only,
  wall = false,
  activeCustomer,
  onFinish,
  onStart,
}: {
  only?: string;
  wall?: boolean;
  activeCustomer?: { name: string; phone: string } | null;
  onFinish?: (play: FinishedPlay) => void;
  onStart?: (play: {
    stationId: string;
    stationName: string;
    name: string;
    phone: string;
    startedAt: number;
    bookedMinutes: number;
  }) => void;
}) {
  const board = only ? stations.filter((item) => item.id === only) : stations;
  const [sessions, setSessions] = useState<Record<string, Session>>({});
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [selected, setSelected] = useState<string>(only ?? stations[0].id);
  const [now, setNow] = useState(0);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [errorBay, setErrorBay] = useState("");
  const sessionsRef = useRef(sessions);

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    const loaded = loadSessions();
    const frame = window.requestAnimationFrame(() => {
      setSessions(loaded);
      setNow(Date.now());
    });
    const arm = () => {
      armAlarm();
    };
    window.addEventListener("pointerdown", arm, { once: true });
    const id = window.setInterval(() => {
      const time = Date.now();
      setNow(time);
      const finished = Object.entries(sessionsRef.current).filter(
        ([, session]) => session.endsAt <= time && !session.alarmed,
      );
      if (!finished.length) return;
      playAlarm();
      const names = finished.map(([stationId]) => {
        const station = stations.find((item) => item.id === stationId);
        const guest = sessionsRef.current[stationId]?.name;
        return guest ? `${station?.name ?? "A station"} · ${guest}` : (station?.name ?? "A station");
      });
      setNotice(`${names.join(" and ")} ${names.length > 1 ? "are" : "is"} complete.`);
      setSessions((current) => {
        const next = { ...current };
        for (const [stationId, session] of finished) {
          if (next[stationId]) next[stationId] = { ...session, alarmed: true };
        }
        return next;
      });
    }, 1000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointerdown", arm);
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!now) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions, now]);

  function baseDraft(existing?: Draft) {
    if (existing) return existing;
    if (activeCustomer) return { ...emptyDraft(), name: activeCustomer.name, phone: activeCustomer.phone };
    return emptyDraft();
  }

  function draftFor(id: string) {
    return baseDraft(drafts[id]);
  }

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts((current) => ({ ...current, [id]: { ...baseDraft(current[id]), ...patch } }));
    setError("");
  }

  function start(id: string) {
    const draft = draftFor(id);
    const name = draft.name.trim();
    if (!name) {
      setErrorBay(id);
      setError("Add the customer name before starting.");
      return;
    }
    armAlarm();
    const startedAt = Date.now();
    setSessions((current) => ({
      ...current,
      [id]: {
        name,
        phone: draft.phone.trim(),
        note: draft.note.trim(),
        players: draft.players,
        hours: draft.hours,
        startedAt,
        endsAt: startedAt + draft.hours * 60 * 60 * 1000,
        alarmed: false,
        extraMinutes: 0,
      },
    }));
    setDrafts((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setNotice("");
    setError("");
    const bay = stations.find((item) => item.id === id);
    onStart?.({
      stationId: id,
      stationName: bay?.name ?? id,
      name,
      phone: draft.phone.trim(),
      startedAt,
      bookedMinutes: draft.hours * 60,
    });
  }

  function clear(id: string) {
    const session = sessionsRef.current[id];
    setSessions((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    if (!session || !onFinish) return;
    const bay = stations.find((item) => item.id === id);
    onFinish({
      stationId: id,
      stationName: bay?.name ?? id,
      name: session.name,
      phone: session.phone,
      startedAt: session.startedAt,
      endedAt: Date.now(),
      bookedMinutes: session.hours * 60 + session.extraMinutes,
    });
  }

  function extend(id: string) {
    setSessions((current) => {
      const session = current[id];
      if (!session) return current;
      return {
        ...current,
        [id]: {
          ...session,
          endsAt: Math.max(Date.now(), session.endsAt) + 15 * 60 * 1000,
          extraMinutes: session.extraMinutes + 15,
          alarmed: false,
        },
      };
    });
    setNotice(`${stations.find((item) => item.id === id)?.name ?? "Station"} extended by 15 minutes.`);
  }

  const station = board.find((item) => item.id === selected) ?? board[0];
  if (!station) return null;
  const session = sessions[station.id];
  const draft = draftFor(station.id);
  const live = board.filter((item) => {
    const current = sessions[item.id];
    return current && current.endsAt > now;
  }).length;
  const done = board.filter((item) => {
    const current = sessions[item.id];
    return current && now > 0 && current.endsAt <= now;
  }).length;
  const open = board.length - live - done;

  if (wall) {
    return (
      <ConsoleWall
        board={board}
        sessions={sessions}
        now={now}
        notice={notice}
        error={error}
        errorBay={errorBay}
        draftFor={draftFor}
        onDraft={updateDraft}
        onStart={start}
        onExtend={extend}
        onClear={clear}
      />
    );
  }

  return (
    <div>
      <p className="sr-only" aria-live="assertive">
        {notice}
      </p>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          [String(live).padStart(2, "0"), "Active"],
          [String(open).padStart(2, "0"), "Ready"],
          [String(done).padStart(2, "0"), "Time up"],
        ].map(([value, label]) => (
          <div key={label} className="border border-white/10 bg-navy px-3 py-4">
            <p className="font-tech text-2xl text-paper sm:text-3xl">{value}</p>
            <p className="mt-1 text-[0.62rem] uppercase tracking-[0.16em] text-mist sm:text-xs">{label}</p>
          </div>
        ))}
      </div>
      {notice ? (
        <p className="mt-4 rounded-2xl border border-magenta/40 bg-magenta/10 px-4 py-3 text-sm text-paper">
          {notice}
        </p>
      ) : null}

      <div className="mt-6 grid gap-3">
        {only ? null : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {board.map((item) => {
            const current = sessions[item.id];
            const remaining = current ? current.endsAt - now : 0;
            const complete = Boolean(current && now > 0 && remaining <= 0);
            const running = Boolean(current && !complete);
            const active = item.id === station.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setSelected(item.id);
                  setError("");
                }}
                className={`bay ${active ? "is-selected" : ""} ${running ? "is-live" : ""} ${complete ? "is-done" : ""}`}
              >
                <span className="font-tech text-3xl text-paper">{item.id}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm text-paper">
                    {current ? current.name || "Guest" : item.privateRoom ? "Private room" : "Ready"}
                  </span>
                  <span className="mt-1 block truncate text-[0.62rem] uppercase tracking-[0.16em] text-mist">
                    {running ? formatClock(remaining) : complete ? "Time up" : item.name}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        )}

        <Desk
          stationId={station.id}
          name={station.name}
          privateRoom={station.privateRoom}
          session={session}
          now={now}
          draft={draft}
          error={error}
          onDraft={(patch) => updateDraft(station.id, patch)}
          onStart={() => start(station.id)}
          onExtend={() => extend(station.id)}
          onClear={() => clear(station.id)}
        />
      </div>
    </div>
  );
}

function Desk({
  stationId,
  name,
  privateRoom,
  session,
  now,
  draft,
  error,
  onDraft,
  onStart,
  onExtend,
  onClear,
}: {
  stationId: string;
  name: string;
  privateRoom: boolean;
  session?: Session;
  now: number;
  draft: Draft;
  error: string;
  onDraft: (patch: Partial<Draft>) => void;
  onStart: () => void;
  onExtend: () => void;
  onClear: () => void;
}) {
  const remaining = session ? session.endsAt - now : 0;
  const complete = Boolean(session && now > 0 && remaining <= 0);
  const running = Boolean(session && !complete);
  const total = session ? session.hours * 60 * 60 * 1000 : 1;
  const progress = running ? Math.min(1, Math.max(0, remaining / total)) : complete ? 0 : 1;
  const hourly = rateForStation(stationId);
  const bookedHours = session?.hours ?? draft.hours;
  const extraMinutes = session?.extraMinutes ?? 0;
  const extraCost = hourly?.rupees != null ? Math.round((extraMinutes / 60) * hourly.rupees) : 0;
  const amount = hourly?.rupees != null ? hourly.rupees * bookedHours + extraCost : null;

  return (
    <article className={`floor-card ${complete ? "is-complete" : ""} ${running ? "is-live" : ""}`}>
      <div className="grid min-h-[31rem] lg:grid-cols-[17rem_1fr]">
        <div className="flex flex-col justify-between border-b border-white/10 pb-6 lg:border-r lg:border-b-0 lg:pr-7 lg:pb-0">
          <div className="flex items-start justify-between gap-4 lg:block">
            <div>
              <p className="font-tech text-[0.58rem] tracking-[0.25em] text-cyan uppercase">
                {privateRoom ? "Private room" : "Selected bay"}
              </p>
              <p className="mt-3 font-tech text-6xl leading-none text-paper sm:text-7xl">{stationId}</p>
            </div>
            <p className={`status-pill ${running ? "is-live" : complete ? "is-done" : ""}`}>
              {running ? "Active" : complete ? "Time up" : "Ready"}
            </p>
          </div>
          <div className="mt-8 lg:mt-0">
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-mist">
              {privateRoom ? "Dedicated private room" : "Main floor console"}
            </p>
            <h2 className="mt-2 text-3xl tracking-wide text-paper">{name}</h2>
            <div className="slash-rule mt-5 w-20" />
          </div>
        </div>

        <div className="pt-7 lg:pl-8 lg:pt-0">
          {session && now > 0 ? (
            <div className="grid h-full content-between gap-8">
              <div className="grid gap-7 xl:grid-cols-[1fr_auto] xl:items-start">
                <div>
                  <p className="text-[0.65rem] uppercase tracking-[0.2em] text-mist">Customer</p>
                  <p className="mt-2 text-4xl text-paper sm:text-5xl">{session.name || "Guest"}</p>
                  {session.phone ? (
                    <a
                      href={`tel:${session.phone.replace(/\s/g, "")}`}
                      className="mt-3 inline-block text-cyan"
                    >
                      {session.phone}
                    </a>
                  ) : null}
                  {session.note ? (
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-mist">{session.note}</p>
                  ) : null}
                </div>
                <div className="border-l-2 border-cyan pl-4">
                  <p className="text-[0.62rem] uppercase tracking-[0.18em] text-mist">
                    {privateRoom ? "In this room" : "Session"}
                  </p>
                  <p className="mt-2 text-sm text-paper">
                    {session.players} {session.players === 1 ? "player" : "players"} · {session.hours}{" "}
                    {session.hours === 1 ? "hour" : "hours"}
                  </p>
                  <Amount
                    hourly={hourly?.rupees}
                    hours={session.hours}
                    amount={amount}
                    unit={hourly?.unit}
                    extraMinutes={session.extraMinutes}
                  />
                </div>
              </div>
              <div>
                <p className="clock-digits font-tech text-[clamp(2.8rem,9vw,6.5rem)] leading-none text-cyan" role="timer">
                  {complete ? "00:00:00" : formatClock(remaining)}
                </p>
                <div className="mt-6 h-1 bg-white/10">
                  <div
                    className="h-1 bg-gradient-to-r from-cyan via-blue to-violet"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-sm text-paper">{complete ? "Time is up." : "Clock is running."}</p>
                  <p className="font-tech text-[0.58rem] tracking-[0.18em] text-mist uppercase">Live timer</p>
                </div>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  <button type="button" className="btn btn-primary w-full" onClick={onExtend}>
                    + 15 minutes
                  </button>
                  <button type="button" className="btn btn-secondary w-full" onClick={onClear}>
                    {complete ? "Clear station" : "End session"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form
              className="grid gap-5"
              onSubmit={(event) => {
                event.preventDefault();
                onStart();
              }}
            >
              <div>
                <p className="font-tech text-[0.6rem] tracking-[0.24em] text-cyan uppercase">New session</p>
                <h3 className="mt-2 text-3xl text-paper sm:text-4xl">
                  {privateRoom ? "Who will be in the room" : "Add customer details"}
                </h3>
                <p className="mt-2 text-sm text-mist">Name is required. Phone and note are optional.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[0.62rem] uppercase tracking-[0.16em] text-mist">Customer name</span>
                  <input
                    value={draft.name}
                    onChange={(event) => onDraft({ name: event.target.value })}
                    className="desk-input mt-2"
                    placeholder="Who is playing"
                    autoComplete="name"
                    maxLength={60}
                  />
                </label>
                <label className="block">
                  <span className="text-[0.62rem] uppercase tracking-[0.16em] text-mist">Phone</span>
                  <input
                    value={draft.phone}
                    onChange={(event) => onDraft({ phone: event.target.value })}
                    className="desk-input mt-2"
                    placeholder="Optional"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={20}
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-[0.62rem] uppercase tracking-[0.16em] text-mist">Session note</span>
                <input
                  value={draft.note}
                  onChange={(event) => onDraft({ note: event.target.value })}
                  className="desk-input mt-2"
                  placeholder="Optional — crew, request, anything to remember"
                  maxLength={120}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Stepper
                  id={`${stationId}-players`}
                  label="Players"
                  value={draft.players}
                  onChange={(players) => onDraft({ players })}
                  min={MIN_PLAYERS}
                  max={MAX_PLAYERS}
                />
                <Stepper
                  id={`${stationId}-hours`}
                  label="Hours"
                  value={draft.hours}
                  onChange={(hours) => onDraft({ hours })}
                  min={MIN_HOURS}
                  max={MAX_HOURS}
                />
              </div>
              <Amount hourly={hourly?.rupees} hours={draft.hours} amount={amount} unit={hourly?.unit} />
              {error ? <p className="text-sm text-magenta">{error}</p> : null}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-sm text-xs leading-relaxed text-mist">
                  Customer details and timers stay on this device.
                </p>
                <button type="submit" className="btn btn-primary w-full sm:w-auto">
                  Start session
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </article>
  );
}

function Amount({
  hourly,
  hours,
  amount,
  unit,
  extraMinutes = 0,
}: {
  hourly: number | null | undefined;
  hours: number;
  amount: number | null;
  unit?: string;
  extraMinutes?: number;
}) {
  const extra = hourly != null ? Math.round((extraMinutes / 60) * hourly) : 0;
  return (
    <div className="mt-4 border border-white/10 bg-black/30 px-4 py-3">
      <p className="text-[0.62rem] uppercase tracking-[0.18em] text-mist">Amount</p>
      {amount != null && hourly != null ? (
        <>
          <p className="mt-1 font-tech text-3xl text-paper">{formatRupees(amount)}</p>
          <p className="mt-1 text-xs text-mist">
            {formatRupees(hourly)} {unit} × {hours} {hours === 1 ? "hour" : "hours"}
            {extra > 0 ? ` + ${formatRupees(extra)} extra` : ""}
          </p>
        </>
      ) : (
        <p className="mt-1 font-tech text-3xl text-white/30">₹ —</p>
      )}
    </div>
  );
}

function Stepper({
  id,
  label,
  value,
  onChange,
  min,
  max,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="border border-white/10 bg-black/30 p-3">
      <label htmlFor={id} className="text-[0.62rem] uppercase tracking-[0.16em] text-mist">
        {label}
      </label>
      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          className="grid size-10 place-items-center border border-white/15 text-lg text-paper"
          aria-label={`Decrease ${label.toLowerCase()}`}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          −
        </button>
        <input
          id={id}
          inputMode="numeric"
          value={value}
          aria-label={label}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (!Number.isFinite(next)) return;
            onChange(Math.min(max, Math.max(min, Math.round(next))));
          }}
          className="w-10 bg-transparent text-center font-display text-2xl text-paper outline-none"
        />
        <button
          type="button"
          className="grid size-10 place-items-center border border-white/15 text-lg text-paper"
          aria-label={`Increase ${label.toLowerCase()}`}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          +
        </button>
      </div>
    </div>
  );
}

const rails = ["#16DCFF", "#5B8CFF", "#B26BFF", "#EC39FF", "#F5C542", "#FF4D6D"];

function ConsoleWall({
  board,
  sessions,
  now,
  notice,
  error,
  errorBay,
  draftFor,
  onDraft,
  onStart,
  onExtend,
  onClear,
}: {
  board: readonly (typeof stations)[number][];
  sessions: Record<string, Session>;
  now: number;
  notice: string;
  error: string;
  errorBay: string;
  draftFor: (id: string) => Draft;
  onDraft: (id: string, patch: Partial<Draft>) => void;
  onStart: (id: string) => void;
  onExtend: (id: string) => void;
  onClear: (id: string) => void;
}) {
  return (
    <div>
      <p className="sr-only" aria-live="assertive">
        {notice}
      </p>
      {notice ? (
        <p className="mb-4 rounded-2xl border border-magenta/40 bg-magenta/10 px-4 py-3 text-sm text-paper">
          {notice}
        </p>
      ) : null}
      <ul className="grid gap-4 lg:grid-cols-2">
        {board.map((item, index) => {
          const session = sessions[item.id];
          const draft = draftFor(item.id);
          const remaining = session ? session.endsAt - now : 0;
          const complete = Boolean(session && now > 0 && remaining <= 0);
          const running = Boolean(session && !complete);
          const tone = item.privateRoom ? "#FF4D6D" : rails[index % rails.length];
          const hourly = rateForStation(item.id);
          const hours = session?.hours ?? draft.hours;
          const extraMinutes = session?.extraMinutes ?? 0;
          const rate = hourly?.rupees ?? 0;
          const extraCost = Math.round((extraMinutes / 60) * rate);
          const amount = rate * hours + extraCost;
          const persons = session?.players ?? draft.players;
          return (
            <li
              key={item.id}
              className={`console-ticket ${running ? "is-live" : ""} ${complete ? "is-done" : ""}`}
              style={{ "--tone": tone } as CSSProperties}
            >
              <div className="console-rail">
                <strong>{item.id}</strong>
                <span>{item.rate === "simulator" ? "Sim" : item.privateRoom ? "Room" : "Floor"}</span>
              </div>
              <div className="min-w-0 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg text-paper">
                      {session?.name || (item.privateRoom ? "Private room" : item.name)}
                    </p>
                    <p className="text-[0.65rem] tracking-[0.16em] text-mist uppercase">
                      {running ? "On the clock" : complete ? "Time up" : "Open for a booking"}
                    </p>
                  </div>
                  <p className={`status-pill ${running ? "is-live" : complete ? "is-done" : ""}`}>
                    {running ? "Live" : complete ? "Done" : "Free"}
                  </p>
                </div>

                {session && now > 0 ? (
                  <div className="mt-4">
                    <p className="clock-digits text-[clamp(2rem,6vw,3.4rem)] leading-none" style={{ color: tone }}>
                      {complete ? "00:00:00" : formatClock(remaining)}
                    </p>
                    <dl className="mt-4 grid grid-cols-3 gap-2">
                      <div className="console-stat">
                        <dt>Persons</dt>
                        <dd>{persons}</dd>
                      </div>
                      <div className="console-stat">
                        <dt>Hours</dt>
                        <dd>{hours}</dd>
                      </div>
                      <div className="console-stat">
                        <dt>Amount</dt>
                        <dd>{formatRupees(amount)}</dd>
                      </div>
                    </dl>
                    {session.phone ? <p className="mt-3 text-sm text-cyan">{session.phone}</p> : null}
                    {extraMinutes > 0 ? (
                      <p className="mt-2 text-xs tracking-[0.12em] text-mist uppercase">
                        Extra time +{extraMinutes} min · {formatRupees(extraCost)}
                      </p>
                    ) : null}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button type="button" className="btn btn-primary w-full px-2" onClick={() => onExtend(item.id)}>
                        + 15 extra
                      </button>
                      <button type="button" className="btn btn-secondary w-full px-2" onClick={() => onClear(item.id)}>
                        {complete ? "Clear" : "End"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form
                    className="mt-4 grid gap-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      onStart(item.id);
                    }}
                  >
                    <label className="block">
                      <span className="text-[0.62rem] tracking-[0.16em] text-mist uppercase">Booking name</span>
                      <input
                        value={draft.name}
                        onChange={(event) => onDraft(item.id, { name: event.target.value })}
                        className="desk-input"
                        placeholder="Who is playing"
                        maxLength={60}
                      />
                    </label>
                    <label className="block">
                      <span className="text-[0.62rem] tracking-[0.16em] text-mist uppercase">Mobile number</span>
                      <input
                        value={draft.phone}
                        onChange={(event) => onDraft(item.id, { phone: event.target.value })}
                        className="desk-input"
                        placeholder="10-digit number for points"
                        inputMode="tel"
                        autoComplete="tel"
                        maxLength={16}
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Stepper
                        id={`${item.id}-persons`}
                        label="Persons"
                        value={draft.players}
                        min={MIN_PLAYERS}
                        max={MAX_PLAYERS}
                        onChange={(players) => onDraft(item.id, { players })}
                      />
                      <Stepper
                        id={`${item.id}-hours`}
                        label="Hours"
                        value={draft.hours}
                        min={MIN_HOURS}
                        max={MAX_HOURS}
                        onChange={(hoursValue) => onDraft(item.id, { hours: hoursValue })}
                      />
                    </div>
                    <p className="font-tech text-2xl text-paper">
                      {formatRupees(rate * draft.hours)}
                      <span className="ml-2 font-sans text-xs tracking-normal text-mist">
                        {formatRupees(rate)} × {draft.hours} {draft.hours === 1 ? "hour" : "hours"}
                      </span>
                    </p>
                    {errorBay === item.id && error ? <p className="text-sm text-magenta">{error}</p> : null}
                    <button type="submit" className="btn btn-primary w-full">
                      Start timer
                    </button>
                  </form>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
