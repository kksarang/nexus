import type { Metadata } from "next";
import Link from "next/link";
import { LoyaltySim } from "@/components/LoyaltySim";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Player card",
  description: "How Nexus Playzone loyalty points work. Cards are shown at the counter.",
};

export default function PlayerPage() {
  return (
    <main id="content">
      <PageHero
        eyebrow="Rewards"
        title={
          <>
            Your <span className="text-gradient">player card.</span>
          </>
        }
        image="/images/controller-glow.jpg"
      >
        One paid hour earns 1 point. Ten points from Monday to Sunday unlocks 30 minutes of free play. Ask the counter to look up your mobile number and show the card.
      </PageHero>
      <section className="py-16 sm:py-24">
        <div className="shell">
          <LoyaltySim />
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {[
              ["1 point", "Every 60 paid minutes. Shorter sessions add up."],
              ["10 points", "In one Monday–Sunday week, India time."],
              ["30 minutes", "One free session, marked used at the counter."],
            ].map(([title, body]) => (
              <article key={title} className="panel p-5">
                <h2 className="font-tech text-2xl text-paper">{title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-mist">{body}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 max-w-2xl text-sm leading-relaxed text-mist">
            Typing a mobile number on this page does not open anyone&apos;s points or history. The card stays on the
            shop desk.{" "}
            <Link href="/book" className="text-cyan">
              Book a session
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
