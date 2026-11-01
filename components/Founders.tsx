import Image from "next/image";
import { SectionIntro } from "@/components/SectionIntro";
import { founders } from "@/lib/site";

export function Founders() {
  return (
    <section id="founders" className="py-20 sm:py-28">
      <div className="shell">
        <SectionIntro
          eyebrow="The founders"
          title={
            <>
              Three friends. <span className="text-gradient">One big idea.</span>
            </>
          }
        >
          Nexus Playzone began with three friends — Vishnu, Sarang, and Adarsh — sharing one ambition: to create a next-generation gaming destination in Panoor where people can connect, compete, and enjoy an exceptional gaming experience.
        </SectionIntro>
        <ul className="mt-12 grid gap-5 sm:grid-cols-3">
          {founders.map((founder, index) => (
            <li key={founder.name} className="player-card panel overflow-hidden p-0">
              <div className="relative aspect-[4/5]">
                <Image
                  src={founder.image}
                  alt={`${founder.name}, ${founder.role} of Nexus Playzone`}
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
                <span className="chip absolute top-3 left-3 font-tech">P{index + 1}</span>
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="text-3xl text-paper uppercase">{founder.name}</h3>
                  <p className="mt-1 text-xs tracking-[0.18em] text-cyan uppercase">{founder.role}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
