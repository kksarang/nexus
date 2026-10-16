import Image from "next/image";
import Link from "next/link";
import { SectionIntro } from "@/components/SectionIntro";
import { gallery } from "@/lib/site";

export function Gallery({ heading = true }: { heading?: boolean }) {
  return (
    <section id="gallery" className="py-20 sm:py-28">
      <div className="shell">
        {heading ? (
          <SectionIntro
            eyebrow="Gallery"
            title={
              <>
                Inside the <span className="text-gradient">lounge.</span>
              </>
            }
            action={
              <Link href="/gallery" className="btn btn-secondary">
                Open gallery
              </Link>
            }
          >
            The consoles, the screens, the seats, and the moments in between.
          </SectionIntro>
        ) : null}

        <ul className={`${heading ? "mt-12" : ""} grid auto-rows-[14rem] grid-cols-2 gap-3 sm:auto-rows-[18rem] lg:grid-cols-4`}>
          {gallery.map((item) => (
            <li
              key={item.src}
              className={`reveal group relative overflow-hidden rounded-[1.25rem] border border-white/10 ${
                "wide" in item && item.wide ? "col-span-2" : ""
              }`}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover transition duration-700 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent opacity-80" />
              <span className="absolute bottom-3 left-3 chip">{item.tag}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
