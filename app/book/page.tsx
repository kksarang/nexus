import type { Metadata } from "next";
import { BookingSection } from "@/components/BookingSection";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Book a PS5 Session",
  description:
    "Book a PS5 station or the private gaming room at Nexus Playzone, Panoor. Pick a date, time, players, and station, then confirm on WhatsApp.",
  alternates: { canonical: "/book" },
};

export default function BookPage() {
  return (
    <main id="content">
      <PageHero
        eyebrow="Book your session"
        title={
          <>
            Insert coin. <span className="text-gradient">Press start.</span>
          </>
        }
        image="/images/hero-lounge.jpg"
      >
        Tell us when you are coming, how many are playing, and which station you want. We confirm on
        WhatsApp.
      </PageHero>
      <BookingSection heading={false} />
    </main>
  );
}
