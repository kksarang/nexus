import Link from "next/link";
import { Logo } from "@/components/Logo";
import { hours, messages, nav, site, whatsappLink } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-navy/60 py-14">
      <div className="shell grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo className="h-16 w-auto" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-mist">
            A premium PS5 gaming lounge in Panoor, Kannur. Six console stations and one dedicated
            private gaming room.
          </p>
          <p className="mt-4 text-[0.7rem] font-semibold tracking-[0.28em] text-paper uppercase">
            {site.tagline}
          </p>
        </div>
        <div>
          <p className="text-[0.7rem] font-semibold tracking-[0.2em] text-cyan uppercase">Explore</p>
          <ul className="mt-4 space-y-2 text-sm text-mist">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-paper">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/book" className="hover:text-paper">
                Book a session
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-[0.7rem] font-semibold tracking-[0.2em] text-cyan uppercase">Contact</p>
          <ul className="mt-4 space-y-2 text-sm text-mist">
            <li>{site.location}</li>
            <li>
              <a href={`tel:${site.phoneTel}`} className="hover:text-paper">
                {site.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="break-all hover:text-paper">
                {site.email}
              </a>
            </li>
            <li>
              <a
                href={whatsappLink(messages.book)}
                className="hover:text-paper"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp booking
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-[0.7rem] font-semibold tracking-[0.2em] text-cyan uppercase">Hours</p>
          <ul className="mt-4 space-y-2 text-sm text-mist">
            {hours.length ? (
              hours.map((row) => (
                <li key={row.days} className="flex justify-between gap-4">
                  <span>{row.days}</span>
                  <span className="text-paper">{row.time}</span>
                </li>
              ))
            ) : (
              <li>Call or WhatsApp for today’s hours.</li>
            )}
          </ul>
        </div>
      </div>
      <div className="shell mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-mist sm:flex-row sm:justify-between">
        <p>© 2026 Nexus Playzone. All rights reserved.</p>
        <span className="flex gap-4">
          <Link href="/room" className="hover:text-paper">
            Private room desk
          </Link>
          <Link href="/floor" className="hover:text-paper">
            Staff floor control
          </Link>
        </span>
      </div>
    </footer>
  );
}
