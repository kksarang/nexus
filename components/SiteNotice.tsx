"use client";

import { Megaphone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { subscribeNotice, type SiteNotice as Notice } from "@/lib/manageApi";

const DISMISS_KEY = "nexus-notice-dismissed";

export function SiteNotice() {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [now, setNow] = useState(0);
  const [dismissed, setDismissed] = useState<number | null>(null);

  useEffect(() => {
    const stop = subscribeNotice(setNotice);
    const frame = window.requestAnimationFrame(() => {
      setNow(Date.now());
      setDismissed(Number(window.sessionStorage.getItem(DISMISS_KEY) ?? 0));
    });
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => {
      stop();
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, []);

  if (!notice || !now || dismissed === null) return null;
  if (!notice.active || !notice.text || (notice.until && notice.until <= now)) return null;
  if (dismissed === notice.updatedAt) return null;

  return (
    <div
      role="status"
      className="fixed right-[4.5rem] bottom-24 left-3 z-40 flex items-start gap-3 rounded-2xl border border-cyan/40 bg-navy/95 p-3.5 text-sm text-paper shadow-2xl backdrop-blur md:right-auto md:bottom-6 md:left-6 md:max-w-md"
    >
      <Megaphone size={18} className="mt-0.5 shrink-0 text-cyan" aria-hidden="true" />
      <p className="flex-1 leading-relaxed">{notice.text}</p>
      <button
        type="button"
        className="-m-1 grid size-8 shrink-0 place-items-center rounded-full text-mist hover:text-paper"
        aria-label="Close notice"
        onClick={() => {
          window.sessionStorage.setItem(DISMISS_KEY, String(notice.updatedAt));
          setDismissed(notice.updatedAt);
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
