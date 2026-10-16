import type { ReactNode } from "react";

export function SectionIntro({
  eyebrow,
  title,
  children,
  action,
  center = false,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  center?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-6 ${
        center ? "items-center text-center" : "lg:flex-row lg:items-end lg:justify-between"
      }`}
    >
      <div className={`max-w-2xl ${center ? "flex flex-col items-center" : ""}`}>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-5 text-[2.6rem] leading-[0.92] tracking-wide text-balance text-paper uppercase sm:text-6xl">
          {title}
        </h2>
        {children ? (
          <div className="mt-5 max-w-xl text-base leading-relaxed text-mist sm:text-lg">{children}</div>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 flex-col gap-3 sm:flex-row">{action}</div> : null}
    </div>
  );
}
