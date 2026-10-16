"use client";

import { MessageCircle, Phone, Radio } from "lucide-react";
import { useSyncExternalStore } from "react";
import { site, stations, whatsappLink } from "@/lib/site";
import { agoLabel, describeStatus, subscribeStationStatus, type StationStatus, type StatusView } from "@/lib/stationStatus";

type Feed = { ready: boolean; failed: boolean; map: Record<string, StationStatus> };

const idle: Feed = { ready: false, failed: false, map: {} };
let feed: Feed = idle;
let stopFeed: (() => void) | null = null;
const feedListeners = new Set<() => void>();

function publish(next: Feed) {
  feed = next;
  feedListeners.forEach((listener) => listener());
}

function subscribeFeed(listener: () => void) {
  feedListeners.add(listener);
  if (!stopFeed) {
    stopFeed = subscribeStationStatus(
      (map) => publish({ ready: true, failed: false, map }),
      () => publish({ ...feed, ready: true, failed: true }),
    );
  }
  return () => {
    feedListeners.delete(listener);
    if (!feedListeners.size && stopFeed) {
      stopFeed();
      stopFeed = null;
      feed = idle;
    }
  };
}

let clock = 0;
let clockTimer: number | null = null;
const clockListeners = new Set<() => void>();

function subscribeClock(listener: () => void) {
  clockListeners.add(listener);
  if (clockTimer === null) {
    const tick = () => {
      clock = Date.now();
      clockListeners.forEach((item) => item());
    };
    window.requestAnimationFrame(tick);
    clockTimer = window.setInterval(tick, 15000);
  }
  return () => {
    clockListeners.delete(listener);
    if (!clockListeners.size && clockTimer !== null) {
      window.clearInterval(clockTimer);
      clockTimer = null;
    }
  };
}

export function useLiveStations() {
  const live = useSyncExternalStore(subscribeFeed, () => feed, () => idle);
  const now = useSyncExternalStore(subscribeClock, () => clock, () => 0);
  return { ...live, now };
}

const toneStyle: Record<StatusView["tone"], { dot: string; text: string; ring: string }> = {
  free: { dot: "bg-[#3BFF9D]", text: "text-[#3BFF9D]", ring: "border-[#3BFF9D]/40 bg-[#3BFF9D]/10" },
  busy: { dot: "bg-[#FFC53D]", text: "text-[#FFC53D]", ring: "border-[#FFC53D]/40 bg-[#FFC53D]/10" },
  off: { dot: "bg-magenta", text: "text-magenta", ring: "border-magenta/40 bg-magenta/10" },
  unknown: { dot: "bg-white/40", text: "text-mist", ring: "border-white/15 bg-white/5" },
};

function viewFor(live: ReturnType<typeof useLiveStations>, id: string): StatusView {
  if (!live.ready || !live.now) return { tone: "unknown", label: "Checking…", detail: "Loading live status." };
  if (live.failed && !live.map[id]) return { tone: "unknown", label: "Ask us", detail: "Live status could not load. Call or WhatsApp to check." };
  return describeStatus(live.map[id], live.now);
}

function AskActions({ name }: { name: string }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <a
        href={`tel:${site.phoneTel}`}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 text-xs font-semibold text-paper transition hover:border-cyan/60 hover:text-cyan"
        aria-label={`Call to check if ${name} is free`}
      >
        <Phone size={13} aria-hidden="true" /> Call
      </a>
      <a
        href={whatsappLink(`Hi Nexus, is ${name} free right now?`)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 text-xs font-semibold text-paper transition hover:border-cyan/60 hover:text-cyan"
        aria-label={`WhatsApp to check if ${name} is free`}
      >
        <MessageCircle size={13} aria-hidden="true" /> WhatsApp
      </a>
    </div>
  );
}

const askTones: StatusView["tone"][] = ["unknown", "off"];

export function StatusPill({ id, className = "" }: { id: string; className?: string }) {
  const live = useLiveStations();
  const view = viewFor(live, id);
  const style = toneStyle[view.tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide backdrop-blur ${style.ring} ${style.text} ${className}`}
      title={view.detail}
    >
      <span className={`size-2 rounded-full ${style.dot} ${view.tone === "free" ? "animate-pulse motion-reduce:animate-none" : ""}`} aria-hidden="true" />
      {view.label}
    </span>
  );
}

export function StatusLine({ id }: { id: string }) {
  const live = useLiveStations();
  const view = viewFor(live, id);
  const style = toneStyle[view.tone];
  const ago = agoLabel(live.map[id]?.updatedAt ?? 0, live.now);
  return (
    <div className={`mt-4 rounded-xl border px-3 py-2.5 ${style.ring}`} aria-live="polite">
      <p className={`flex items-center gap-2 text-sm font-semibold ${style.text}`}>
        <span className={`size-2 rounded-full ${style.dot}`} aria-hidden="true" />
        {view.label}
      </p>
      <p className="mt-0.5 text-xs text-paper/80">{view.detail}</p>
      {ago ? <p className="mt-0.5 text-[11px] text-mist">{ago}</p> : null}
      {live.ready && live.now && askTones.includes(view.tone) ? <AskActions name={stations.find((item) => item.id === id)?.name ?? `Station ${id}`} /> : null}
    </div>
  );
}

export function LiveBoard() {
  const live = useLiveStations();
  const counts = stations.reduce(
    (total, station) => {
      const tone = viewFor(live, station.id).tone;
      return { ...total, [tone]: total[tone] + 1 };
    },
    { free: 0, busy: 0, off: 0, unknown: 0 } as Record<StatusView["tone"], number>,
  );

  return (
    <section id="live" className="py-14 sm:py-20" aria-labelledby="live-heading">
      <div className="shell">
        <div className="panel p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-cyan uppercase">
                <Radio size={14} aria-hidden="true" /> Live right now
              </p>
              <h2 id="live-heading" className="mt-2 text-3xl tracking-wide text-paper uppercase sm:text-4xl">
                Station availability
              </h2>
              <p className="mt-2 max-w-xl text-sm text-mist">
                Updated by the front desk the moment a session starts, ends, or a station is held. Times are approximate and shown in IST.
              </p>
            </div>
            {live.ready && live.now && counts.unknown < stations.length ? (
              <p className="text-sm text-paper">
                <span className="text-[#3BFF9D]">{counts.free} free</span>
                <span className="text-mist"> · </span>
                <span className="text-[#FFC53D]">{counts.busy} in use</span>
                <span className="text-mist"> · </span>
                <span className="text-magenta">{counts.off} not available</span>
              </p>
            ) : null}
          </div>

          <ul className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
            {stations.map((station) => {
              const view = viewFor(live, station.id);
              const style = toneStyle[view.tone];
              const ago = agoLabel(live.map[station.id]?.updatedAt ?? 0, live.now);
              return (
                <li key={station.id} className={`rounded-2xl border p-3 sm:p-4 ${style.ring}`}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <div>
                      <p className="font-tech text-2xl text-paper">{station.id}</p>
                      <p className="text-sm text-paper">{station.name}</p>
                    </div>
                    <span className={`flex items-center gap-1.5 text-sm font-semibold ${style.text}`}>
                      <span className={`size-2.5 rounded-full ${style.dot} ${view.tone === "free" ? "animate-pulse motion-reduce:animate-none" : ""}`} aria-hidden="true" />
                      {view.label}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-paper/80">{view.detail}</p>
                  {ago ? <p className="mt-1 text-[11px] text-mist">{ago}</p> : null}
                  {live.ready && live.now && askTones.includes(view.tone) ? <AskActions name={station.name} /> : null}
                </li>
              );
            })}
          </ul>

          <p className="mt-5 flex flex-wrap items-center gap-2 text-sm text-mist">
            <MessageCircle size={15} className="text-cyan" aria-hidden="true" />
            Want to hold a station? Message us on
            <a className="text-cyan underline-offset-4 hover:underline" href={whatsappLink("Hi Nexus, is a station free right now?")} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
            before you head over.
          </p>
        </div>
      </div>
    </section>
  );
}
