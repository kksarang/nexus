import type { Metadata } from "next";
import { RoomDesk } from "@/components/RoomDesk";
import { formatRupees } from "@/lib/format";
import { rates } from "@/lib/site";

export const metadata: Metadata = {
  title: "All Consoles",
  description: "Bookings, timers, extra time, persons, and amounts for every Nexus Playzone console.",
  robots: { index: false, follow: false },
};

export default function RoomPage() {
  const floor = rates.find((rate) => rate.key === "station");
  const simulator = rates.find((rate) => rate.key === "simulator");
  const room = rates.find((rate) => rate.key === "private");

  return (
    <main id="content">
      <section className="pt-28 pb-20 sm:pt-32 sm:pb-24">
        <div className="shell">
          <div className="grid gap-6 border-b border-white/10 pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="font-tech text-[0.65rem] tracking-[0.28em] text-cyan uppercase">All six consoles</p>
              <h1 className="mt-3 max-w-4xl text-[3rem] leading-[0.84] tracking-wide text-paper uppercase sm:text-7xl">
                Booking, timer,
                <br />
                persons, amount.
              </h1>
            </div>
            <dl className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-cyan/40 bg-cyan/10 px-4 py-3">
                <dt className="text-[0.62rem] tracking-[0.16em] text-cyan uppercase">PS5</dt>
                <dd className="mt-1 font-tech text-3xl text-paper">
                  {floor?.rupees != null ? formatRupees(floor.rupees) : "—"}
                </dd>
              </div>
              <div className="rounded-2xl border border-[#D6FF3F]/40 bg-[#D6FF3F]/10 px-4 py-3">
                <dt className="text-[0.62rem] tracking-[0.16em] text-[#D6FF3F] uppercase">Car sim</dt>
                <dd className="mt-1 font-tech text-3xl text-paper">
                  {simulator?.rupees != null ? formatRupees(simulator.rupees) : "—"}
                </dd>
              </div>
              <div className="rounded-2xl border border-magenta/40 bg-magenta/10 px-4 py-3">
                <dt className="text-[0.62rem] tracking-[0.16em] text-magenta uppercase">Private room</dt>
                <dd className="mt-1 font-tech text-3xl text-paper">
                  {room?.rupees != null ? formatRupees(room.rupees) : "—"}
                </dd>
              </div>
            </dl>
          </div>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-mist">
            Every console keeps its own booking. Add who is playing, their mobile number, and how many persons,
            then start the timer. Ending the session saves paid minutes toward loyalty points. +15 extra adds
            fifteen minutes and the extra charge.
          </p>
          <div className="mt-6">
            <RoomDesk />
          </div>
        </div>
      </section>
    </main>
  );
}
