"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Gamepad2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BookButton } from "@/components/BookSlot";
import { WhatsAppButton } from "@/components/ContactButtons";
import { SectionIntro } from "@/components/SectionIntro";
import { gameGenres, games, messages } from "@/lib/site";

export function Games({ heading = true }: { heading?: boolean }) {
  const [genre, setGenre] = useState<(typeof gameGenres)[number]>("All");
  const [activeTitle, setActiveTitle] = useState<string>(games[0].title);
  const list = genre === "All" ? [...games] : games.filter((game) => game.genre === genre);
  const active = list.find((game) => game.title === activeTitle) ?? list[0];

  return (
    <section id="games" className="py-20 sm:py-28">
      <div className="shell">
        {heading ? (
          <SectionIntro
            eyebrow="Game library"
            title={
              <>
                Load up your <span className="text-gradient">favourite.</span>
              </>
            }
            action={
              <Link href="/games" className="btn btn-secondary">
                Full library
              </Link>
            }
          >
            The main PS5 games on the floor: the latest EA Sports FC and WWE 2K, GTA V, Spider-Man 2,
            Star Wars: Galactic Racer, and Ghost of Yōtei. Ask if you want a title that is not on this list.
          </SectionIntro>
        ) : null}

        <div className={`${heading ? "mt-10" : ""} flex flex-wrap gap-2`} role="group" aria-label="Filter by genre">
          {gameGenres.map((item) => (
            <button key={item} type="button" aria-pressed={genre === item} onClick={() => setGenre(item)} className="chip chip-button px-4 py-2 text-xs">
              {item}
            </button>
          ))}
        </div>

        <div className="panel relative mt-6 min-h-[34rem] overflow-hidden sm:min-h-[38rem]">
          <AnimatePresence mode="sync" initial={false}>
            <motion.div
              key={active.title}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Image src={active.image} alt={active.alt} fill sizes="(min-width: 1280px) 1240px, 100vw" className="object-cover" />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/80 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-8">
            <span className="inline-flex rounded-sm px-2 py-0.5 text-xs font-bold tracking-[0.12em] uppercase" style={{ background: active.accent, color: "#05030c" }}>
              {active.genre}
            </span>
            <h3 className="mt-3 max-w-2xl text-4xl text-paper uppercase sm:text-6xl">{active.title}</h3>
            <p className="mt-2 flex items-center gap-2 text-sm text-paper">
              <Gamepad2 size={16} aria-hidden="true" style={{ color: active.accent }} />
              {active.modes}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <BookButton className="btn-sm">Book to play</BookButton>
              <WhatsAppButton message={messages.games} className="btn-sm">
                Ask for the full list
              </WhatsAppButton>
            </div>

            <ul className="game-row mt-6 flex snap-x gap-2 overflow-x-auto p-1 sm:gap-3">
              {list.map((game) => {
                const selected = game.title === active.title;
                return (
                  <li key={game.title} className="shrink-0 snap-start">
                    <button
                      type="button"
                      data-game
                      aria-pressed={selected}
                      aria-label={game.title}
                      onClick={() => setActiveTitle(game.title)}
                      onMouseEnter={() => setActiveTitle(game.title)}
                      className={`game-thumb bevel relative block h-24 w-24 overflow-hidden border-2 sm:h-28 sm:w-28 ${selected ? "is-active" : ""}`}
                      style={{ borderColor: selected ? game.accent : "rgba(255,255,255,0.18)" }}
                    >
                      <Image src={game.image} alt="" fill sizes="112px" className="object-cover" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
