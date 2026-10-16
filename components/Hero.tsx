import Image from "next/image";
import Link from "next/link";
import { BookButton } from "@/components/BookSlot";
import { CallButton, WhatsAppButton } from "@/components/ContactButtons";
import { games, highlights } from "@/lib/site";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-28 pb-12 sm:pt-36 lg:pb-20">
      <Image
        src="/images/hero-lounge.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover opacity-30 blur-[2px]"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/70 via-ink/85 to-ink" />

      <div className="shell grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="min-w-0">
          <p className="eyebrow">Premium PS5 lounge · Panoor</p>
          <h1 className="mt-6 text-[clamp(2.6rem,11vw,6.4rem)] break-words leading-[0.86] tracking-wide text-paper uppercase">
            Your next-level gaming experience{" "}
            <span className="text-gradient">starts here.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-mist sm:text-lg">
            Six new PS5 stations and a dedicated private gaming room in Panoor, Kannur. Bring your
            crew, pick your station, and play on a setup made for the session you came for.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <BookButton className="w-full sm:w-auto">Book your session</BookButton>
            <WhatsAppButton className="w-full sm:w-auto" />
            <CallButton className="w-full sm:w-auto" />
          </div>
          <div className="mt-8">
            <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-mist uppercase">
              On the consoles
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {games.map((game) => (
                <li key={game.title} className="chip">
                  {game.title}
                </li>
              ))}
              <li>
                <Link href="/games" className="chip border-cyan/40 text-cyan hover:bg-cyan/10">
                  Full library →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <div className="absolute -inset-8 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(22,220,255,0.22),transparent_45%),radial-gradient(circle_at_80%_85%,rgba(139,92,255,0.25),transparent_45%)]" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] border border-white/10 shadow-2xl sm:aspect-[5/5]">
            <Image
              src="/images/hero-lounge.jpg"
              alt="The Nexus Playzone lounge with a PS5 and a wide screen"
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover object-[65%_center]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
            <div className="absolute top-4 left-4 chip">
              <span className="size-1.5 rounded-full bg-cyan shadow-[0_0_8px_#16dcff]" />
              Stations 01–05 · Main floor
            </div>
          </div>
          <Link
            href="/private-room"
            className="panel panel-hover absolute -bottom-6 -left-2 flex w-60 items-center gap-3 p-3 sm:-left-8 sm:w-72"
          >
            <span className="relative size-16 shrink-0 overflow-hidden rounded-xl">
              <Image src="/images/private-room.jpg" alt="" fill sizes="64px" className="object-cover" />
            </span>
            <span className="min-w-0">
              <span className="block text-[0.62rem] font-semibold tracking-[0.18em] text-magenta uppercase">
                Station 06
              </span>
              <span className="mt-1 block font-display text-xl tracking-wide text-paper uppercase">
                Private room
              </span>
              <span className="block text-xs text-mist">For your close crew →</span>
            </span>
          </Link>
        </div>
      </div>

      <div className="shell mt-16 lg:mt-20">
        <ul className="panel grid grid-cols-2 divide-white/10 sm:grid-cols-4 sm:divide-x">
          {highlights.map((item) => (
            <li key={item.label} className="px-5 py-5 sm:px-7">
              <p className="font-tech text-2xl text-paper sm:text-3xl">{item.value}</p>
              <p className="mt-1 text-xs text-mist">{item.label}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
