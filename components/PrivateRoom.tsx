import { Heart, PartyPopper, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BookButton } from "@/components/BookSlot";
import { WhatsAppButton } from "@/components/ContactButtons";
import { messages } from "@/lib/site";

const moments = [
  { icon: Users, title: "Friends", body: "Squad night with your own screen, your own PS5, and nobody waiting for the next match." },
  { icon: Heart, title: "Couples", body: "A quieter game night for two, away from the main floor." },
  { icon: PartyPopper, title: "Groups", body: "Birthdays, team outings, and celebrations with the room to yourselves." },
];

export function PrivateRoom({ standalone = false }: { standalone?: boolean }) {
  const title = (
    <>
      Go private. <span className="text-gradient">Play different.</span>
    </>
  );
  return (
    <section id="private-room" className="relative isolate overflow-hidden">
      <div className="relative flex min-h-[46rem] items-end sm:min-h-[52rem]">
        <Image
          src="/images/private-room.jpg"
          alt="Private gaming room with a PlayStation 5, a large screen, and two chairs"
          fill
          sizes="100vw"
          className="-z-10 object-cover object-[35%_center]"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/90 via-ink/50 to-transparent" />
        <div className="shell pt-28 pb-12">
          <p className="eyebrow">Station 06 · Private gaming room</p>
          {standalone ? (
            <h1 className="mt-5 max-w-3xl text-[2.6rem] text-paper uppercase sm:text-7xl">{title}</h1>
          ) : (
            <h2 className="mt-5 max-w-3xl text-[2.6rem] text-paper uppercase sm:text-7xl">{title}</h2>
          )}
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-paper/90 sm:text-lg">
            Enjoy a more personal gaming session in our dedicated private gaming room. Bring your close crew, enjoy your games, and make every match memorable. The room has its own PS5, so the session is just for your crew.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <BookButton station="06" className="w-full sm:w-auto">
              Book the private room
            </BookButton>
            <Link href="/stations#live" className="btn btn-secondary w-full sm:w-auto">
              Is it free now?
            </Link>
            <WhatsAppButton message={messages.room} className="w-full sm:w-auto">
              Ask about availability
            </WhatsAppButton>
          </div>
          <ul className="mt-10 grid gap-3 md:grid-cols-3">
            {moments.map((moment) => {
              const Icon = moment.icon;
              return (
                <li key={moment.title} className="tile flex gap-4 p-4 backdrop-blur">
                  <span className="icon-well">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-xl text-paper uppercase">{moment.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-mist">{moment.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
