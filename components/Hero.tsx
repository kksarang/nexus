import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { BookButton } from "@/components/BookSlot";
import { StationSelect } from "@/components/LiveStatus";
import { HeroRates } from "@/components/PriceCopy";
import { site } from "@/lib/site";

export function Hero() {
  return (
    <section className="title-screen relative isolate flex min-h-svh flex-col overflow-hidden pt-24 pb-8">
      <Image src="/brand/nebula.jpg" alt="" fill preload sizes="100vw" className="-z-20 object-cover" />
      <div className="absolute inset-0 -z-10 bg-ink/35" />
      <div className="grid-floor" aria-hidden="true" />
      <div className="shell flex flex-1 flex-col items-center justify-center py-6 text-center">
        <Image
          src="/brand/nexus-wordmark.png"
          alt="Nexus Playzone"
          width={1052}
          height={252}
          preload
          sizes="(min-width: 768px) 680px, 88vw"
          className="boot-logo w-[min(88vw,680px)] drop-shadow-[0_0_34px_rgba(224,3,252,0.45)]"
        />
        <div className="flare flare-live mt-5 w-[min(92vw,820px)]" />
        <p className="boot mt-5 text-xs font-semibold tracking-[0.22em] text-paper uppercase" style={{ "--boot": 1 } as CSSProperties}>{site.location}</p>
        <h1 className="boot mt-3 text-[clamp(2.1rem,5vw,3.75rem)] text-paper uppercase" style={{ "--boot": 2 } as CSSProperties}>Level up your game.</h1>
        <p className="boot mt-3 max-w-xl text-base leading-relaxed text-paper/85" style={{ "--boot": 3 } as CSSProperties}>
          A PS5 gaming station in Panoor for Thalassery and Kannur. Six consoles, a private room, and a real game experience with your people.
        </p>
        <div className="boot mt-6 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row" style={{ "--boot": 4 } as CSSProperties}>
          <BookButton className="press-start w-full sm:w-auto">Press start · Book now</BookButton>
          <Link href="#zones" className="btn btn-secondary w-full sm:w-auto">
            Explore the Gaming Zones
          </Link>
        </div>
        <div className="mt-5">
          <HeroRates />
        </div>
      </div>
      <div className="shell">
        <StationSelect />
      </div>
    </section>
  );
}
