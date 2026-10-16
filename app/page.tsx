import type { Metadata } from "next";
import { BookingSection } from "@/components/BookingSection";
import { Founders } from "@/components/Founders";
import { Gallery } from "@/components/Gallery";
import { Games } from "@/components/Games";
import { Hero } from "@/components/Hero";
import { LiveBoard } from "@/components/LiveStatus";
import { Location } from "@/components/Location";
import { LoyaltyHome } from "@/components/LoyaltyHome";
import { Membership } from "@/components/Membership";
import { Pricing } from "@/components/Pricing";
import { PrivateRoom } from "@/components/PrivateRoom";
import { Reviews } from "@/components/Reviews";
import { Stations } from "@/components/Stations";
import { WhyNexus } from "@/components/WhyNexus";

export const metadata: Metadata = {
  description:
    "PS5 gaming in Panoor, Kannur. Six consoles, a private gaming room, and WhatsApp booking at Nexus Playzone.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <main id="content">
      <Hero />
      <LiveBoard />
      <WhyNexus />
      <Stations />
      <PrivateRoom />
      <Games />
      <Pricing />
      <Membership />
      <BookingSection />
      <LoyaltyHome />
      <Gallery />
      <Reviews />
      <Founders />
      <Location />
    </main>
  );
}
