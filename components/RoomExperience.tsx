import { BookButton } from "@/components/BookSlot";
import { FloorBoard } from "@/components/FloorBoard";

export function RoomExperience() {
  return (
    <section className="pt-28 pb-20 sm:pt-32 sm:pb-24">
      <div className="shell">
        <div className="grid gap-8 border-b border-white/10 pb-8 lg:grid-cols-[1fr_24rem] lg:items-end">
          <div>
            <div className="flex items-center gap-4">
              <span className="font-tech text-[0.6rem] tracking-[0.24em] text-cyan">OPS/06</span>
              <span className="h-px w-12 bg-cyan/60" />
              <p className="text-[0.68rem] uppercase tracking-[0.3em] text-cyan">Floor control</p>
            </div>
            <h1 className="mt-4 max-w-4xl text-[3.4rem] leading-[0.82] tracking-wide text-paper uppercase sm:text-7xl">
              Every station.
              <br />
              One control desk.
            </h1>
          </div>
          <div className="border-l-2 border-cyan pl-5">
            <p className="text-sm leading-relaxed text-mist">
              Select a console, add the customer, set players and hours, then start. Each clock runs
              independently and sounds a short alarm at zero.
            </p>
            <p className="mt-3 text-[0.65rem] uppercase tracking-[0.18em] text-paper">
              Tap a numbered bay to begin
            </p>
          </div>
        </div>
        <div className="mt-6">
          <FloorBoard />
        </div>
        <div className="mt-6 flex flex-col items-start gap-4 border border-white/10 bg-navy p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-cyan">Station 06 · Private room</p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-mist sm:text-base">
              Customers book through the website form, WhatsApp, or a call. Requests for Station 06
              arrive on WhatsApp marked as the private room.
            </p>
          </div>
          <BookButton className="w-full sm:w-auto">Book a slot</BookButton>
        </div>
      </div>
    </section>
  );
}
