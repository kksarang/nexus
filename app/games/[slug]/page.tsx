import { ArrowLeft, BookOpen, Gamepad2, Users } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WhatsAppButton } from "@/components/ContactButtons";
import { GameTileArt } from "@/components/GameTile";
import { RateChips } from "@/components/PriceCopy";
import { gameSlug, games } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

function findGame(slug: string) {
  return games.find((game) => gameSlug(game.title) === slug);
}

export function generateStaticParams() {
  return games.map((game) => ({ slug: gameSlug(game.title) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const game = findGame(slug);
  if (!game) return {};
  return {
    title: `${game.title} on PS5`,
    description: `Play ${game.title} on PS5 at Nexus Playzone in Panoor, near Thalassery and Koothuparamba. ${game.about}`,
    alternates: { canonical: `/games/${slug}` },
  };
}

export default async function GamePage({ params }: Props) {
  const { slug } = await params;
  const game = findGame(slug);
  if (!game) notFound();

  const related = games
    .filter((item) => item.title !== game.title && (item.genre === game.genre || (game.story && item.story)))
    .slice(0, 4);
  const facts = [
    { icon: Gamepad2, label: "Genre", value: game.genre },
    { icon: Users, label: "How you play", value: game.modes },
    { icon: BookOpen, label: "Best for", value: game.bestFor },
  ];

  return (
    <main id="content">
      <section className="relative isolate flex min-h-[34rem] items-end overflow-hidden pt-28 pb-10 sm:min-h-[38rem]">
        <Image src={game.image ?? "/brand/nebula.jpg"} alt={game.alt ?? ""} fill preload sizes="100vw" className="-z-20 object-cover" />
        {game.image ? null : <div className="absolute inset-0 -z-10 opacity-70 mix-blend-color" style={{ background: game.accent }} />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/55 to-ink/20" />
        <div className="shell">
          <Link href="/games" className="inline-flex items-center gap-2 text-sm font-semibold text-paper hover:text-cyan">
            <ArrowLeft size={16} aria-hidden="true" /> All games
          </Link>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-sm px-2 py-0.5 text-xs font-bold tracking-[0.12em] uppercase" style={{ background: game.accent, color: "#05030c" }}>
              {game.genre}
            </span>
            {game.story ? <span className="rounded-sm bg-paper px-2 py-0.5 text-xs font-bold tracking-[0.12em] text-ink uppercase">Story game</span> : null}
          </div>
          <h1 className="mt-4 max-w-4xl text-[2.6rem] text-balance text-paper uppercase sm:text-7xl">{game.title}</h1>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="shell grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:gap-14">
          <div>
            <p className="eyebrow">About the game</p>
            <p className="mt-5 text-lg leading-relaxed text-paper sm:text-xl">{game.about}</p>
            <dl className="mt-8 grid gap-3 sm:grid-cols-3">
              {facts.map((fact) => {
                const Icon = fact.icon;
                return (
                  <div key={fact.label} className="tile p-4">
                    <Icon size={18} className="text-magenta" aria-hidden="true" />
                    <dt className="mt-3 text-xs tracking-[0.14em] text-mist uppercase">{fact.label}</dt>
                    <dd className="mt-1 font-display text-paper">{fact.value}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
          <aside className="panel panel-featured self-start p-6">
            <h2 className="text-2xl text-paper uppercase">Play it at Nexus</h2>
            <p className="mt-2 text-sm leading-relaxed text-mist">Book a session and tell us you want this game ready.</p>
            <div className="mt-5 grid gap-3">
              <Link href={`/book?game=${encodeURIComponent(game.title)}`} className="btn btn-primary w-full">
                Book &amp; keep it ready
              </Link>
              <WhatsAppButton message={`Hi Nexus Playzone, can I play ${game.title} at the lounge?`} className="w-full">
                Ask on WhatsApp
              </WhatsAppButton>
            </div>
            <div className="mt-5">
              <RateChips />
            </div>
          </aside>
        </div>
      </section>

      {related.length ? (
        <section className="pb-16 sm:pb-20">
          <div className="shell">
            <h2 className="text-3xl text-paper uppercase sm:text-4xl">
              You may <span className="text-gradient">also like.</span>
            </h2>
            <ul className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {related.map((item) => (
                <li key={item.title}>
                  <Link href={`/games/${gameSlug(item.title)}`} aria-label={`${item.title} details`} className="game-tile-card bevel relative block aspect-[4/3] overflow-hidden border border-white/15">
                    <GameTileArt game={item} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </main>
  );
}
