import type { Metadata } from "next";
import { Hero } from "@/components/Hero";
import { HomeDoors } from "@/components/HomeDoors";
import { HomeSteps } from "@/components/HomeSteps";
import { HomeStats } from "@/components/PriceCopy";

export const metadata: Metadata = {
  description:
    "PS5 gaming station in Panoor, Kannur, for Thalassery and nearby. Six consoles, a private room, and WhatsApp booking at Nexus Playzone.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <main id="content">
      <Hero />
      <HomeStats />
      <HomeDoors />
      <HomeSteps />
    </main>
  );
}
