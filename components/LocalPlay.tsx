import { MapPin } from "lucide-react";
import Link from "next/link";
import { servedAreas } from "@/lib/site";

const searches = ["PS5 gaming in Panoor", "Gaming cafe in Panoor", "Game zone near Thalassery", "PS5 cafe in Koothuparamba", "Gaming lounge in Kannur", "Private gaming room in Panoor"];

export function LocalPlay() {
  return (
    <section className="py-16 sm:py-20">
      <div className="shell grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <div>
          <p className="eyebrow">Gaming in Panoor</p>
          <h2 className="mt-5 text-[2.2rem] text-balance text-paper uppercase sm:text-5xl">
            Looking for the best place <span className="text-gradient">to play in Panoor?</span>
          </h2>
          <div className="mt-5 grid gap-4 text-base leading-relaxed text-mist">
            <p>
              Nexus Playzone is a PS5 gaming cafe and game world in Panoor, Kannur, made for players from Panoor,
              Thalassery, Koothuparamba, and nearby towns. Come in for football, wrestling, racing, fighting, and
              story games, or take over the private gaming room with your crew.
            </p>
            <p>
              Whether you call it a game zone, a gaming lounge, or a PS5 station, this is where your next session starts.
            </p>
          </div>
          <Link href="/contact" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan hover:text-paper">
            <MapPin size={16} aria-hidden="true" /> Find us in Panoor →
          </Link>
        </div>
        <div>
          <p className="field-label">Players come from</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {servedAreas.map((area) => (
              <li key={area} className="chip px-4 py-2 text-sm">{area}</li>
            ))}
          </ul>
          <p className="field-label mt-7">Good for</p>
          <ul className="mt-3 grid gap-2.5 text-sm text-paper sm:grid-cols-2">
            {searches.map((search) => (
              <li key={search} className="border-l-2 border-magenta pl-3">{search}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
