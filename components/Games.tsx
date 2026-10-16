"use client";

import { Gamepad2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { WhatsAppButton } from "@/components/ContactButtons";
import { SectionIntro } from "@/components/SectionIntro";
import { gameGenres, games, messages } from "@/lib/site";

export function Games({ heading = true }: { heading?: boolean }) {
  const [genre, setGenre] = useState<(typeof gameGenres)[number]>("All");
  const list = genre === "All" ? games : games.filter((game) => game.genre === genre);

  return (
    <section id="games" className="border-y border-white/10 bg-navy/50 py-20 sm:py-28">
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
            Football, wrestling, open-world, action, and racing, all on new PS5 consoles. New titles
            are added often, so ask if you are looking for a specific game.
          </SectionIntro>
        ) : null}

        <div className={`${heading ? "mt-10" : ""} flex flex-wrap gap-2`} role="group" aria-label="Filter by genre">
          {gameGenres.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={genre === item}
              onClick={() => setGenre(item)}
              className="chip chip-button px-4 py-2 text-xs"
            >
              {item}
            </button>
          ))}
        </div>

        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((game) => (
            <li key={game.title}>
              <article
                className="group relative aspect-[3/4] overflow-hidden rounded-[1.4rem]"
                style={{ boxShadow: `inset 0 0 0 4px ${game.accent}` }}
              >
                <Image
                  src={game.image}
                  alt={game.alt}
                  fill
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.04]"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(180deg, ${game.accent}88 0%, transparent 34%, #050610 78%)`,
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <span
                    className="inline-flex rounded-full px-3 py-1 text-[0.68rem] font-bold tracking-[0.14em] uppercase"
                    style={{ background: game.accent, color: "#050610" }}
                  >
                    {game.genre}
                  </span>
                  <h3 className="mt-3 text-3xl leading-none tracking-wide text-paper uppercase sm:text-4xl">
                    {game.title}
                  </h3>
                  <p className="mt-3 flex items-center gap-2 text-sm text-paper">
                    <Gamepad2 size={15} aria-hidden="true" style={{ color: game.accent }} />
                    {game.modes}
                  </p>
                </div>
              </article>
            </li>
          ))}
          <li>
            <article className="flex aspect-[3/4] flex-col justify-between rounded-[1.4rem] border border-dashed border-cyan/30 bg-ink/40 p-6">
              <span className="chip w-fit border-cyan/40 text-cyan">More titles</span>
              <div>
                <h3 className="text-3xl leading-none tracking-wide text-paper uppercase">And plenty more</h3>
                <p className="mt-3 text-sm leading-relaxed text-mist">
                  Ask for the full, current list before you come in.
                </p>
                <WhatsAppButton message={messages.games} className="mt-5 min-h-10 max-w-full px-4 whitespace-normal">
                  Ask for the list
                </WhatsAppButton>
              </div>
            </article>
          </li>
        </ul>
      </div>
    </section>
  );
}
