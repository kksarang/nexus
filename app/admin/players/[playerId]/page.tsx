"use client";

import { useParams } from "next/navigation";
import { PlayerProfile } from "@/components/admin/PlayerProfile";

export default function PlayerPage() {
  const params = useParams<{ playerId: string }>();
  const playerId = Array.isArray(params.playerId) ? params.playerId[0] : params.playerId;
  if (!playerId) return null;
  return <PlayerProfile playerId={playerId} />;
}
