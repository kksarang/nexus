import type { Metadata } from "next";
import { CallButton, WhatsAppButton } from "@/components/ContactButtons";
import { Founders } from "@/components/Founders";
import { Location } from "@/components/Location";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Visit Us in Panoor",
  description:
    "Find the Nexus Playzone PS5 gaming station in Panoor, Kannur, near Thalassery. Map, phone, and WhatsApp.",
  alternates: { canonical: "/visit" },
};

export default function VisitPage() {
  return (
    <main id="content">
      <PageHero
        eyebrow="Visit us"
        title={
          <>
            Find us in <span className="text-gradient">Panoor.</span>
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
        Drop in, say hi, and grab a controller. Message ahead to make sure your station is free.
      </PageHero>
      <Location heading={false} />
      <Founders />
    </main>
  );
}
