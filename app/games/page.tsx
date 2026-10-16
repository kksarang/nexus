import type { Metadata } from "next";
import { BookButton } from "@/components/BookSlot";
import { Games } from "@/components/Games";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "PS5 Game Library",
  description:
    "Play EA Sports FC, WWE 2K, GTA V, Marvel’s Spider-Man, racing games, and more on PS5 at Nexus Playzone, Panoor.",
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
        Football, wrestling, open-world, action, and racing, all on new PS5 consoles. Filter by genre
        below, or ask us for a specific title.
      </PageHero>
      <Games heading={false} />
    </main>
  );
}
