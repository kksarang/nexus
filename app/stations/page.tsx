import type { Metadata } from "next";
import { BookButton } from "@/components/BookSlot";
import { WhatsAppButton } from "@/components/ContactButtons";
import { LiveBoard } from "@/components/LiveStatus";
import { PageHero } from "@/components/PageHero";
import { StationsIntro } from "@/components/PriceCopy";
import { Stations } from "@/components/Stations";

export const metadata: Metadata = {
  title: "PS5 Stations in Panoor",
  description:
    "Four PS5 stations, a car simulator, and a private room at Nexus Playzone, Panoor.",
  alternates: { canonical: "/stations" },
};

export default function StationsPage() {
  return (
    <main id="content">
      <PageHero
        eyebrow="Our stations"
        title={
          <>
            Four PS5 stations. <span className="text-gradient">One car simulator.</span>
          </>
        }
        image="/images/ps5-console.jpg"
        actions={
          <>
            <BookButton>Book a station</BookButton>
            <WhatsAppButton />
          </>
        }
      >
        <StationsIntro />
      </PageHero>
      <LiveBoard />
      <Stations heading={false} />
    </main>
  );
}
