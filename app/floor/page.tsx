import type { Metadata } from "next";
import { RoomExperience } from "@/components/RoomExperience";

export const metadata: Metadata = {
  title: "Floor Control",
  description: "Staff floor control for Nexus Playzone stations.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/floor" },
};

export default function FloorPage() {
  return (
    <main id="content">
      <RoomExperience />
    </main>
  );
}
