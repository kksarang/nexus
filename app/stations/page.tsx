import type { Metadata } from "next";
import { BookButton } from "@/components/BookSlot";
import { WhatsAppButton } from "@/components/ContactButtons";
import { PageHero } from "@/components/PageHero";
import { Stations } from "@/components/Stations";

export const metadata: Metadata = {
  title: "PS5 Stations in Panoor",
  description:
    "Six new PS5 console stations at Nexus Playzone, Panoor: five on the main floor and one dedicated private gaming room.",
  alternates: { canonical: "/stations" },
};

export default function StationsPage() {
  return (
    <main id="content">
      <PageHero
        eyebrow="Our stations"
        title={
          <>
            Six PS5 stations. <span className="text-gradient">One for you.</span>
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
        Stations 01 to 05 sit on the main floor. Station 06 is the private room. Every one runs a new
        PlayStation 5 with the full game library.
      </PageHero>
      <Stations heading={false} />
    </main>
  );
}
