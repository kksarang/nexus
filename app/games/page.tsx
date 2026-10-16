import type { Metadata } from "next";
import { BookButton } from "@/components/BookSlot";
import { Games } from "@/components/Games";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "PS5 Game Library",
  description:
    "Play the latest EA Sports FC, WWE 2K, GTA V, Marvel’s Spider-Man 2, Star Wars: Galactic Racer, and Ghost of Yōtei on PS5 at Nexus Playzone, Panoor.",
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
        The main PS5 games ready on the consoles. Filter by genre below, or ask for a title that is not listed.
      </PageHero>
      <Games heading={false} />
    </main>
  );
}
