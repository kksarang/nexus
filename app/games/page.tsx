import type { Metadata } from "next";
import { BookButton } from "@/components/BookSlot";
import { Games } from "@/components/Games";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "PS5 Game Library",
  description:
    "Play the latest PS5 games at Nexus Playzone, a gaming station in Panoor for Thalassery and Kannur.",
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
