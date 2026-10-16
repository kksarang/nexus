import { doc, getDoc, onSnapshot, serverTimestamp, writeBatch, collection } from "firebase/firestore";
import { firebaseServices } from "@/lib/firebaseClient";
import { memberships, rates, stations } from "@/lib/site";

export type PriceBook = {
  station: number;
  simulator: number;
  privateRoom: number;
  memberSessions: number;
  memberRupees: number;
  quarterSessions: number;
  quarterRupees: number;
  yearSessions: number;
  yearRupees: number;
};

export type MemberPlan = {
  id: "monthly" | "quarterly" | "yearly";
  label: string;
  months: number;
  sessions: number;
  rupees: number;
};

function rateAmount(key: string, fallback: number) {
  const amount = rates.find((rate) => rate.key === key)?.rupees;
  return typeof amount === "number" ? amount : fallback;
}

export const defaultPrices: PriceBook = {
  station: rateAmount("station", 160),
  simulator: rateAmount("simulator", 180),
  privateRoom: rateAmount("private", 200),
  memberSessions: memberships[0].sessions,
  memberRupees: memberships[0].rupees,
  quarterSessions: memberships[1].sessions,
  quarterRupees: memberships[1].rupees,
  yearSessions: memberships[2].sessions,
  yearRupees: memberships[2].rupees,
};

export function memberPlans(prices: PriceBook = currentPrices): MemberPlan[] {
  return [
    { id: "monthly", label: "Monthly", months: 1, sessions: prices.memberSessions, rupees: prices.memberRupees },
    { id: "quarterly", label: "Quarterly", months: 3, sessions: prices.quarterSessions, rupees: prices.quarterRupees },
    { id: "yearly", label: "Yearly", months: 12, sessions: prices.yearSessions, rupees: prices.yearRupees },
  ];
}

export function memberPlan(id: string, prices: PriceBook = currentPrices) {
  return memberPlans(prices).find((item) => item.id === id) ?? memberPlans(prices)[0];
}

function clamp(value: unknown, fallback: number, min: number, max: number) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) return fallback;
  return number;
}

export function asPrices(data: Record<string, unknown> | undefined): PriceBook {
  if (!data) return defaultPrices;
  return {
    station: clamp(data.station, defaultPrices.station, 1, 10000),
    simulator: clamp(data.simulator, defaultPrices.simulator, 1, 10000),
    privateRoom: clamp(data.privateRoom, defaultPrices.privateRoom, 1, 10000),
    memberSessions: clamp(data.memberSessions, defaultPrices.memberSessions, 1, 400),
    memberRupees: clamp(data.memberRupees, defaultPrices.memberRupees, 0, 500000),
    quarterSessions: clamp(data.quarterSessions, defaultPrices.quarterSessions, 1, 400),
    quarterRupees: clamp(data.quarterRupees, defaultPrices.quarterRupees, 0, 500000),
    yearSessions: clamp(data.yearSessions, defaultPrices.yearSessions, 1, 400),
    yearRupees: clamp(data.yearRupees, defaultPrices.yearRupees, 0, 500000),
  };
}

export function hourlyFor(stationId: string, prices: PriceBook = currentPrices) {
  const station = stations.find((item) => item.id === stationId);
  if (station?.rate === "simulator") return prices.simulator;
  if (station?.rate === "private") return prices.privateRoom;
  return prices.station;
}

let currentPrices: PriceBook = defaultPrices;
const listeners = new Set<() => void>();
let watching = false;

function publish(next: PriceBook) {
  currentPrices = next;
  listeners.forEach((listener) => listener());
}

function watchPrices() {
  if (watching || typeof window === "undefined") return;
  watching = true;
  const services = firebaseServices();
  if (!services) return;
  onSnapshot(
    doc(services.db, "settings", "prices"),
    (snap) => publish(asPrices(snap.data() as Record<string, unknown> | undefined)),
    () => publish(defaultPrices),
  );
}

export function getPrices() {
  return currentPrices;
}

export function subscribePriceStore(listener: () => void) {
  watchPrices();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function readPrices() {
  const services = firebaseServices();
  if (!services) return defaultPrices;
  const snap = await getDoc(doc(services.db, "settings", "prices"));
  const next = asPrices(snap.data() as Record<string, unknown> | undefined);
  publish(next);
  return next;
}

export async function savePrices(input: PriceBook) {
  const services = firebaseServices();
  const user = services?.auth.currentUser;
  if (!services || !user) throw new Error("Sign in as an admin before changing prices.");
  const next = asPrices(input);
  const batch = writeBatch(services.db);
  batch.set(doc(services.db, "settings", "prices"), {
    ...next,
    updatedBy: user.uid,
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(collection(services.db, "auditLogs")), {
    type: "prices",
    after: next,
    by: user.uid,
    at: serverTimestamp(),
  });
  await batch.commit();
  publish(next);
}
