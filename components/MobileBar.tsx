"use client";

import { CalendarCheck, MessageCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { messages, whatsappLink } from "@/lib/site";

export function MobileBar() {
  const pathname = usePathname();
  if (pathname === "/floor" || pathname === "/room" || pathname === "/book" || pathname.startsWith("/admin")) return null;

  return (
    <>
      <div className="h-24 md:hidden" aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/92 backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-2 gap-2 px-3 pt-2 pb-[max(0.65rem,env(safe-area-inset-bottom))]">
          <Link href="/book" className="btn btn-primary w-full min-w-0 px-2">
            <CalendarCheck size={16} aria-hidden="true" />
            Book now
          </Link>
          <a
            href={whatsappLink(messages.book)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp w-full min-w-0 px-2"
          >
            <MessageCircle size={16} aria-hidden="true" />
            WhatsApp
          </a>
        </div>
      </div>
    </>
  );
}
