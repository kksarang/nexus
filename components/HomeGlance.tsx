"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useLivePrices } from "@/components/useLivePrices";
import { POINT_MINUTES, REWARD_MINUTES, WEEKLY_TARGET } from "@/lib/loyalty";
import { formatRupees } from "@/lib/format";
import { gameGenres, games, hours, messages, site, whatsappLink } from "@/lib/site";

function Card({ title, href, cta, rows }: { title: string; href: string; cta: string; rows: [ReactNode, ReactNode][] }) {
  return (
    <article className="panel flex flex-col p-5 sm:p-6">
      <h3 className="text-xl text-paper uppercase">{title}</h3>
      <dl className="mt-4 flex-1 divide-y divide-white/10 text-sm">
        {rows.map(([label, value], index) => (
          <div key={index} className="flex items-baseline justify-between gap-4 py-2">
            <dt className="text-mist">{label}</dt>
            <dd className="text-right font-semibold text-paper">{value}</dd>
          </div>
        ))}
      </dl>
      <Link href={href} className="mt-4 text-sm font-semibold text-cyan hover:text-paper">
        {cta} →
      </Link>
    </article>
  );
}

export function HomeGlance() {
  const prices = useLivePrices();
  const genreRows = gameGenres
    .filter((genre) => genre !== "All")
    .map((genre) => [genre, games.filter((game) => game.genre === genre).length] as [ReactNode, ReactNode]);

  return (
    <section className="pb-20 sm:pb-28">
      <div className="shell">
        <p className="eyebrow">At a glance</p>
        <h2 className="mt-5 text-[2.2rem] text-paper uppercase sm:text-5xl">
          Everything <span className="text-gradient">in numbers.</span>
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card
            title="Hourly rates"
            href="/pricing"
            cta="Open pricing"
            rows={[
              ["PS5, stations 01–04", formatRupees(prices.station)],
              ["Car simulator, 05", formatRupees(prices.simulator)],
              ["Private room, 06", formatRupees(prices.privateRoom)],
              ["2 hours on a PS5", formatRupees(prices.station * 2)],
              ["3 hours on a PS5", formatRupees(prices.station * 3)],
            ]}
          />
          <Card title={`${games.length} games`} href="/games" cta="Browse games" rows={genreRows} />
          <Card
            title="Rewards"
            href="/player"
            cta="How rewards work"
            rows={[
              ["1 point", `${POINT_MINUTES} paid minutes`],
              ["Weekly target", `${WEEKLY_TARGET} points`],
              ["Reward", `${REWARD_MINUTES} min free`],
              ["Week runs", "Mon to Sun, IST"],
            ]}
          />
          <Card
            title="Find us"
            href="/contact"
            cta="Map and directions"
            rows={[
              ["Location", "Panoor, Kannur"],
              ["Serving", "Thalassery and nearby"],
              ["Phone", <a key="tel" href={`tel:${site.phoneTel}`} className="hover:text-cyan">{site.phoneDisplay}</a>],
              ["WhatsApp", <a key="wa" href={whatsappLink(messages.book)} target="_blank" rel="noopener noreferrer" className="hover:text-cyan">Chat now</a>],
              ["Hours", hours.length ? hours.map((row) => `${row.days} ${row.time}`).join(", ") : "Call to check"],
            ]}
          />
        </div>
      </div>
    </section>
  );
}
