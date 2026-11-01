import Image from "next/image";
import type { Game } from "@/lib/site";

export function GameTileArt({ game }: { game: Game }) {
  return (
    <>
      {game.image ? (
        <Image src={game.image} alt="" fill sizes="(min-width: 1024px) 16vw, 45vw" className="object-cover" />
      ) : (
        <span className="absolute inset-0" style={{ background: `radial-gradient(120% 120% at 100% 0%, ${game.accent}, #0e0a20 68%)` }} />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
      <span className="absolute inset-x-0 bottom-0 block p-2.5 text-left sm:p-3">
        <span className="block text-[0.62rem] font-bold tracking-[0.12em] uppercase" style={{ color: game.accent }}>
          {game.genre}
        </span>
        <span className="mt-0.5 block font-display text-sm text-paper uppercase">{game.title}</span>
      </span>
    </>
  );
}
