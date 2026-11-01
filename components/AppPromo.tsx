"use client";

import { CalendarCheck, Gamepad2, Smartphone } from "lucide-react";
import Image from "next/image";
import { BookButton } from "@/components/BookSlot";
import { playStoreUrl, site } from "@/lib/site";

function PlayMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-8 shrink-0" aria-hidden="true">
      <path fill="#00C3FF" d="M3 2v20l10-10L3 2Z" />
      <path fill="#00E676" d="M3 2l10 10 3.5-3.5L3 2Z" />
      <path fill="#FF3D47" d="M3 22l10-10 3.5 3.5L3 22Z" />
      <path fill="#FFC400" d="M16.5 8.5 13 12l3.5 3.5L21 12l-4.5-3.5Z" />
    </svg>
  );
}

function BadgeText({ top }: { top: string }) {
  return (
    <span className="text-left leading-tight">
      <span className="block text-[0.65rem] tracking-[0.1em] text-paper/75 uppercase">{top}</span>
      <span className="block text-xl font-semibold text-paper">Google Play</span>
    </span>
  );
}

export function PlayStoreButton({ className = "" }: { className?: string }) {
  if (!playStoreUrl) return null;
  return (
    <a href={playStoreUrl} target="_blank" rel="noopener noreferrer" className={`play-badge ${className}`.trim()}>
      <PlayMark />
      <BadgeText top="Get it on" />
    </a>
  );
}

const features = [
  { icon: Smartphone, title: "Book from your phone", body: "Your session, a few taps away." },
  { icon: Gamepad2, title: "Pick your station", body: "PS5, car simulator, or private room." },
  { icon: CalendarCheck, title: "Choose your time", body: "Set the date and start time you want." },
];

function Phone({ src, alt, className }: { src: string; alt: string; className: string }) {
  return (
    <div className={`phone ${className}`}>
      <div className="phone-screen">
        <Image src={src} alt={alt} fill sizes="208px" className="object-cover object-top" />
      </div>
    </div>
  );
}

export function AppPromo() {
  return (
    <section id="app" className="band py-16 sm:py-20">
      <div className="shell">
        <div className="app-stage bevel relative grid items-center gap-10 overflow-hidden border border-magenta/40 p-6 sm:p-10 lg:grid-cols-[1.15fr_0.85fr] lg:p-14">
          <Image src="/brand/nebula.jpg" alt="" fill sizes="(min-width: 1280px) 1240px, 100vw" className="-z-10 object-cover opacity-60" />
          <div>
            <p className="eyebrow">Nexus Playzone mobile app</p>
            <h2 className="mt-5 text-[2.4rem] text-balance text-paper uppercase sm:text-6xl">
              Your next session. <span className="text-gradient">In your pocket.</span>
            </h2>

            <div className="app-listing mt-8">
              <Image src="/apple-icon.png" alt="" width={72} height={72} unoptimized className="size-16 shrink-0 rounded-2xl border border-white/15 sm:size-[4.5rem]" />
              <div className="min-w-0">
                <p className="font-display text-xl text-paper">{site.name}</p>
                <p className="mt-0.5 text-sm text-mist">Android app · Panoor, Kannur</p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              {playStoreUrl ? (
                <PlayStoreButton />
              ) : (
                <>
                  <p data-app-soon className="play-badge is-soon">
                    <PlayMark />
                    <BadgeText top="Coming soon to" />
                  </p>
                  <BookButton variant="secondary">Book on the website</BookButton>
                </>
              )}
            </div>

            <ul className="mt-8 grid gap-3 sm:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <li key={feature.title} className="border-t border-white/20 pt-3">
                    <Icon size={18} className="text-magenta" aria-hidden="true" />
                    <p className="mt-2 font-display text-paper">{feature.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-mist">{feature.body}</p>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="phone-pair">
            <Phone src="/brand/app-screens/games.jpg" alt="Choosing a game on a phone" className="phone-back" />
            <Phone src="/brand/app-screens/book.jpg" alt="The booking form on a phone" className="phone-front" />
          </div>
        </div>
      </div>
    </section>
  );
}
