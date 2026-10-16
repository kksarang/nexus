import type { Metadata } from "next";
import { Founders } from "@/components/Founders";
import { PageHero } from "@/components/PageHero";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Us",
  description: "Nexus Playzone is a PS5 gaming station in Panoor, Kannur, near Thalassery, founded by Vishnu, Sarang, and Adarsh.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main id="content">
      <PageHero
        eyebrow="About us"
        title={
          <>
            A lounge built for <span className="text-gradient">the session.</span>
          </>
        }
        image="/images/hero-lounge.jpg"
      >
        {site.description} {site.tagline}
      </PageHero>
      <Founders />
    </main>
  );
}
