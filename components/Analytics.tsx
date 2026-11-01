"use client";

import Script from "next/script";
import { useEffect } from "react";

const gaId = process.env.NEXT_PUBLIC_GA_ID;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function Analytics() {
  useEffect(() => {
    if (!gaId) return;
    const track = (name: string) => window.gtag?.("event", name, { page_path: window.location.pathname });
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a");
      if (!link) return;
      const href = link.getAttribute("href") ?? "";
      if (href.startsWith("https://wa.me/")) track("whatsapp_click");
      else if (href.startsWith("tel:")) track("call_click");
      else if (href.startsWith("https://play.google.com/")) track("play_store_click");
      else if (href.includes("google.com/maps")) track("directions_click");
    };
    const onSubmit = () => track("booking_request");
    document.addEventListener("click", onClick);
    document.addEventListener("submit", onSubmit);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("submit", onSubmit);
    };
  }, []);

  if (!gaId) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${gaId}');`}
      </Script>
    </>
  );
}
