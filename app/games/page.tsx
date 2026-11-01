import type { Metadata } from "next";
import { BookButton } from "@/components/BookSlot";
import { Games } from "@/components/Games";
import { PageHero } from "@/components/PageHero";
import { games } from "@/lib/site";

export const metadata: Metadata = {
  title: "PS5 Game Library",
  description:
    "Play the latest PS5 games at Nexus Playzone, a gaming cafe in Panoor for Thalassery, Koothuparamba, and Kannur.",
  alternates: { canonical: "/games" },
};

export default function GamesPage() {
  return (
    <main id="content">
      <PageHero
        eyebrow="Game library"
        title={
          <>
            Your game. <span className="text-gradient">Ready to load.</span>
          </>
        }
        image="/images/controller-glow.jpg"
        actions={<BookButton>Book a session</BookButton>}
      >
        {games.length} games to choose from. Search or filter below, then book and we keep your game ready. Ask if you want a title that is not listed.
      </PageHero>
      <Games />
    </main>
  );
}
