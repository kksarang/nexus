import { Heart, PartyPopper, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BookButton } from "@/components/BookSlot";
import { WhatsAppButton } from "@/components/ContactButtons";
import { messages } from "@/lib/site";

const moments = [
  {
    icon: Users,
    title: "Friends",
    body: "Squad night with your own screen, your own PS5, and nobody waiting for the next match.",
  },
  {
    icon: Heart,
    title: "Couples",
    body: "A quieter game night for two, away from the main floor.",
  },
  {
    icon: PartyPopper,
    title: "Groups",
    body: "Birthdays, team outings, and celebrations with the room to yourselves.",
  },
];

export function PrivateRoom({ standalone = false }: { standalone?: boolean }) {
  return (
    <section id="private-room" className="relative isolate overflow-hidden py-20 sm:py-28">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_80%_30%,rgba(236,57,255,0.14),transparent_60%),radial-gradient(50%_50%_at_10%_80%,rgba(57,108,255,0.14),transparent_60%)]" />
      <div className="shell">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div className="reveal relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-magenta/30 shadow-[0_30px_90px_rgba(236,57,255,0.18)]">
              <Image
                src="/images/private-room.jpg"
                alt="Private gaming room with a PlayStation 5, a large screen, and two chairs"
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-7">
                <div>
                  <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-magenta uppercase">
                    Station 06
                  </p>
                  <p className="mt-1 font-display text-3xl tracking-wide text-paper uppercase">
                    The private room
                  </p>
                </div>
                <span className="chip">Book ahead</span>
              </div>
            </div>
          </div>

          <div className="reveal">
            <p className="eyebrow border-magenta/40 bg-magenta/10 text-magenta before:bg-magenta before:shadow-[0_0_10px_#ec39ff]">
              Private gaming room
            </p>
            {standalone ? (
              <h1 className="mt-5 text-[3rem] leading-[0.88] tracking-wide text-paper uppercase sm:text-7xl">
                Go private. <span className="text-gradient">Play different.</span>
              </h1>
            ) : (
              <h2 className="mt-5 text-[2.6rem] leading-[0.9] tracking-wide text-paper uppercase sm:text-6xl">
                Go private. <span className="text-gradient">Play different.</span>
              </h2>
            )}
            <p className="mt-5 text-base leading-relaxed text-mist sm:text-lg">
              Enjoy a more personal gaming session in our dedicated private gaming room. Bring your
              close crew, enjoy your games, and make every match memorable.
            </p>
            <p className="mt-4 text-base leading-relaxed text-paper">
              The room has its own PS5, so the session is just for your crew. Ask on WhatsApp or call
              to check when it is free.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
          </div>
        </div>

        <ul className="mt-14 grid gap-4 md:grid-cols-3">
          {moments.map((moment) => {
            const Icon = moment.icon;
            return (
              <li key={moment.title} className="reveal panel panel-hover p-6">
                <span className="icon-well border-magenta/30 bg-magenta/10 text-magenta">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-2xl tracking-wide text-paper uppercase">{moment.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mist">{moment.body}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
