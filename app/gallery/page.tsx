import type { Metadata } from "next";
import { BookButton } from "@/components/BookSlot";
import { Gallery } from "@/components/Gallery";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos from Nexus Playzone, the PS5 gaming station in Panoor, Kannur, near Thalassery.",
  alternates: { canonical: "/gallery" },
};

export default function GalleryPage() {
  return (
    <main id="content">
      <PageHero
        eyebrow="Gallery"
        title={
          <>
            Inside the <span className="text-gradient">lounge.</span>
          </>
        }
        actions={<BookButton>Book a session</BookButton>}
      >
        The consoles, the screens, the seats, the private room, and the founders.
      </PageHero>
      <Gallery heading={false} />
    </main>
  );
}
