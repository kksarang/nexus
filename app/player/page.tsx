import type { Metadata } from "next";
import { PlayerDesk } from "@/components/PlayerDesk";

export const metadata: Metadata = {
  title: "Player card",
  description: "Check Nexus Playzone loyalty points with the mobile number registered at the counter.",
};

export default function PlayerPage() {
  return (
    <main id="content">
      <section className="pt-28 pb-20 sm:pt-32 sm:pb-24">
        <div className="shell">
          <p className="font-tech text-[0.65rem] tracking-[0.28em] text-violet uppercase">Loyalty</p>
          <h1 className="mt-3 max-w-3xl text-5xl leading-none tracking-wide text-paper uppercase sm:text-7xl">
            Your player card
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-mist">
            Use the mobile number the counter saved. One paid hour earns 1 point. Ten points in a Monday to Sunday
            week unlocks 30 minutes of free play, claimed at the shop.
          </p>
          <div className="mt-8">
            <PlayerDesk />
          </div>
        </div>
      </section>
    </main>
  );
}
