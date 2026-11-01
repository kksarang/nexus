import { SectionIntro } from "@/components/SectionIntro";

const points = [
  { title: "Six PS5 consoles", body: "Stations 01 to 04 on the main floor, a car simulator at station 05, and the private room at station 06." },
  { title: "A room of your own", body: "Station 06 is a dedicated private gaming room with its own PS5. The session is just for your crew." },
  { title: "Play with your people", body: "Bring friends, a couple, or a small group. Book the station, then we confirm the slot on WhatsApp." },
];

export function WhyNexus() {
  return (
    <section className="py-20 sm:py-28">
      <div className="shell grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <SectionIntro
          eyebrow="Why Nexus Playzone"
          title={
            <>
              The setup, the room, <span className="text-gradient">the session.</span>
            </>
          }
        >
          Nexus Playzone is the PS5 game station in Panoor, Kannur. Players from Thalassery come for football, wrestling, open-world, and racing on the latest games, on the main floor or in the private room.
        </SectionIntro>
        <ol className="border-l border-magenta/40">
          {points.map((point, index) => (
            <li key={point.title} className="reveal relative py-5 pl-8">
              <span className="absolute top-7 -left-[5px] size-2.5 rotate-45 bg-magenta shadow-[0_0_14px_#ee4bff]" aria-hidden="true" />
              <p className="font-tech text-sm text-cyan">{`0${index + 1}`}</p>
              <h3 className="mt-1 text-2xl text-paper uppercase sm:text-3xl">{point.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mist sm:text-base">{point.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
