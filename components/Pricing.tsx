import { BadgePercent, CalendarClock, Clock, Crown } from "lucide-react";
import Link from "next/link";
import { BookButton } from "@/components/BookSlot";
import { WhatsAppButton } from "@/components/ContactButtons";
import { SectionIntro } from "@/components/SectionIntro";
import { formatRupees } from "@/lib/format";
import { messages, offers, rates } from "@/lib/site";

const icons = { station: Clock, private: Crown, monthly: CalendarClock } as const;

export function Pricing({ heading = true }: { heading?: boolean }) {
  return (
    <section id="pricing" className="py-20 sm:py-28">
      <div className="shell">
        {heading ? (
          <SectionIntro
            eyebrow="Pricing"
            title={
              <>
                Simple hourly <span className="text-gradient">rates.</span>
              </>
            }
            action={
              <Link href="/pricing" className="btn btn-secondary">
                Rates and membership
              </Link>
            }
          >
            ₹160 an hour on the floor, ₹200 an hour in the private room, or ₹2,000 for 20 sessions.
          </SectionIntro>
        ) : null}

        <div className={`${heading ? "mt-12" : ""} grid gap-5 md:grid-cols-3`}>
          {rates.map((rate) => {
            const Icon = icons[rate.key as keyof typeof icons] ?? Clock;
            return (
              <article
                key={rate.key}
                className={`reveal panel panel-hover flex flex-col p-7 ${rate.featured ? "panel-featured" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="icon-well">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  {rate.featured ? <span className="chip border-cyan/50 text-cyan">Premium</span> : null}
                </div>
                <h3 className="mt-6 text-2xl tracking-wide text-paper uppercase">{rate.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mist">{rate.detail}</p>
                <div className="mt-6 flex-1 border-t border-white/10 pt-5">
                  <p className="text-[0.62rem] font-semibold tracking-[0.18em] text-cyan uppercase">
                    {rate.unit}
                  </p>
                  {rate.rupees != null ? (
                    <p className="mt-2 font-tech text-5xl leading-none text-paper sm:text-6xl">
                      {formatRupees(rate.rupees)}
                    </p>
                  ) : (
                    <p className="mt-2 font-tech text-5xl leading-none text-white/25 sm:text-6xl">₹ —</p>
                  )}
                  {rate.rupees != null ? (
                    <p className="mt-3 text-sm text-mist">This is the rate for the booking.</p>
                  ) : null}
                </div>
                {rate.key === "monthly" ? (
                  <Link href="/book?plan=monthly" className="btn btn-secondary mt-6 w-full">
                    Join monthly
                  </Link>
                ) : (
                  <BookButton
                    station={rate.key === "private" ? "06" : undefined}
                    variant={rate.featured ? "primary" : "secondary"}
                    className="mt-6 w-full"
                  >
                    Book now
                  </BookButton>
                )}
              </article>
            );
          })}
        </div>

        <div className="reveal panel mt-6 flex flex-col gap-6 p-7 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-4">
            <span className="icon-well border-magenta/30 bg-magenta/10 text-magenta">
              <BadgePercent size={18} aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-2xl tracking-wide text-paper uppercase">Special offers</h3>
              {offers.length ? (
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  {offers.map((offer) => (
                    <li key={offer.title}>
                      <p className="font-semibold text-paper">{offer.title}</p>
                      <p className="text-sm text-mist">{offer.body}</p>
                      {offer.code ? <p className="mt-1 font-tech text-xs text-cyan">{offer.code}</p> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-mist">
                  Group deals and limited-time offers change through the month. Message us for what is
                  running right now.
                </p>
              )}
            </div>
          </div>
          <WhatsAppButton message={messages.pricing} className="shrink-0">
            Get current offers
          </WhatsAppButton>
        </div>
      </div>
    </section>
  );
}
