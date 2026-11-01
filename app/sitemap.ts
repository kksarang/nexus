import type { MetadataRoute } from "next";
import { gameSlug, games, getSiteUrl } from "@/lib/site";

const routes = [
  ["/", 1],
  ["/stations", 0.9],
  ["/private-room", 0.9],
  ["/book", 0.9],
  ["/games", 0.7],
  ["/pricing", 0.8],
  ["/membership", 0.7],
  ["/gallery", 0.6],
  ["/visit", 0.8],
  ["/about", 0.6],
  ["/contact", 0.7],
  ["/player", 0.6],
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const pages = routes.map(([path, priority]) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly",
    priority,
  }));
  const gamePages = games.map((game) => ({
    url: `${base}/games/${gameSlug(game.title)}`,
    priority: 0.5,
  }));
  return [...pages, ...gamePages];
}
