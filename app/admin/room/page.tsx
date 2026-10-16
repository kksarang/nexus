import type { Metadata } from "next";
import { RoomDesk } from "@/components/RoomDesk";
import { formatRupees } from "@/lib/format";
import { rates } from "@/lib/site";

export const metadata: Metadata = { title: "Start a session", robots: { index: false, follow: false } };

export default function AdminRoomPage() {
  const shown = [
    ["PS5 · 01–04", rates.find((rate) => rate.key === "station")?.rupees],
    ["Car simulator · 05", rates.find((rate) => rate.key === "simulator")?.rupees],
    ["Private room · 06", rates.find((rate) => rate.key === "private")?.rupees],
  ] as const;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl tracking-wide text-paper uppercase">Start a session</h1>
          <p className="mt-2 max-w-2xl text-sm text-mist">
            Pick a console and choose an existing customer by name or mobile. Their name and number fill in, so you do not type them again. Ending a session saves the paid minutes and the amount collected.
          </p>
        </div>
        <dl className="flex flex-wrap gap-2">
          {shown.map(([label, rupees]) => (
            <div key={label} className="rounded-lg border border-white/10 bg-[#101624] px-3 py-2">
              <dt className="text-xs text-mist">{label}</dt>
              <dd className="text-sm font-semibold text-paper">{rupees != null ? `${formatRupees(rupees)} / hour` : "—"}</dd>
            </div>
          ))}
        </dl>
      </div>
      <RoomDesk />
    </div>
  );
}
