import Image from "next/image";
import type { Game } from "@/lib/site";

function monogram(title: string) {
  const words = title.replace(/[^\p{L}\p{N} ]/gu, "").split(" ").filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

export function GameTileArt({ game }: { game: Game }) {
  return (
    <>
      {game.image ? (
        <Image src={game.image} alt="" fill sizes="(min-width: 1024px) 16vw, 45vw" className="object-cover" />
      ) : (
        <span className="absolute inset-0 grid place-items-center overflow-hidden" style={{ background: `radial-gradient(130% 110% at 100% 0%, ${game.accent}, #0e0a20 72%)` }}>
          <span className="-translate-y-[35%] font-tech text-[2.5rem] leading-none font-bold text-white/90 sm:text-5xl">{monogram(game.title)}</span>
        </span>
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
      <span className="absolute inset-x-0 bottom-0 block p-2.5 text-left sm:p-3">
        <span className="block text-[0.62rem] font-bold tracking-[0.12em] uppercase" style={{ color: game.accent }}>
          {game.genre}
        </span>
        <span className="mt-0.5 block font-display text-sm text-paper uppercase">{game.title}</span>
      </span>
    </>
  );
}
