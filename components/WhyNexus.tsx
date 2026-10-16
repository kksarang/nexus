import { Gamepad2, Lock, Users } from "lucide-react";

const points = [
  {
    icon: Gamepad2,
    title: "Six PS5 consoles",
    body: "Stations 01 to 04 on the main floor, a car simulator at station 05, and the private room at station 06.",
  },
  {
    icon: Lock,
    title: "A room of your own",
    body: "Station 06 is a dedicated private gaming room with its own PS5. The session is just for your crew.",
  },
  {
    icon: Users,
    title: "Play with your people",
    body: "Bring friends, a couple, or a small group. Book the station, then we confirm the slot on WhatsApp.",
  },
];

export function WhyNexus() {
  return (
    <section className="border-y border-white/10 bg-navy/50 py-16 sm:py-20">
      <div className="shell">
        <p className="text-[0.72rem] font-semibold tracking-[0.22em] text-cyan uppercase">Why Nexus Playzone</p>
        <h2 className="mt-3 max-w-2xl text-4xl tracking-wide text-paper uppercase sm:text-5xl">
          The setup, the room, and the session.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-mist sm:text-base">
          Nexus Playzone is the PS5 game station in Panoor, Kannur. Players from Thalassery come for football, wrestling, open-world, and racing on the latest games, on the main floor or in the private room.
        </p>
        <ul className="mt-10 grid gap-8 md:grid-cols-3">
          {points.map((point) => {
            const Icon = point.icon;
            return (
              <li key={point.title}>
                <Icon size={18} className="text-cyan" aria-hidden="true" />
                <h3 className="mt-4 text-2xl tracking-wide text-paper uppercase">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mist">{point.body}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
