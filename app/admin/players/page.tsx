import type { Metadata } from "next";
import { PlayersDesk } from "@/components/admin/PlayersDesk";

export const metadata: Metadata = { title: "Players", robots: { index: false, follow: false } };

export default function PlayersPage() {
  return <PlayersDesk />;
}
