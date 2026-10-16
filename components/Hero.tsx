import Image from "next/image";
import Link from "next/link";
import { BookButton } from "@/components/BookSlot";
import { site } from "@/lib/site";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-24 pb-10 sm:pt-28 lg:pb-16">
      <div className="shell grid items-end gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
        <div className="min-w-0 pb-2">
          <p className="text-[0.72rem] font-semibold tracking-[0.22em] text-cyan uppercase">
            {site.location}
          </p>
          <h1 className="mt-4 max-w-xl text-[clamp(3.2rem,8vw,6.2rem)] leading-[0.88] tracking-wide text-paper uppercase">
            Level up your game.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-mist sm:text-lg">
            Your squad. Your favourite games. An unforgettable gaming experience at Nexus Playzone, Panoor.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <BookButton className="w-full sm:w-auto">Book Your Session</BookButton>
            <Link href="#zones" className="btn btn-secondary w-full sm:w-auto">
              Explore the Gaming Zones
            </Link>
          </div>
          <p className="mt-6 text-sm text-paper">
            Six PS5 setups, including one private room. Stations 01–04 ₹160/hour · Car simulator ₹180 · Private room ₹200.
          </p>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden border border-white/10 sm:aspect-[16/10]">
            <Image
              src="/images/hero-lounge.jpg"
              alt="A PlayStation 5 and a wide screen in a dark lounge"
              fill
              priority
              sizes="(min-width: 1024px) 52vw, 100vw"
              className="object-cover object-[70%_center]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/20" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Link href="/stations" className="border border-white/10 bg-navy px-4 py-3 hover:border-cyan/40">
              <p className="font-tech text-2xl text-paper">01–05</p>
              <p className="mt-1 text-xs text-mist">Main floor consoles</p>
            </Link>
            <Link href="/private-room" className="border border-white/10 bg-navy px-4 py-3 hover:border-cyan/40">
              <p className="font-tech text-2xl text-paper">06</p>
              <p className="mt-1 text-xs text-mist">Private gaming room</p>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
