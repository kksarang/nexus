import { BookButton } from "@/components/BookSlot";
import { WhatsAppButton } from "@/components/ContactButtons";

export function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden py-24 text-center sm:py-32">
      <div className="grid-floor" aria-hidden="true" />
      <div className="shell">
        <p className="font-display text-sm tracking-[0.3em] text-cyan uppercase">Your turn</p>
        <h2 className="mt-4 text-[2.6rem] text-paper uppercase sm:text-7xl">
          Ready, <span className="text-gradient">player one?</span>
        </h2>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <BookButton className="press-start">Book your session</BookButton>
          <WhatsAppButton />
        </div>
      </div>
    </section>
  );
}
