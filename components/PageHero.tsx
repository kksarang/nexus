import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

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
    <section className="relative isolate overflow-hidden pt-32 pb-16 sm:pt-36 lg:pb-24">
      <Image src="/brand/nebula.jpg" alt="" fill preload sizes="100vw" className="-z-20 object-cover" />
      <div className="absolute inset-0 -z-10 bg-ink/45" />
      <div className="grid-floor" aria-hidden="true" />
      <div className="shell grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="eyebrow boot" style={{ "--boot": 0 } as CSSProperties}>{eyebrow}</p>
          <h1 className="boot mt-5 text-[2.6rem] text-balance text-paper uppercase sm:text-7xl" style={{ "--boot": 1 } as CSSProperties}>
            {title}
          </h1>
          {children ? (
            <div className="boot mt-5 max-w-2xl text-base leading-relaxed text-paper/85 sm:text-lg" style={{ "--boot": 2 } as CSSProperties}>
              {children}
            </div>
          ) : null}
          {actions ? <div className="boot mt-8 flex flex-col gap-3 sm:flex-row" style={{ "--boot": 3 } as CSSProperties}>{actions}</div> : null}
        </div>
        <div className="hero-frame boot bevel relative aspect-[16/10] overflow-hidden border border-magenta/50" style={{ "--boot": 2 } as CSSProperties}>
          <Image src={image} alt="" fill preload sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
        </div>
      </div>
      <div className="flare absolute inset-x-0 bottom-0" />
    </section>
  );
}
