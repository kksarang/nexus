import type { Metadata } from "next";
import { PlayerProfile } from "@/components/admin/PlayerProfile";

export const instant = false;
export const metadata: Metadata = { title: "Player", robots: { index: false, follow: false } };

export default async function PlayerPage({ params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = await params;
  return <PlayerProfile playerId={playerId} />;
}
