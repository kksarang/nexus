import { MapPin } from "lucide-react";
import Link from "next/link";
import { site } from "@/lib/site";

const steps = [
  { title: "Pick your slot", body: "Choose the date, time, players, and station." },
  { title: "Send on WhatsApp", body: "Your details arrive filled in, ready to send." },
  { title: "We confirm", body: "We reply to lock it in. Then you play." },
];

export function HomeSteps() {
  return (
    <section className="border-t border-white/10 py-20 sm:py-24">
      <div className="shell">
        <p className="eyebrow">How booking works</p>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="border-t-2 border-magenta pt-5">
              <p className="font-tech text-sm text-cyan">{`0${index + 1}`}</p>
              <h3 className="mt-2 text-2xl text-paper uppercase">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mist">{step.body}</p>
            </li>
          ))}
        </ol>
        <Link href="/contact" className="mt-12 inline-flex items-center gap-2 text-sm text-paper hover:text-cyan">
          <MapPin size={16} className="text-magenta" aria-hidden="true" />
          {site.location}. Get directions →
        </Link>
      </div>
    </section>
  );
}
