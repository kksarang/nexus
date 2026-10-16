import Image from "next/image";
import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  children,
  image = "/images/hero-lounge.jpg",
  actions,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  image?: string;
  actions?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-white/10 pt-32 pb-14 sm:pt-40 sm:pb-20">
      <Image src={image} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-45" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/90 to-ink/40" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-transparent to-ink/60" />
      <div className="shell">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-5 max-w-4xl text-[3rem] leading-[0.88] tracking-wide text-balance text-paper uppercase sm:text-7xl">
          {title}
        </h1>
        {children ? (
          <div className="mt-5 max-w-2xl text-base leading-relaxed text-mist sm:text-lg">{children}</div>
        ) : null}
        {actions ? <div className="mt-8 flex flex-col gap-3 sm:flex-row">{actions}</div> : null}
      </div>
    </section>
  );
}
