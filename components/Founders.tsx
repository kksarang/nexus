import Image from "next/image";
import { founders } from "@/lib/site";

export function Founders() {
  return (
    <section id="founders" className="border-y border-white/10 bg-navy/40 py-20 sm:py-24">
      <div className="shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="reveal">
          <p className="eyebrow">The founders</p>
          <h2 className="mt-5 text-[2.6rem] leading-[0.9] tracking-wide text-paper uppercase sm:text-6xl">
            Three friends. <span className="text-gradient">One big idea.</span>
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-mist sm:text-lg">
            Nexus Playzone began with three friends — Vishnu, Sarang, and Adarsh — sharing one
            ambition: to create a next-generation gaming destination in Panoor where people can
            connect, compete, and enjoy an exceptional gaming experience.
          </p>
        </div>
        <ul className="reveal grid gap-4 sm:grid-cols-3">
          {founders.map((founder) => (
            <li key={founder.name} className="panel overflow-hidden p-0">
              <div className="relative aspect-[3/4]">
                <Image
                  src={founder.image}
                  alt={`${founder.name}, ${founder.role} of Nexus Playzone`}
                  fill
                  sizes="(min-width: 1024px) 18vw, 80vw"
                  className="object-cover object-top"
                />
              </div>
              <div className="p-4">
                <h3 className="text-2xl tracking-wide text-paper uppercase">{founder.name}</h3>
                <p className="mt-1 text-xs tracking-[0.18em] text-mist uppercase">{founder.role}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
