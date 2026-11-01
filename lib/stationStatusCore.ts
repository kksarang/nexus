import { whenIdle } from "@/lib/whenIdle";

export type StationState = "available" | "busy" | "unavailable";

export type StationStatus = {
  id: string;
  status: StationState;
  until: number | null;
  reason: string;
  updatedAt: number;
};

export type StatusView = {
  tone: "free" | "busy" | "off" | "unknown";
  label: string;
  detail: string;
};

export const reasons = ["Booked", "Reserved", "Maintenance", "Private event", "Closed for now"] as const;

const MINUTE = 60 * 1000;

function asStatus(id: string, data: Record<string, unknown>): StationStatus {
  const raw = String(data.status ?? "available");
  const status: StationState = raw === "busy" || raw === "unavailable" ? raw : "available";
  const until = typeof data.until === "number" && data.until > 0 ? data.until : null;
  const stamp = data.updatedAt as { toMillis?: () => number } | number | undefined;
  const updatedAt = typeof stamp === "number" ? stamp : stamp?.toMillis?.() ?? 0;
  return { id, status, until, reason: String(data.reason ?? ""), updatedAt };
}

export function subscribeStationStatus(
  onChange: (next: Record<string, StationStatus>) => void,
  onError: () => void,
) {
  let stop: (() => void) | undefined;
  let cancelled = false;
  whenIdle(async () => {
    try {
      const [{ collection, onSnapshot }, { firebaseServices }] = await Promise.all([import("firebase/firestore"), import("@/lib/firebaseClient")]);
      if (cancelled) return;
      const services = firebaseServices();
      if (!services) return onError();
      stop = onSnapshot(
        collection(services.db, "stations"),
        (snap) => {
          const next: Record<string, StationStatus> = {};
          snap.forEach((item) => {
            next[item.id] = asStatus(item.id, item.data());
          });
          onChange(next);
        },
        () => onError(),
      );
    } catch {
      onError();
    }
  });
  return () => {
    cancelled = true;
    stop?.();
  };
}

export function istClock(ms: number) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(ms)
    .replace(/am|pm/i, (period) => period.toUpperCase());
}

export function minutesLabel(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function agoLabel(updatedAt: number, now: number) {
  if (!updatedAt || !now) return "";
  const minutes = Math.max(0, Math.round((now - updatedAt) / MINUTE));
  if (minutes < 1) return "Updated just now";
  if (minutes < 60) return `Updated ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Updated ${hours} h ago`;
  return `Updated ${Math.round(hours / 24)} d ago`;
}

export function describeStatus(entry: StationStatus | undefined, now: number): StatusView {
  if (!entry || !now) return { tone: "unknown", label: "Ask us", detail: "Call or WhatsApp us to check if it is free." };
  const left = entry.until ? Math.ceil((entry.until - now) / MINUTE) : null;
  if (entry.status === "available" || (entry.status === "unavailable" && left !== null && left <= 0)) {
    return { tone: "free", label: "Available now", detail: "Walk in or book to hold it." };
  }
  if (entry.status === "busy") {
    if (left === null) return { tone: "busy", label: "In use", detail: "A session is running." };
    if (left <= 0) return { tone: "busy", label: "Finishing up", detail: "The current session is wrapping up." };
    return { tone: "busy", label: "In use", detail: `Free around ${istClock(entry.until ?? now)} · in ${minutesLabel(left)}` };
  }
  const why = entry.reason ? `${entry.reason} · ` : "";
  if (left === null) return { tone: "off", label: "Not available", detail: `${why}Call or WhatsApp for the next free slot.` };
  return { tone: "off", label: "Not available", detail: `${why}Back around ${istClock(entry.until ?? now)} · in ${minutesLabel(left)}` };
}
