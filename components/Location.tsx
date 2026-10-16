import { Clock, Mail, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import { SectionIntro } from "@/components/SectionIntro";
import { hours, messages, site, whatsappLink } from "@/lib/site";

export function Location({ heading = true }: { heading?: boolean }) {
  return (
    <section id="visit" className="py-20 sm:py-28">
      <div className="shell">
        {heading ? (
          <SectionIntro
            eyebrow="Visit us"
            title={
              <>
                Find us in <span className="text-gradient">Panoor.</span>
              </>
            }
          >
            Drop in, say hi, and grab a controller. Message ahead to make sure your station is free.
          </SectionIntro>
        ) : null}

        <div className={`${heading ? "mt-12" : ""} grid gap-5 lg:grid-cols-[1.25fr_0.75fr]`}>
          <div className="panel relative min-h-[22rem] overflow-hidden p-0 sm:min-h-[28rem]">
            <iframe
              title="Nexus Playzone on Google Maps"
              src={site.mapEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 h-full w-full border-0 opacity-90 [filter:invert(0.92)_hue-rotate(180deg)_saturate(0.7)]"
            />
            <a
              href={site.directions}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary absolute bottom-4 left-4"
            >
              <Navigation size={16} aria-hidden="true" />
              Get directions
            </a>
          </div>

          <div className="grid gap-4">
            <div className="panel p-6">
              <div className="flex items-center gap-3">
                <span className="icon-well">
                  <MapPin size={18} aria-hidden="true" />
                </span>
                <div>
                  <p className="field-label">Address</p>
                  <p className="mt-1 text-paper">Nexus Playzone, {site.location}</p>
                </div>
              </div>
              <a
                href={site.maps}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-sm text-cyan hover:text-paper"
              >
                Open in Google Maps →
              </a>
            </div>

            <div className="panel p-6">
              <p className="field-label">Talk to us</p>
              <ul className="mt-4 grid gap-3 text-sm">
                <li>
                  <a href={`tel:${site.phoneTel}`} className="flex items-center gap-3 text-paper hover:text-cyan">
                    <Phone size={16} className="text-cyan" aria-hidden="true" />
                    {site.phoneDisplay}
                  </a>
                </li>
                <li>
                  <a
                    href={whatsappLink(messages.book)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-paper hover:text-cyan"
                  >
                    <MessageCircle size={16} className="text-cyan" aria-hidden="true" />
                    Chat on WhatsApp
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${site.email}`}
                    className="flex items-center gap-3 break-all text-paper hover:text-cyan"
                  >
                    <Mail size={16} className="shrink-0 text-cyan" aria-hidden="true" />
                    {site.email}
                  </a>
                </li>
              </ul>
            </div>

            <div className="panel p-6">
              <p className="field-label flex items-center gap-2">
                <Clock size={14} className="text-cyan" aria-hidden="true" />
                Opening hours
              </p>
              {hours.length ? (
                <ul className="mt-4 space-y-2 text-sm">
                  {hours.map((row) => (
                    <li key={row.days} className="flex justify-between gap-4">
                      <span className="text-mist">{row.days}</span>
                      <span className="text-paper">{row.time}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-mist">
                  Call or WhatsApp to check today’s hours before you head over.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
