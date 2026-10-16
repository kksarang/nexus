import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

const routes = [
  ["/", 1],
  ["/stations", 0.9],
  ["/private-room", 0.9],
  ["/book", 0.9],
  ["/games", 0.7],
  ["/pricing", 0.8],
  ["/gallery", 0.6],
  ["/visit", 0.8],
  ["/about", 0.6],
  ["/contact", 0.7],
  ["/player", 0.6],
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  return routes.map(([path, priority]) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly",
    priority,
  }));
}
