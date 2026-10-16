import { BookButton } from "@/components/BookSlot";
import { ButtonLink } from "@/components/ButtonLink";

export default function NotFound() {
  return (
    <main id="content" className="shell flex min-h-[70svh] flex-col justify-center py-32">
      <p className="text-[0.72rem] uppercase tracking-[0.28em] text-cyan">404</p>
      <h1 className="mt-4 max-w-xl text-4xl tracking-wide text-paper uppercase sm:text-6xl">
        This page is off the floor.
      </h1>
      <p className="mt-5 max-w-md text-base leading-relaxed text-mist">
        That link does not match a page on Nexus Playzone. Return home, or book a 1-hour slot by
        call or WhatsApp.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/">Back to home</ButtonLink>
        <BookButton variant="secondary">Book a slot</BookButton>
      </div>
    </main>
  );
}
