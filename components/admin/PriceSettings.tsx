"use client";

import { IndianRupee } from "lucide-react";
import { useState } from "react";
import { useLivePrices } from "@/components/useLivePrices";
import { savePrices, type PriceBook } from "@/lib/prices";

const fields: { key: keyof PriceBook; label: string; hint: string }[] = [
  { key: "station", label: "Stations 01–04, ₹ per hour", hint: "Walk-in price on the main floor." },
  { key: "simulator", label: "Car simulator, ₹ per hour", hint: "Station 05." },
  { key: "privateRoom", label: "Private room, ₹ per hour", hint: "Station 06." },
  { key: "memberSessions", label: "Monthly plays", hint: "Plays a new monthly member receives. Valid for 1 month." },
  { key: "memberRupees", label: "Monthly plan, ₹", hint: "Shown on the website." },
  { key: "quarterSessions", label: "Quarterly plays", hint: "Valid for 3 months." },
  { key: "quarterRupees", label: "Quarterly plan, ₹", hint: "Shown on the website." },
  { key: "yearSessions", label: "Yearly plays", hint: "Valid for 12 months." },
  { key: "yearRupees", label: "Yearly plan, ₹", hint: "Shown on the website." },
];

export function PriceSettings() {
  const live = useLivePrices();
  const [draft, setDraft] = useState<PriceBook | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const form = draft ?? live;

  function setField(key: keyof PriceBook, raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    setDraft({ ...form, [key]: digits === "" ? 0 : Number(digits) });
  }

  return (
    <section id="prices" className="grid gap-4 rounded-xl border border-white/10 bg-[#101624] p-5">
      <div>
        <h2 className="flex items-center gap-2 text-xl text-paper">
          <IndianRupee size={18} aria-hidden="true" /> Prices
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-mist">
          These amounts are what the website and the desk use. Saving updates the public pages straight away. Members who already joined keep the plan, play count, and end date they were given.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.key} className="text-sm text-mist">
            {field.label}
            <input
              className="desk-input mt-1"
              inputMode="numeric"
              value={String(form[field.key])}
              onChange={(event) => setField(field.key, event.target.value)}
            />
            <span className="mt-1 block text-xs">{field.hint}</span>
          </label>
        ))}
      </div>
      {message ? (
        <p className={`rounded-lg border px-3 py-2 text-sm ${message.ok ? "border-cyan/40 bg-cyan/10 text-cyan" : "border-magenta/40 bg-magenta/10 text-magenta"}`} role="status">
          {message.text}
        </p>
      ) : null}
      <button
        type="button"
        className="btn btn-primary w-fit"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setMessage(null);
          void savePrices(form)
            .then(() => {
              setDraft(null);
              setMessage({ ok: true, text: "Saved. The website is using these prices now." });
            })
            .catch((reason: unknown) => {
              setMessage({ ok: false, text: reason instanceof Error ? reason.message : "Could not save the prices." });
            })
            .finally(() => setBusy(false));
        }}
      >
        {busy ? "Saving…" : "Save prices"}
      </button>
    </section>
  );
}
