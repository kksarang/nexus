"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { formatClock, formatRupees } from "@/lib/format";
import { REWARD_MINUTES, chargeForSession, type FinishedPlay } from "@/lib/loyalty";
import type { LiveTimer } from "@/lib/loyaltyApi";
import { hourlyFor, getPrices } from "@/lib/prices";
import { useLivePrices } from "@/components/useLivePrices";
import { stations } from "@/lib/site";

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
  member: boolean;
  reward: boolean;
};

type Draft = {
  name: string;
  phone: string;
  note: string;
  players: number;
  hours: number;
  customerId?: string;
  membershipId?: string;
  membershipLeft?: number;
  useReward?: boolean;
};

export type DeskCustomer = { id: string; name: string; phone: string };

export type DeskMembership = { id: string; left: number; endsLabel: string } | null;

const MEMBER_STATIONS = ["01", "02", "03", "04"];

const MIN_PLAYERS = 1;
const MAX_PLAYERS = 8;
const DURATIONS = [
  { hours: 0.5, label: "30 min" },
  { hours: 1, label: "1 hour" },
  { hours: 1.5, label: "1 hr 30" },
  { hours: 2, label: "2 hours" },
  { hours: 3, label: "3 hours" },
] as const;

function durationLabel(hours: number) {
  const match = DURATIONS.find((item) => item.hours === hours);
  if (match) return match.label;
  const minutes = Math.round(hours * 60);
  if (minutes < 60) return `${minutes} min`;
  const whole = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!rest) return whole === 1 ? "1 hour" : `${whole} hours`;
  return `${whole} hr ${rest} min`;
}

function memberSessionsFor(hours: number) {
  return Math.max(1, Math.ceil(hours));
}

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

function sessionFromTimer(remote: LiveTimer, stationEnd: number): Session {
  const plannedEnd = Math.max(remote.endsAt, remote.startedAt + (remote.planMinutes + remote.extraMinutes) * 60 * 1000);
  const stationExtends = stationEnd > plannedEnd + 30 * 1000;
  const extraMinutes = stationExtends
    ? Math.max(remote.extraMinutes, Math.round((stationEnd - remote.startedAt) / 60000) - remote.planMinutes)
    : remote.extraMinutes;
  const endsAt = stationExtends ? Math.max(plannedEnd, stationEnd) : plannedEnd;
  return {
    name: remote.name,
    phone: remote.phone,
    note: remote.note,
    players: remote.players,
    hours: remote.planMinutes / 60,
    startedAt: remote.startedAt,
    endsAt,
    alarmed: endsAt <= Date.now(),
    extraMinutes,
    member: remote.member,
    reward: remote.reward,
  };
}

function amountFor(session: Session, stationId: string, endedAt: number) {
  const hourly = hourlyFor(stationId, getPrices());
  return chargeForSession({
    hourlyRupees: hourly,
    startedAt: session.startedAt,
    endedAt,
    planMinutes: Math.round(session.hours * 60),
    member: session.member,
    reward: session.reward,
  });
}

export function FloorBoard({
  only,
  wall = false,
  activeCustomer,
  customers = [],
  customersLoading = false,
  onLookupMembership,
  readOnly = false,
  timersReady = false,
  remoteSessions = [],
  stationUntil = {},
  onFinish,
  onStart,
  onExtend,
}: {
  only?: string;
  wall?: boolean;
  activeCustomer?: { id: string; name: string; phone: string; membership?: DeskMembership; rewardReady?: boolean } | null;
  customers?: DeskCustomer[];
  customersLoading?: boolean;
  onLookupMembership?: (customerId: string) => Promise<DeskMembership>;
  readOnly?: boolean;
  timersReady?: boolean;
  remoteSessions?: LiveTimer[];
  stationUntil?: Record<string, number | null>;
  onFinish?: (play: FinishedPlay) => void;
  onExtend?: (play: { stationId: string; startedAt: number; endsAt: number; bookedMinutes: number; extraMinutes: number }) => void;
  onStart?: (play: {
    stationId: string;
    stationName: string;
    name: string;
    phone: string;
    startedAt: number;
    bookedMinutes: number;
    planMinutes: number;
    players: number;
    note: string;
    member: boolean;
    reward?: boolean;
    membershipId?: string;
    memberSessions?: number;
  }) => void | Promise<void>;
}) {
  useLivePrices();
  const board = only ? stations.filter((item) => item.id === only) : stations;
  const [sessions, setSessions] = useState<Record<string, Session>>({});
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [selected, setSelected] = useState<string>(only ?? stations[0].id);
  const [now, setNow] = useState(0);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [errorBay, setErrorBay] = useState("");
  const sessionsRef = useRef(sessions);
  const closedRef = useRef(new Map<string, number>());

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setNow(Date.now()));
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
    if (!timersReady) return;
    setSessions((current) => {
      const next: Record<string, Session> = {};
      for (const remote of remoteSessions) {
        const key = `${remote.stationId}_${remote.startedAt}`;
        if ((closedRef.current.get(key) ?? 0) > Date.now()) continue;
        const local = current[remote.stationId];
        const restored = sessionFromTimer(remote, stationUntil[remote.stationId] ?? 0);
        if (local && local.startedAt === remote.startedAt) {
          const endsAt = Math.max(local.endsAt, restored.endsAt);
          const extraMinutes = Math.max(local.extraMinutes, restored.extraMinutes);
          next[remote.stationId] = {
            ...restored,
            endsAt,
            extraMinutes,
            alarmed: local.alarmed && endsAt <= Date.now(),
          };
        } else {
          next[remote.stationId] = restored;
        }
      }
      const time = Date.now();
      for (const [id, local] of Object.entries(current)) {
        if (next[id]) continue;
        if ((closedRef.current.get(`${id}_${local.startedAt}`) ?? 0) > Date.now()) continue;
        if (time - local.startedAt < 20000) next[id] = local;
      }
      return next;
    });
  }, [timersReady, remoteSessions, stationUntil]);

  function withCustomer(existing?: Draft) {
    if (!activeCustomer) return existing ?? emptyDraft();
    const untouched = !existing || (existing.customerId === undefined && !existing.name.trim() && !existing.phone.trim());
    const samePerson = existing?.customerId === activeCustomer.id;
    if (!untouched && !samePerson) return existing ?? emptyDraft();
    return {
      ...(existing ?? emptyDraft()),
      name: activeCustomer.name,
      phone: activeCustomer.phone,
      customerId: activeCustomer.id,
      membershipId: activeCustomer.membership?.id,
      membershipLeft: activeCustomer.membership?.left,
    };
  }

  function draftFor(id: string) {
    return withCustomer(drafts[id]);
  }

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts((current) => {
      const base = withCustomer(current[id]);
      const next = { ...base, ...patch };
      const identityChange =
        ("name" in patch && patch.name !== base.name) || ("phone" in patch && patch.phone !== base.phone);
      if (identityChange && !("membershipId" in patch) && !("customerId" in patch)) {
        next.customerId = undefined;
        next.membershipId = undefined;
        next.membershipLeft = undefined;
        next.useReward = false;
      }
      return { ...current, [id]: next };
    });
    setError("");
  }

  function chooseCustomer(id: string, customer: DeskCustomer) {
    updateDraft(id, {
      name: customer.name,
      phone: customer.phone,
      customerId: customer.id,
      membershipId: undefined,
      membershipLeft: undefined,
    });
    if (!onLookupMembership) return;
    void onLookupMembership(customer.id).then((membership) => {
      setDrafts((current) => {
        const draft = current[id];
        if (!draft || draft.customerId !== customer.id) return current;
        return {
          ...current,
          [id]: { ...draft, membershipId: membership?.id, membershipLeft: membership?.left },
        };
      });
    });
  }

  function clearCustomer(id: string) {
    updateDraft(id, {
      name: "",
      phone: "",
      customerId: "",
      membershipId: undefined,
      membershipLeft: undefined,
    });
  }

  async function start(id: string) {
    if (readOnly) {
      setErrorBay(id);
      setError("This login can view gaming, not start a session.");
      return;
    }
    if (!timersReady) {
      setErrorBay(id);
      setError("Open sessions are still loading.");
      return;
    }
    const draft = draftFor(id);
    const name = draft.name.trim();
    if (!name) {
      setErrorBay(id);
      setError("Add the customer name before starting.");
      return;
    }
    const useReward = Boolean(draft.useReward && activeCustomer?.rewardReady);
    const member = Boolean(draft.membershipId && MEMBER_STATIONS.includes(id) && !useReward);
    if (draft.useReward && draft.membershipId && MEMBER_STATIONS.includes(id)) {
      setErrorBay(id);
      setError("Use either the membership or the free 30 minutes for this session.");
      return;
    }
    const hours = useReward ? REWARD_MINUTES / 60 : draft.hours;
    const memberSessions = memberSessionsFor(hours);
    if (member && memberSessions > (draft.membershipLeft ?? 0)) {
      setErrorBay(id);
      setError(`Only ${draft.membershipLeft ?? 0} membership sessions are left. Choose a shorter time or collect payment.`);
      return;
    }
    const startedAt = Date.now();
    const bookedMinutes = Math.round(hours * 60);
    const bay = stations.find((item) => item.id === id);
    try {
      await onStart?.({
        stationId: id,
        stationName: bay?.name ?? id,
        name,
        phone: draft.phone.trim(),
        startedAt,
        bookedMinutes,
        planMinutes: bookedMinutes,
        players: draft.players,
        note: draft.note.trim(),
        member,
        reward: useReward,
        ...(member ? { membershipId: draft.membershipId, memberSessions } : {}),
      });
    } catch (reason) {
      setErrorBay(id);
      setError(reason instanceof Error ? reason.message : "The session was not started.");
      return;
    }
    armAlarm();
    setSessions((current) => ({
      ...current,
      [id]: {
        name,
        phone: draft.phone.trim(),
        note: draft.note.trim(),
        players: draft.players,
        hours,
        startedAt,
        endsAt: startedAt + bookedMinutes * 60 * 1000,
        alarmed: false,
        extraMinutes: 0,
        member,
        reward: useReward,
      },
    }));
    setDrafts((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setNotice("");
    setError("");
  }

  function clear(id: string, amount: number) {
    if (readOnly) return;
    if (!Number.isInteger(amount) || amount < 0) return;
    const session = sessionsRef.current[id];
    if (session) closedRef.current.set(`${id}_${session.startedAt}`, Date.now() + 20000);
    setSessions((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    if (!session || !onFinish) return;
    const bay = stations.find((item) => item.id === id);
    const endedAt = Date.now();
    onFinish({
      stationId: id,
      stationName: bay?.name ?? id,
      name: session.name,
      phone: session.phone,
      startedAt: session.startedAt,
      endedAt,
      bookedMinutes: Math.round(session.hours * 60) + session.extraMinutes,
      reward: session.reward,
      ...(amount > 0 ? { collectedRupees: amount } : {}),
    });
  }

  function extend(id: string) {
    if (readOnly) return;
    const existing = sessionsRef.current[id];
    if (!existing) return;
    const endsAt = Math.max(Date.now(), existing.endsAt) + 15 * 60 * 1000;
    setSessions((current) => {
      const session = current[id];
      if (!session) return current;
      return {
        ...current,
        [id]: {
          ...session,
          endsAt,
          extraMinutes: session.extraMinutes + 15,
          alarmed: false,
        },
      };
    });
    setNotice(`${stations.find((item) => item.id === id)?.name ?? "Station"} extended by 15 minutes.`);
    onExtend?.({
      stationId: id,
      startedAt: existing.startedAt,
      endsAt,
      bookedMinutes: Math.round(existing.hours * 60) + existing.extraMinutes + 15,
      extraMinutes: existing.extraMinutes + 15,
    });
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
        customers={customers}
        customersLoading={customersLoading}
        readOnly={readOnly}
        timersReady={timersReady}
        rewardReady={Boolean(activeCustomer?.rewardReady)}
        onDraft={updateDraft}
        onChoose={chooseCustomer}
        onClearCustomer={clearCustomer}
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
                    {running && now > 0 ? formatClock(remaining) : complete ? "Time up" : item.name}
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
          customers={customers}
          customersLoading={customersLoading}
          error={error}
          onDraft={(patch) => updateDraft(station.id, patch)}
          onChoose={(customer) => chooseCustomer(station.id, customer)}
          onClearCustomer={() => clearCustomer(station.id)}
          onStart={() => start(station.id)}
          onExtend={() => extend(station.id)}
          onClear={(amount) => clear(station.id, amount)}
          timersReady={timersReady}
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
  customers,
  customersLoading,
  error,
  onDraft,
  onChoose,
  onClearCustomer,
  onStart,
  onExtend,
  onClear,
  timersReady,
}: {
  stationId: string;
  name: string;
  privateRoom: boolean;
  session?: Session;
  now: number;
  draft: Draft;
  customers: DeskCustomer[];
  customersLoading: boolean;
  error: string;
  onDraft: (patch: Partial<Draft>) => void;
  onChoose: (customer: DeskCustomer) => void;
  onClearCustomer: () => void;
  onStart: () => void;
  onExtend: () => void;
  onClear: (amount: number) => void;
  timersReady: boolean;
}) {
  const remaining = session ? session.endsAt - now : 0;
  const complete = Boolean(session && now > 0 && remaining <= 0);
  const running = Boolean(session && !complete);
  const total = session ? (session.hours * 60 + session.extraMinutes) * 60 * 1000 : 1;
  const progress = running ? Math.min(1, Math.max(0, remaining / total)) : complete ? 0 : 1;
  const hourly = hourlyFor(stationId, getPrices());
  const bookedHours = session?.hours ?? draft.hours;
  const extraMinutes = session?.extraMinutes ?? 0;
  const extraCost = Math.round((extraMinutes / 60) * hourly);
  const quote = session && now > 0 ? amountFor(session, stationId, now) : null;
  const amount = quote ? quote.amount : Math.round(hourly * bookedHours + extraCost);

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
                    {session.players} {session.players === 1 ? "player" : "players"} · {durationLabel(session.hours)}
                  </p>
                  <Amount
                    hourly={hourly}
                    hours={session.hours}
                    amount={amount}
                    unit="per hour"
                    extraMinutes={session.extraMinutes}
                  />
                </div>
              </div>
              <div>
                <p className="clock-digits font-tech text-[clamp(2.8rem,9vw,6.5rem)] leading-none text-cyan" role="timer">
                  {now > 0 ? (complete ? "00:00:00" : formatClock(remaining)) : "—"}
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
                <CompleteBox session={session} now={now} stationId={stationId} onExtend={onExtend} onComplete={onClear} />
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
                <p className="font-tech text-[0.6rem] tracking-[0.24em] text-cyan uppercase">{timersReady ? "New session" : "Loading"}</p>
                <h3 className="mt-2 text-3xl text-paper sm:text-4xl">
                  {privateRoom ? "Who will be in the room" : "Add customer details"}
                </h3>
                <p className="mt-2 text-sm text-mist">Search an existing customer by name or mobile, or type someone new.</p>
              </div>
              <CustomerFields
                draft={draft}
                customers={customers}
                loading={customersLoading}
                onDraft={onDraft}
                onChoose={onChoose}
                onClearCustomer={onClearCustomer}
              />
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
              <Stepper
                id={`${stationId}-players`}
                label="Players"
                value={draft.players}
                onChange={(players) => onDraft({ players })}
                min={MIN_PLAYERS}
                max={MAX_PLAYERS}
              />
              <DurationPicker hours={draft.hours} onChange={(hours) => onDraft({ hours })} />
              <Amount hourly={hourly} hours={draft.hours} amount={amount} unit="per hour" />
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

function CustomerFields({
  draft,
  customers,
  loading,
  onDraft,
  onChoose,
  onClearCustomer,
}: {
  draft: Draft;
  customers: DeskCustomer[];
  loading: boolean;
  onDraft: (patch: Partial<Draft>) => void;
  onChoose: (customer: DeskCustomer) => void;
  onClearCustomer: () => void;
}) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState(false);
  const needle = query.trim().toLowerCase();
  const digits = query.replace(/\D/g, "");
  const matches = customers
    .filter((customer) => {
      if (!needle) return true;
      return customer.name.toLowerCase().includes(needle) || (digits.length >= 2 && customer.phone.includes(digits));
    })
    .slice(0, 8);

  if (draft.customerId && draft.name) {
    return (
      <div className="rounded-lg border border-cyan/40 bg-cyan/10 px-3 py-2">
        <p className="text-[0.62rem] tracking-[0.16em] text-mist uppercase">Customer</p>
        <p className="mt-1 text-sm font-semibold text-paper">{draft.name}</p>
        <p className="text-sm text-mist">{draft.phone || "No mobile on file"}</p>
        <button type="button" className="mt-2 text-sm font-semibold text-cyan" onClick={onClearCustomer}>
          Change customer
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="relative">
        <label className="block">
          <span className="text-[0.62rem] tracking-[0.16em] text-mist uppercase">Existing customer</span>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 150)}
            className="desk-input mt-1"
            placeholder="Search name or mobile"
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
          />
        </label>
        {open ? (
          <ul id={listId} role="listbox" className="mt-1 max-h-52 overflow-auto rounded-lg border border-white/15 bg-[#101624]">
            {loading && customers.length === 0 ? (
              <li className="px-3 py-2 text-sm text-mist">Loading customers…</li>
            ) : customers.length === 0 ? (
              <li className="px-3 py-2 text-sm text-mist">No saved customers yet.</li>
            ) : matches.length === 0 ? (
              <li className="px-3 py-2 text-sm text-mist">No customer matches that name or number.</li>
            ) : (
              matches.map((customer) => (
                <li key={customer.id} role="option" aria-selected={false}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-white/5"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onChoose(customer);
                      setQuery("");
                      setOpen(false);
                      setManual(false);
                    }}
                  >
                    <span className="font-medium text-paper">{customer.name}</span>
                    <span className="text-mist">{customer.phone || "No mobile"}</span>
                  </button>
                </li>
              ))
            )}
            {customers.length > matches.length ? (
              <li className="px-3 py-2 text-xs text-mist">Keep typing to search the rest of the list.</li>
            ) : null}
          </ul>
        ) : null}
      </div>
      {manual ? (
        <div className="grid gap-3">
          <label className="block">
            <span className="text-[0.62rem] tracking-[0.16em] text-mist uppercase">Booking name</span>
            <input
              value={draft.name}
              onChange={(event) => onDraft({ name: event.target.value })}
              className="desk-input mt-1"
              placeholder="Who is playing"
              autoComplete="name"
              maxLength={60}
            />
          </label>
          <label className="block">
            <span className="text-[0.62rem] tracking-[0.16em] text-mist uppercase">Mobile number</span>
            <input
              value={draft.phone}
              onChange={(event) => onDraft({ phone: event.target.value })}
              className="desk-input mt-1"
              placeholder="10-digit number for points"
              inputMode="tel"
              autoComplete="tel"
              maxLength={16}
            />
          </label>
        </div>
      ) : (
        <button type="button" className="text-left text-sm font-semibold text-cyan" onClick={() => setManual(true)}>
          Not in the list? Enter name and mobile
        </button>
      )}
    </div>
  );
}

function CompleteBox({
  session,
  now,
  stationId,
  onExtend,
  onComplete,
}: {
  session: Session;
  now: number;
  stationId: string;
  onExtend: () => void;
  onComplete: (amount: number) => void;
}) {
  const quote = amountFor(session, stationId, now > 0 ? now : session.startedAt);
  const [edited, setEdited] = useState<string | null>(null);
  const value = edited ?? String(quote.amount);
  const amount = Number(value);
  const ready = value.trim() !== "" && Number.isInteger(amount) && amount >= 0;
  const started = new Date(session.startedAt).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
  });
  return (
    <div className="mt-4">
      <p className="text-sm text-paper">
        {quote.usedMinutes} min played · suggested {formatRupees(quote.amount)}
      </p>
      <p className="mt-1 text-xs text-mist">
        Started {started} · {durationLabel(session.hours)} booked
        {session.extraMinutes ? ` · +${session.extraMinutes} min` : ""}.
      </p>
      <label className="mt-3 block">
        <span className="text-[0.62rem] tracking-[0.16em] text-mist uppercase">Amount paid ₹</span>
        <input
          inputMode="numeric"
          value={value}
          onFocus={() => {
            if (edited === null) setEdited(value);
          }}
          onChange={(event) => setEdited(event.target.value.replace(/\D/g, "").slice(0, 6))}
          className="desk-input mt-1"
          placeholder="Enter the amount"
        />
      </label>
      <p className="mt-2 text-xs text-mist">
        {ready
          ? session.phone
            ? `${formatRupees(amount)} and the points for this time are saved on ${session.name}.`
            : `${formatRupees(amount)} is saved. There is no mobile number, so points cannot be added to a customer.`
          : "Enter the amount paid. Complete stays off until this box has a number."}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          className={`btn btn-primary w-full px-2 ${ready ? "" : "cursor-not-allowed opacity-40"}`}
          disabled={!ready}
          onClick={() => {
            if (ready) onComplete(amount);
          }}
        >
          Complete
        </button>
        <button type="button" className="btn btn-secondary w-full px-2" onClick={onExtend}>
          + 15 extra
        </button>
      </div>
    </div>
  );
}

function DurationPicker({ hours, onChange }: { hours: number; onChange: (hours: number) => void }) {
  return (
    <fieldset>
      <legend className="text-[0.62rem] tracking-[0.16em] text-mist uppercase">Time</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {DURATIONS.map((item) => (
          <button
            key={item.hours}
            type="button"
            aria-pressed={hours === item.hours}
            className={`rounded-full border px-3 py-1.5 text-sm ${hours === item.hours ? "border-cyan bg-cyan text-ink" : "border-white/15 text-paper"}`}
            onClick={() => onChange(item.hours)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </fieldset>
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
            {formatRupees(hourly)} {unit} × {durationLabel(hours)}
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
  customers,
  customersLoading,
  readOnly,
  timersReady,
  rewardReady,
  onDraft,
  onChoose,
  onClearCustomer,
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
  customers: DeskCustomer[];
  customersLoading: boolean;
  readOnly: boolean;
  timersReady: boolean;
  rewardReady: boolean;
  onDraft: (id: string, patch: Partial<Draft>) => void;
  onChoose: (id: string, customer: DeskCustomer) => void;
  onClearCustomer: (id: string) => void;
  onStart: (id: string) => void;
  onExtend: (id: string) => void;
  onClear: (id: string, amount: number) => void;
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
          const rate = hourlyFor(item.id, getPrices());
          const hours = session?.hours ?? draft.hours;
          const extraMinutes = session?.extraMinutes ?? 0;
          const extraCost = Math.round((extraMinutes / 60) * rate);
          const quote = session && now > 0 ? amountFor(session, item.id, now) : null;
          const amount = quote ? quote.amount : Math.round(rate * hours);
          const persons = session?.players ?? draft.players;
          const memberCovered = Boolean(draft.membershipId && MEMBER_STATIONS.includes(item.id));
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
                      {now > 0 ? (complete ? "00:00:00" : formatClock(remaining)) : "—"}
                    </p>
                    <dl className="mt-4 grid grid-cols-3 gap-2">
                      <div className="console-stat">
                        <dt>Persons</dt>
                        <dd>{persons}</dd>
                      </div>
                      <div className="console-stat">
                        <dt>Time</dt>
                        <dd>{durationLabel(hours)}</dd>
                      </div>
                      <div className="console-stat">
                        <dt>{session.reward ? "Reward" : session.member ? "Membership" : "Amount"}</dt>
                        <dd>{session.reward && amount === 0 ? "Free" : session.member && amount === 0 ? "Prepaid" : formatRupees(amount)}</dd>
                      </div>
                    </dl>
                    {extraMinutes > 0 && !session.reward ? (
                      <p className="mt-2 text-xs tracking-[0.12em] text-mist uppercase">
                        Extra time +{extraMinutes} min · {formatRupees(extraCost)}
                      </p>
                    ) : null}
                    {session.reward ? (
                      <p className="mt-2 text-xs text-cyan">
                        The first {REWARD_MINUTES} minutes are free and earn no points.
                        {amount > 0 ? " Time after that is charged and earns points." : ""}
                      </p>
                    ) : null}
                    {readOnly ? (
                      <p className="mt-4 text-sm text-mist">View only. This login cannot change a running session.</p>
                    ) : (
                      <>
                        <CompleteBox
                          session={session}
                          now={now}
                          stationId={item.id}
                          onExtend={() => onExtend(item.id)}
                          onComplete={(amount) => onClear(item.id, amount)}
                        />
                      </>
                    )}
                  </div>
                ) : (
                  <form
                    className="mt-4 grid gap-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      onStart(item.id);
                    }}
                  >
                    {!timersReady ? <p className="text-sm text-mist">Loading the saved timer…</p> : null}
                    {timersReady ? (
                      <>
                    <CustomerFields
                      draft={draft}
                      customers={customers}
                      loading={customersLoading}
                      onDraft={(patch) => onDraft(item.id, patch)}
                      onChoose={(customer) => onChoose(item.id, customer)}
                      onClearCustomer={() => onClearCustomer(item.id)}
                    />
                    <Stepper
                      id={`${item.id}-persons`}
                      label="Persons"
                      value={draft.players}
                      min={MIN_PLAYERS}
                      max={MAX_PLAYERS}
                      onChange={(players) => onDraft(item.id, { players })}
                    />
                    {draft.useReward ? (
                      <p className="text-sm text-cyan">Free reward · {REWARD_MINUTES} minutes. Time after 30 minutes is charged and earns points.</p>
                    ) : (
                      <DurationPicker hours={draft.hours} onChange={(hoursValue) => onDraft(item.id, { hours: hoursValue })} />
                    )}
                    {rewardReady ? (
                      <label className="flex items-start gap-2 text-sm text-paper">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={Boolean(draft.useReward)}
                          onChange={(event) => onDraft(item.id, { useReward: event.target.checked, hours: event.target.checked ? REWARD_MINUTES / 60 : draft.hours })}
                        />
                        Use this week&apos;s free {REWARD_MINUTES} minutes on this console. It can be used once, and only when this session is completed.
                      </label>
                    ) : null}
                    {draft.useReward && memberCovered ? (
                      <p className="text-sm text-magenta">Use either the membership or the free 30 minutes.</p>
                    ) : null}
                    {memberCovered && !draft.useReward ? (
                      <p className="rounded-lg border border-cyan/40 bg-cyan/10 px-3 py-2 text-sm text-cyan">
                        Member · uses {memberSessionsFor(draft.hours)} of {draft.membershipLeft ?? 0} sessions left. Nothing to collect.
                      </p>
                    ) : (
                      <>
                        {draft.membershipId ? (
                          <p className="text-xs text-mist">The membership covers Stations 01 to 04 only. This console is charged normally.</p>
                        ) : null}
                        <p className="font-tech text-2xl text-paper">
                          {draft.useReward ? formatRupees(0) : formatRupees(Math.round(rate * draft.hours))}
                          <span className="ml-2 font-sans text-xs tracking-normal text-mist">
                            {draft.useReward ? `Free ${REWARD_MINUTES} min` : `${formatRupees(rate)} × ${durationLabel(draft.hours)}`}
                          </span>
                        </p>
                      </>
                    )}
                    {errorBay === item.id && error ? <p className="text-sm text-magenta">{error}</p> : null}
                    {readOnly ? (
                      <p className="text-sm text-mist">View only. This login cannot start a session.</p>
                    ) : (
                      <button type="submit" className="btn btn-primary w-full">
                        Start timer
                      </button>
                    )}
                      </>
                    ) : null}
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
