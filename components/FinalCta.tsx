import { BookButton } from "@/components/BookSlot";
import { WhatsAppButton } from "@/components/ContactButtons";

export function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden border-t border-white/10 py-20 text-center sm:py-24">
      <div className="shell">
        <p className="font-display text-sm tracking-[0.3em] text-cyan uppercase">Ready when you are</p>
        <h2 className="mt-4 text-[2.6rem] text-paper uppercase sm:text-6xl">
          Your next session <span className="text-gradient">starts here.</span>
        </h2>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <BookButton>Book your session</BookButton>
          <WhatsAppButton />
        </div>
      </div>
    </section>
  );
}
