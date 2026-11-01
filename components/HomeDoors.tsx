import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const doors = [
  { href: "/stations", kicker: "Stations 01 to 05", title: "The main floor", body: "Four PS5 stations and the car simulator, with live availability.", image: "/images/hero-lounge.jpg", className: "lg:col-span-2 lg:row-span-2", large: true },
  { href: "/private-room", kicker: "Station 06", title: "Private room", body: "Your own room, screen, and PS5.", image: "/images/private-room.jpg", className: "lg:col-span-2" },
  { href: "/games", kicker: "Library", title: "Games", body: "See what is ready to play.", image: "/images/controller-glow.jpg", className: "" },
  { href: "/pricing", kicker: "Rates", title: "Pricing", body: "Work out your session cost.", image: "/images/crew-session.jpg", className: "" },
];

export function HomeDoors() {
  return (
    <section className="py-16 sm:py-20">
      <div className="shell">
        <p className="eyebrow">Explore Nexus</p>
        <h2 className="mt-5 max-w-3xl text-[2.2rem] text-balance text-paper uppercase sm:text-5xl">
          Find your way <span className="text-gradient">to play.</span>
        </h2>
        <div className="mt-10 grid gap-4 lg:auto-rows-[17rem] lg:grid-cols-4">
          {doors.map((door) => (
            <Link key={door.href} href={door.href} className={`door group bevel relative block min-h-[17rem] overflow-hidden border border-white/10 ${door.className}`}>
              <Image
                src={door.image}
                alt=""
                fill
                sizes={door.large ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 100vw"}
                className="object-cover transition duration-700 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-transparent" />
              <span className="absolute top-4 right-4 grid size-10 place-items-center rounded-full border border-white/25 bg-ink/50 text-paper transition-colors group-hover:border-magenta group-hover:bg-magenta">
                <ArrowUpRight size={18} aria-hidden="true" />
              </span>
              <span className="absolute inset-x-0 bottom-0 block p-5 sm:p-6">
                <span className="block text-xs font-semibold tracking-[0.18em] text-cyan uppercase">{door.kicker}</span>
                <span className={`mt-1.5 block font-display text-paper uppercase ${door.large ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl"}`}>{door.title}</span>
                <span className="mt-1.5 block text-sm text-paper/80">{door.body}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
