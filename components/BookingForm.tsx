"use client";

import { CheckCircle2, MessageCircle, Phone } from "lucide-react";
import { useId, useState, useSyncExternalStore, type FormEvent } from "react";
import { formatRupees } from "@/lib/format";
import { memberships, rates, site, stations, whatsappLink } from "@/lib/site";

type Mode = "station" | "membership";

const hourOptions = ["1 hour", "2 hours", "3 hours", "4 hours", "5+ hours"];
const playerOptions = Array.from({ length: 8 }, (_, index) => `${index + 1}`);

function localToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

const noSubscription = () => () => {};

function useToday() {
  return useSyncExternalStore(noSubscription, localToday, () => undefined);
}

function formatDate(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string) {
  if (!value) return "";
  const [hour, minute] = value.split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function subscribeToUrl(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function useQueryParam(key: string) {
  return useSyncExternalStore(
    subscribeToUrl,
    () => new URLSearchParams(window.location.search).get(key) ?? "",
    () => "",
  );
}

export function BookingForm() {
  const presetStation = useQueryParam("station");
  const presetPlan = useQueryParam("plan");
  const today = useToday();
  const formId = useId();

  const [modeChoice, setMode] = useState<Mode | null>(null);
  const [stationChoice, setStation] = useState<string | null>(null);
  const [planChoice, setPlan] = useState<string | null>(null);
  const mode = modeChoice ?? (presetPlan ? "membership" : "station");
  const station =
    stationChoice ?? (stations.some((item) => item.id === presetStation) ? presetStation : "any");
  const plan =
    planChoice ??
    (memberships.some((item) => item.key === presetPlan) ? presetPlan : memberships[0].key);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [hours, setHours] = useState(hourOptions[0]);
  const [players, setPlayers] = useState("2");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sentLink, setSentLink] = useState("");

  function validate() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Add your name.";
    if (phone.replace(/\D/g, "").length < 10) next.phone = "Add a 10-digit phone number.";
    if (mode === "station") {
      if (!date) next.date = "Pick a date.";
      if (!time) next.time = "Pick a start time.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function buildMessage() {
    if (mode === "membership") {
      const chosen = memberships.find((item) => item.key === plan);
      const tier = chosen?.tier ?? plan;
      return [
        "Hi Nexus Playzone, I would like to join a monthly membership.",
        `Name: ${name.trim()}`,
        `Phone: ${phone.trim()}`,
        `Plan: ${tier}`,
        chosen ? `Amount: ${formatRupees(chosen.rupees)} for ${chosen.sessions} sessions` : "",
        date ? `Start date: ${formatDate(date)}` : "",
        notes.trim() ? `Notes: ${notes.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    }
    const stationLabel =
      station === "any"
        ? "Any available station"
        : `${stations.find((item) => item.id === station)?.name ?? station} (Station ${station})`;
    const hourCount = hours.includes("+") ? null : Number.parseInt(hours, 10);
    const rate = rates.find((item) => item.key === (station === "06" ? "private" : "station"));
    const amountLine =
      rate?.rupees != null && hourCount
        ? `Amount: ${formatRupees(rate.rupees * hourCount)} (${formatRupees(rate.rupees)} per hour × ${hourCount})`
        : "";
    return [
      "Hi Nexus Playzone, I would like to book a session.",
      `Name: ${name.trim()}`,
      `Phone: ${phone.trim()}`,
      `Date: ${formatDate(date)}`,
      `Time: ${formatTime(time)}`,
      `Duration: ${hours}`,
      `Players: ${players}`,
      `Station: ${stationLabel}`,
      amountLine,
      notes.trim() ? `Notes: ${notes.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;
    const link = whatsappLink(buildMessage());
    setSentLink(link);
    window.open(link, "_blank", "noopener,noreferrer");
  }

  const field = (key: string) => ({
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `${formId}-${key}-error` : undefined,
  });

  const errorText = (key: string) =>
    errors[key] ? (
      <span id={`${formId}-${key}-error`} className="mt-1.5 block text-xs text-magenta">
        {errors[key]}
      </span>
    ) : null;

  if (sentLink) {
    return (
      <div className="panel panel-featured p-8 text-center sm:p-12">
        <CheckCircle2 size={44} className="mx-auto text-cyan" aria-hidden="true" />
        <h2 className="mt-5 text-4xl tracking-wide text-paper uppercase">Request ready</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-mist">
          WhatsApp opened with your details filled in. Press send there, and we will reply to confirm
          your slot.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a href={sentLink} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
            <MessageCircle size={16} aria-hidden="true" />
            Open WhatsApp again
          </a>
          <button type="button" className="btn btn-secondary" onClick={() => setSentLink("")}>
            Edit details
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="panel p-5 sm:p-8">
      <div role="tablist" aria-label="Booking type" className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
        {(
          [
            ["station", "Station booking"],
            ["membership", "Membership"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            className="tab"
            onClick={() => {
              setMode(value);
              setErrors({});
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <label className="field">
          <span className="field-label">Your name *</span>
          <input
            className="desk-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            placeholder="Player one"
            maxLength={60}
            {...field("name")}
          />
          {errorText("name")}
        </label>
        <label className="field">
          <span className="field-label">Phone number *</span>
          <input
            className="desk-input"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            autoComplete="tel"
            inputMode="tel"
            placeholder="98765 43210"
            maxLength={20}
            {...field("phone")}
          />
          {errorText("phone")}
        </label>

        {mode === "station" ? (
          <>
            <label className="field">
              <span className="field-label">Date *</span>
              <input
                type="date"
                className="desk-input"
                value={date}
                min={today}
                onChange={(event) => setDate(event.target.value)}
                {...field("date")}
              />
              {errorText("date")}
            </label>
            <label className="field">
              <span className="field-label">Start time *</span>
              <input
                type="time"
                className="desk-input"
                value={time}
                step={900}
                onChange={(event) => setTime(event.target.value)}
                {...field("time")}
              />
              {errorText("time")}
            </label>
            <label className="field">
              <span className="field-label">Hours</span>
              <select className="desk-input" value={hours} onChange={(event) => setHours(event.target.value)}>
                {hourOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Players</span>
              <select className="desk-input" value={players} onChange={(event) => setPlayers(event.target.value)}>
                {playerOptions.map((option) => (
                  <option key={option} value={option}>
                    {option} {option === "1" ? "player" : "players"}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="sm:col-span-2">
              <legend className="field-label">Preferred station</legend>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {[{ id: "any", label: "Any", sub: "First free" }, ...stations.map((item) => ({
                  id: item.id,
                  label: item.id,
                  sub: item.privateRoom ? "Private" : "Floor",
                }))].map((option) => (
                  <label
                    key={option.id}
                    className={`cursor-pointer rounded-xl border px-3 py-3 text-center transition-colors ${
                      station === option.id
                        ? option.id === "06"
                          ? "border-magenta bg-magenta/15"
                          : "border-cyan bg-cyan/12"
                        : "border-white/10 bg-black/20 hover:border-white/25"
                    }`}
                  >
                    <input
                      type="radio"
                      name="station"
                      value={option.id}
                      checked={station === option.id}
                      onChange={() => setStation(option.id)}
                      className="sr-only"
                    />
                    <span className="block font-tech text-lg text-paper">{option.label}</span>
                    <span className="block text-[0.65rem] tracking-[0.12em] text-mist uppercase">{option.sub}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        ) : (
          <>
            <label className="field">
              <span className="field-label">Membership plan</span>
              <select className="desk-input" value={plan} onChange={(event) => setPlan(event.target.value)}>
                {memberships.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.tier}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Start date</span>
              <input
                type="date"
                className="desk-input"
                value={date}
                min={today}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
          </>
        )}

        <label className="field sm:col-span-2">
          <span className="field-label">Special requests</span>
          <textarea
            className="desk-input min-h-24 resize-y"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="A game you want ready, a birthday, anything we should know"
            maxLength={300}
          />
        </label>
      </div>

      <div className="mt-7 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-sm text-xs leading-relaxed text-mist">
          Sending opens WhatsApp with your details filled in. Your slot is confirmed when we reply.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href={`tel:${site.phoneTel}`} className="btn btn-secondary">
            <Phone size={16} aria-hidden="true" />
            Call instead
          </a>
          <button type="submit" className="btn btn-primary">
            <MessageCircle size={16} aria-hidden="true" />
            {mode === "station" ? "Send booking" : "Request membership"}
          </button>
        </div>
      </div>
    </form>
  );
}
