import Image from "next/image";
import Link from "next/link";

export function BrandLogo({
  className = "h-10 w-auto",
  preload = false,
}: {
  className?: string;
  preload?: boolean;
}) {
  return (
    <Link href="/" aria-label="Nexus Playzone, home" className="inline-flex shrink-0">
      <Image src="/brand/nexus-wordmark.png" alt="" width={1052} height={252} preload={preload} className={className} />
    </Link>
  );
}
