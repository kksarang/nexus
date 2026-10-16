import type { Metadata } from "next";
import { BookingSection } from "@/components/BookingSection";
import { PrivateRoom } from "@/components/PrivateRoom";

export const metadata: Metadata = {
  title: "Private Gaming Room in Panoor",
  description:
    "Book the private gaming room at Nexus Playzone, Panoor. Your own PS5 and screen for friends, couples, and groups.",
  alternates: { canonical: "/private-room" },
};

export default function PrivateRoomPage() {
  return (
    <main id="content" className="pt-16">
      <PrivateRoom standalone />
      <BookingSection />
    </main>
  );
}
