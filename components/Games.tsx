"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Gamepad2, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { WhatsAppButton } from "@/components/ContactButtons";
import { GameTileArt } from "@/components/GameTile";
import { gameGenres, gameSlug, games, isGameInGenre, messages } from "@/lib/site";

export function Games() {
  const [genre, setGenre] = useState("All");
  const [query, setQuery] = useState("");
  const [activeTitle, setActiveTitle] = useState(games[0].title);

  const needle = query.trim().toLowerCase();
  const list = games.filter(
    (game) => isGameInGenre(game, genre) && (!needle || game.title.toLowerCase().includes(needle)),
  );
  const active = list.find((game) => game.title === activeTitle) ?? list[0] ?? null;

  return (
    <section id="games" className="py-16 sm:py-20">
      <div className="shell">
        <div className="flex flex-col gap-4">
          <label className="relative block max-w-md">
            <span className="sr-only">Search games</span>
            <Search size={16} className="absolute top-1/2 left-4 -translate-y-1/2 text-mist" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search games"
              className="desk-input !mt-0 !pl-11"
            />
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by genre">
            {gameGenres.map((item) => (
              <button key={item} type="button" aria-pressed={genre === item} onClick={() => setGenre(item)} className="chip chip-button px-4 py-2 text-xs">
                {item}
              </button>
            ))}
          </div>
          <p data-count className="text-sm text-mist" aria-live="polite">
            {list.length} {list.length === 1 ? "game" : "games"}
          </p>
        </div>

        {active ? (
          <div className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="panel relative hidden lg:block h-[32rem] overflow-hidden lg:sticky lg:top-24">
              <AnimatePresence mode="sync" initial={false}>
                <motion.div
                  key={active.title}
                  className="absolute inset-0"
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <Image src={active.image ?? "/brand/nebula.jpg"} alt={active.alt ?? ""} fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
                  {active.image ? null : <div className="absolute inset-0 opacity-70 mix-blend-color" style={{ background: active.accent }} />}
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
                <span className="inline-flex rounded-sm px-2 py-0.5 text-xs font-bold tracking-[0.12em] uppercase" style={{ background: active.accent, color: "#05030c" }}>
                  {active.genre}
                </span>
                <h2 data-active className="mt-3 text-4xl text-paper uppercase sm:text-5xl">{active.title}</h2>
                <p className="mt-2 flex items-center gap-2 text-sm text-paper">
                  <Gamepad2 size={16} aria-hidden="true" style={{ color: active.accent }} />
                  {active.modes}
                </p>
                <p className="mt-3 line-clamp-2 max-w-xl text-sm text-paper/85">{active.about}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href={`/games/${gameSlug(active.title)}`} className="btn btn-primary btn-sm">
                    View game details
                  </Link>
                  <Link href={`/book?game=${encodeURIComponent(active.title)}`} className="btn btn-secondary btn-sm">
                    Book &amp; keep it ready
                  </Link>
                </div>
              </div>
            </div>

            <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {list.map((game) => {
                const selected = game.title === active.title;
                return (
                  <li key={game.title}>
                    <Link
                      href={`/games/${gameSlug(game.title)}`}
                      data-game
                      aria-label={`${game.title} details`}
                      onMouseEnter={() => setActiveTitle(game.title)}
                      onFocus={() => setActiveTitle(game.title)}
                      className={`game-tile-card bevel relative block aspect-[4/3] w-full overflow-hidden border-2 ${selected ? "is-active" : ""}`}
                      style={{ borderColor: selected ? game.accent : "rgba(255,255,255,0.12)" }}
                    >
                      <GameTileArt game={game} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="panel mt-6 p-8 text-center">
            <p className="font-display text-2xl text-paper uppercase">Not on the list?</p>
            <p className="mt-2 text-sm text-mist">Ask us. We may still have it or be able to get it ready.</p>
            <WhatsAppButton message={messages.games} className="mt-5">
              Ask about a game
            </WhatsAppButton>
          </div>
        )}
      </div>
    </section>
  );
}
