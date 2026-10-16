import type { Metadata } from "next";
import { RoomDesk } from "@/components/RoomDesk";
import { RateChips } from "@/components/PriceCopy";

export const metadata: Metadata = { title: "Start a session", robots: { index: false, follow: false } };

export default function AdminRoomPage() {
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl tracking-wide text-paper uppercase">Start a session</h1>
          <p className="mt-2 max-w-2xl text-sm text-mist">
            Pick a console and choose an existing customer by name or mobile. Their name and number fill in, so you do not type them again. Ending a session saves the paid minutes and the amount collected.
          </p>
        </div>
        <RateChips />
      </div>
      <RoomDesk />
    </div>
  );
}
