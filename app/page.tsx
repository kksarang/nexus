import type { Metadata } from "next";
import { BookingSection } from "@/components/BookingSection";
import { Founders } from "@/components/Founders";
import { Gallery } from "@/components/Gallery";
import { Games } from "@/components/Games";
import { Hero } from "@/components/Hero";
import { Location } from "@/components/Location";
import { LoyaltyHome } from "@/components/LoyaltyHome";
import { Membership } from "@/components/Membership";
import { Pricing } from "@/components/Pricing";
import { PrivateRoom } from "@/components/PrivateRoom";
import { Stations } from "@/components/Stations";
import { Ticker } from "@/components/Ticker";
import { WhyNexus } from "@/components/WhyNexus";

export const metadata: Metadata = {
  description:
    "PS5 gaming station in Panoor, Kannur, for Thalassery and nearby. Six consoles, a private room, and WhatsApp booking at Nexus Playzone.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <main id="content">
      <Hero />
      <Ticker />
      <WhyNexus />
      <Stations />
      <PrivateRoom />
      <Games />
      <Pricing />
      <Membership />
      <LoyaltyHome />
      <BookingSection />
      <Gallery />
      <Founders />
      <Location />
    </main>
  );
}
