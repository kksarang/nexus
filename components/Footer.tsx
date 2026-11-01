import Link from "next/link";
import type { ReactNode } from "react";
import { PlayStoreButton } from "@/components/AppPromo";
import { BrandLogo } from "@/components/BrandLogo";
import { footerExplore, footerNexus, hours, messages, site, whatsappLink } from "@/lib/site";

function Column({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="font-display text-xs tracking-[0.2em] text-cyan uppercase">{title}</p>
      <ul className="mt-5 space-y-3 text-sm text-mist">{children}</ul>
    </div>
  );
}

function PageLinks({ links }: { links: readonly { href: string; label: string }[] }) {
  return links.map((item) => (
    <li key={item.href}>
      <Link href={item.href} className="hover:text-paper">
        {item.label}
      </Link>
    </li>
  ));
}

export function Footer() {
  return (
    <footer className="bg-navy/60">
      <div className="flare" />
      <div className="shell grid grid-cols-2 gap-x-6 gap-y-10 py-14 lg:grid-cols-[1.5fr_1fr_1fr_1.4fr] lg:gap-x-12">
        <div className="col-span-2 lg:col-span-1">
          <BrandLogo className="h-11 w-auto" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-mist">
            A PS5 gaming lounge in Panoor, Kannur, with six stations including a dedicated private gaming room.
          </p>
          <p className="mt-4 text-[0.7rem] font-semibold tracking-[0.24em] text-paper uppercase">{site.tagline}</p>
          <PlayStoreButton className="mt-5" />
        </div>
        <Column title="Explore">
          <PageLinks links={footerExplore} />
        </Column>
        <Column title="Nexus">
          <PageLinks links={footerNexus} />
        </Column>
        <Column title="Contact" className="col-span-2 lg:col-span-1">
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
            <a href={whatsappLink(messages.book)} className="hover:text-paper" target="_blank" rel="noopener noreferrer">
              WhatsApp booking
            </a>
          </li>
          <li>{hours.length ? hours.map((row) => `${row.days}: ${row.time}`).join(", ") : "Hours: call or WhatsApp to check"}</li>
        </Column>
      </div>
      <div className="border-t border-white/10">
        <div className="shell flex flex-col gap-1.5 py-5 pr-14 text-xs text-mist sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Nexus Playzone. All rights reserved.</p>
          <p>Developed by Enitexa</p>
        </div>
      </div>
    </footer>
  );
}
