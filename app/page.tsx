import type { Metadata } from "next";
import { AppPromo } from "@/components/AppPromo";
import { Hero } from "@/components/Hero";
import { HomeDoors } from "@/components/HomeDoors";
import { HomeGlance } from "@/components/HomeGlance";
import { HomeGames } from "@/components/HomeGames";
import { HomeSteps } from "@/components/HomeSteps";
import { LocalPlay } from "@/components/LocalPlay";
import { Membership } from "@/components/Membership";
import { HomeStats } from "@/components/PriceCopy";

export const metadata: Metadata = {
  description:
    "PS5 gaming cafe in Panoor for Thalassery, Koothuparamba, and Kannur. Six gaming stations, a private room, and WhatsApp booking at Nexus Playzone.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <main id="content">
      <Hero />
      <HomeStats />
      <HomeDoors />
      <Membership />
      <HomeGames />
      <HomeGlance />
      <LocalPlay />
      <AppPromo />
      <HomeSteps />
    </main>
  );
}
