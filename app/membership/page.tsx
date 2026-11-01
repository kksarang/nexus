import type { Metadata } from "next";
import { Membership } from "@/components/Membership";
import { MembershipCompare } from "@/components/MembershipCompare";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Membership",
  description: "Monthly, quarterly, and yearly PS5 membership plans at Nexus Playzone, Panoor.",
  alternates: { canonical: "/membership" },
};

export default function MembershipPage() {
  return (
    <main id="content">
      <PageHero
        eyebrow="Membership"
        title={
          <>
            Play more. <span className="text-gradient">Pay less.</span>
          </>
        }
        image="/images/ps5-console.jpg"
      >
        Monthly, quarterly, or yearly plans for regulars on Stations 01 to 04. Pay and join at the counter.
      </PageHero>
      <Membership heading={false} />
      <MembershipCompare />
    </main>
  );
}
