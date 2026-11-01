import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { GameTileArt } from "@/components/GameTile";
import { games } from "@/lib/site";

const featured = ["EA Sports FC", "WWE 2K", "GTA V", "Tekken 8", "Gran Turismo 7", "Marvel’s Spider-Man 2", "Call of Duty", "It Takes Two"];

export function HomeGames() {
  const rail = featured.flatMap((title) => games.filter((game) => game.title === title));
  return (
    <section className="pb-20 sm:pb-28">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Game library</p>
            <h2 className="mt-5 text-[2.2rem] text-paper uppercase sm:text-5xl">
              {games.length} games. <span className="text-gradient">Pick one.</span>
            </h2>
          </div>
          <Link href="/games" className="inline-flex items-center gap-2 text-sm font-semibold text-paper hover:text-cyan">
            See all games <ArrowRight size={16} className="text-magenta" aria-hidden="true" />
          </Link>
        </div>
        <ul className="game-rail mt-8 flex snap-x gap-3 overflow-x-auto pt-1 pb-2">
          {rail.map((game) => (
            <li key={game.title} className="w-44 shrink-0 snap-start sm:w-52">
              <Link href="/games" className="game-tile-card bevel relative block aspect-[3/4] overflow-hidden border border-white/15" aria-label={game.title}>
                <GameTileArt game={game} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
