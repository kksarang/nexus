import type { Metadata } from "next";
import { Membership } from "@/components/Membership";
import { PageHero } from "@/components/PageHero";
import { Pricing } from "@/components/Pricing";

export const metadata: Metadata = {
  title: "Pricing and Membership",
  description:
    "Hourly PS5 rates and monthly, quarterly, and yearly membership at Nexus Playzone, Panoor.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <main id="content">
      <PageHero
        eyebrow="Pricing"
        title={
          <>
            Play by the hour. <span className="text-gradient">Save as a member.</span>
          </>
        }
        image="/images/crew-session.jpg"
      >
        Hourly rates for a station or the private room, and monthly, quarterly, or yearly plans for regulars.
      </PageHero>
      <Pricing heading={false} />
      <Membership />
    </main>
  );
}
