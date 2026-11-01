"use client";

import { useLivePrices } from "@/components/useLivePrices";
import { formatRupees } from "@/lib/format";
import { site } from "@/lib/site";

export function Faq() {
  const prices = useLivePrices();
  const items = [
    ["How do I book?", "Pick your date, time, and station on the booking page and send it on WhatsApp. We reply to confirm your slot. You can also call us."],
    ["Can I just walk in?", "Yes, if a station is free. The Stations page shows live availability, and it is worth messaging ahead so your station is ready."],
    ["How much does it cost?", `${formatRupees(prices.station)} an hour on a PS5 station, ${formatRupees(prices.simulator)} on the car simulator, and ${formatRupees(prices.privateRoom)} in the private room.`],
    ["Can I ask for a specific game?", "Yes. Tell us in the booking request and we will have it ready. If it is not on our list, ask us about it."],
    ["How does membership work?", "Plans are monthly, quarterly, or yearly and cover Stations 01 to 04. You pay and join at the counter."],
    ["How do rewards work?", "One point for every 60 paid minutes. Ten points in a Monday to Sunday week unlocks 30 minutes of free play, marked used at the counter."],
    ["Where are you?", `We are in ${site.location}, and players come to us from Thalassery, Koothuparamba, and nearby towns.`],
  ];
  return (
    <section className="pb-20 sm:pb-28">
      <div className="shell grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-14">
        <div>
          <p className="eyebrow">Questions</p>
          <h2 className="mt-5 text-[2.2rem] text-paper uppercase sm:text-5xl">
            Good to <span className="text-gradient">know.</span>
          </h2>
        </div>
        <div className="grid content-start gap-2.5">
          {items.map(([question, answer]) => (
            <details key={question} className="faq-item tile p-4 sm:px-5">
              <summary className="font-display text-lg text-paper">{question}</summary>
              <p className="mt-2 text-sm leading-relaxed text-mist">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
