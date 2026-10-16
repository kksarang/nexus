import { MessageCircle, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { messages, site, whatsappLink } from "@/lib/site";

export function WhatsAppButton({
  message = messages.book,
  children = "Chat on WhatsApp",
  className = "",
}: {
  message?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={whatsappLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn btn-whatsapp ${className}`.trim()}
    >
      <MessageCircle size={16} aria-hidden="true" />
      {children}
    </a>
  );
}

export function CallButton({ className = "" }: { className?: string }) {
  return (
    <a href={`tel:${site.phoneTel}`} className={`btn btn-secondary ${className}`.trim()}>
      <Phone size={16} aria-hidden="true" />
      Call {site.phoneDisplay}
    </a>
  );
}
