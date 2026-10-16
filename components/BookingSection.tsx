import { CalendarCheck, MessageCircle, Phone } from "lucide-react";
import { BookingForm } from "@/components/BookingForm";
import { SectionIntro } from "@/components/SectionIntro";
import { site } from "@/lib/site";

const steps = [
  { icon: CalendarCheck, title: "Pick your slot", body: "Date, time, hours, players, and station." },
  { icon: MessageCircle, title: "Send on WhatsApp", body: "Your details arrive filled in, ready to send." },
  { icon: Phone, title: "We confirm", body: `We reply to lock it in. Or call ${site.phoneDisplay}.` },
];

export function BookingSection({ heading = true }: { heading?: boolean }) {
  return (
    <section id="book" className="relative isolate py-20 sm:py-28">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(22,220,255,0.1),transparent_70%)]" />
      <div className="shell grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <div>
          {heading ? (
            <SectionIntro
              eyebrow="Book your session"
              title={
                <>
                  Reserve your <span className="text-gradient">station.</span>
                </>
              }
            >
              Choose the date, time, number of players, and the station you want. We confirm every
              booking on WhatsApp.
            </SectionIntro>
          ) : null}
          <ol className={`${heading ? "mt-10" : ""} grid gap-3`}>
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="flex gap-4 rounded-2xl border border-white/10 p-4">
                  <span className="icon-well">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-tech text-[0.6rem] tracking-[0.2em] text-cyan">{`STEP 0${index + 1}`}</p>
                    <p className="mt-1 font-display text-xl tracking-wide text-paper uppercase">{step.title}</p>
                    <p className="text-sm text-mist">{step.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        <BookingForm />
      </div>
    </section>
  );
}
