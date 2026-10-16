import type { Metadata } from "next";
import { BookingSection } from "@/components/BookingSection";
import { Founders } from "@/components/Founders";
import { Gallery } from "@/components/Gallery";
import { Games } from "@/components/Games";
import { Hero } from "@/components/Hero";
import { Location } from "@/components/Location";
import { Pricing } from "@/components/Pricing";
import { PrivateRoom } from "@/components/PrivateRoom";
import { Stations } from "@/components/Stations";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <main id="content">
      <Hero />
      <Stations />
      <PrivateRoom />
      <Games />
      <Pricing />
      <Gallery />
      <BookingSection />
      <Founders />
      <Location />
    </main>
  );
}
