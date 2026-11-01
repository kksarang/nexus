import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Pricing } from "@/components/Pricing";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Hourly PS5, car simulator, and private room rates at Nexus Playzone, Panoor.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <main id="content">
      <PageHero
        eyebrow="Pricing"
        title={
          <>
            Simple rates. <span className="text-gradient">No guesswork.</span>
          </>
        }
        image="/images/crew-session.jpg"
      >
        Hourly rates for a station, the car simulator, or the private room. Pick a mode and see your total.
      </PageHero>
      <Pricing heading={false} />
      <section className="pb-20 sm:pb-28">
        <div className="shell">
          <Link href="/membership" className="tile tile-link flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8">
            <span>
              <span className="block font-display text-2xl text-paper uppercase sm:text-3xl">Play often? Become a member.</span>
              <span className="mt-1 block text-sm text-mist">Monthly, quarterly, and yearly plans for regulars.</span>
            </span>
            <ArrowRight className="text-magenta" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
