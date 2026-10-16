import Link from "next/link";
import type { ReactNode } from "react";

export function BookButton({
  children,
  variant = "primary",
  station,
  className = "",
}: {
  children: ReactNode;
  variant?: "primary" | "secondary";
  station?: string;
  className?: string;
}) {
  const href = station ? `/book?station=${station}` : "/book";
  return (
    <Link href={href} className={`btn btn-${variant} ${className}`.trim()}>
      {children}
    </Link>
  );
}
