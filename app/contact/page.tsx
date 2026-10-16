import type { Metadata } from "next";
import { CallButton, WhatsAppButton } from "@/components/ContactButtons";
import { Location } from "@/components/Location";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Contact",
  description: "Call or WhatsApp Nexus Playzone, the PS5 gaming station in Panoor, Kannur, near Thalassery.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main id="content">
      <PageHero
        eyebrow="Contact"
        title={
          <>
            Talk to the <span className="text-gradient">desk.</span>
          </>
        }
        image="/images/private-room.jpg"
        actions={
          <>
            <WhatsAppButton />
            <CallButton />
          </>
        }
      >
        Phone, WhatsApp, and email are the ways to reach the lounge. Message ahead if you want a station held.
      </PageHero>
      <Location heading={false} />
    </main>
  );
}
