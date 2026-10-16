"use client";

import { useState } from "react";
import { useDesk } from "@/components/admin/AdminShell";

const presets = [
  ["today", "Today"],
  ["week", "This week"],
  ["month", "This month"],
  ["year", "This year"],
  ["all", "All time"],
] as const;

export function RangeBar() {
  const desk = useDesk();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-wrap gap-2">
        {presets.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => desk.setPreset(key)}
            className={`rounded-full border px-3 py-1.5 text-xs tracking-wide uppercase ${desk.rangeKey === key ? "border-cyan bg-cyan/15 text-cyan" : "border-white/10 text-mist"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          desk.setCustom(start, end);
        }}
      >
        <label className="text-xs text-mist">
          From
          <input type="date" value={start} onChange={(event) => setStart(event.target.value)} className="desk-input mt-1" />
        </label>
        <label className="text-xs text-mist">
          To
          <input type="date" value={end} onChange={(event) => setEnd(event.target.value)} className="desk-input mt-1" />
        </label>
        <button type="submit" className="btn btn-secondary min-h-10">
          Apply
        </button>
      </form>
    </div>
  );
}

export function DeskNote() {
  const desk = useDesk();
  if (desk.loading && !desk.data) {
    return <div className="mt-6 h-28 animate-pulse rounded-2xl bg-white/5" />;
  }
  if (desk.error) return <p className="mt-4 text-sm text-magenta">{desk.error}</p>;
  if (desk.data?.capped) return <p className="mt-4 text-sm text-mist">Showing the latest 2,000 sessions in this range.</p>;
  return null;
}
