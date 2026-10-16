import { istDayStart, istHour, istMonthStart, istYearStart, weekStartMonday } from "@/lib/loyalty";
import { stations } from "@/lib/site";

export type OpsSession = {
  id: string;
  customerId: string;
  name: string;
  phone: string;
  stationId: string;
  stationName: string;
  startedAt: number;
  endedAt: number;
  bookedMinutes: number;
  paidMinutes: number;
  points: number;
  amountRupees: number;
  amountRecorded: boolean;
  status: "active" | "completed" | "cancelled";
  by: string;
};

export type OpsPlayer = {
  id: string;
  name: string;
  phone: string;
  createdAt: number;
  lifetimeMinutes: number;
  lifetimePoints: number;
  bankedMinutes: number;
  sessionCount: number;
  rewardsRedeemed: number;
  lastPlayedAt: number;
  todayPoints: number;
  weekPoints: number;
  monthPoints: number;
  yearPoints: number;
  weekMinutes: number;
  rewardReady: boolean;
};

export type WeekRow = {
  customerId: string;
  points: number;
  minutes: number;
  redeemedAt: number;
};

export function recordedPayment(flag: unknown, amount: number) {
  const rupees = Number.isFinite(amount) ? Math.round(amount) : 0;
  if (flag === true && rupees > 0) return { amountRupees: rupees, amountRecorded: true };
  return { amountRupees: 0, amountRecorded: false };
}

export function rangeFor(key: "today" | "yesterday" | "week" | "month" | "year" | "all", now = Date.now()) {
  if (key === "today") return { from: istDayStart(now), to: now };
  if (key === "yesterday") {
    const start = istDayStart(now) - 24 * 60 * 60 * 1000;
    return { from: start, to: istDayStart(now) - 1 };
  }
  if (key === "week") return { from: weekStartMonday(now), to: now };
  if (key === "month") return { from: istMonthStart(now), to: now };
  if (key === "year") return { from: istYearStart(now), to: now };
  return { from: 0, to: now };
}

export function inRange(ms: number, from: number, to: number) {
  return ms >= from && ms <= to;
}

export function buildPlayers(players: OpsPlayer[], sessions: OpsSession[], now = Date.now()) {
  const today = istDayStart(now);
  const week = weekStartMonday(now);
  const month = istMonthStart(now);
  const year = istYearStart(now);
  const byId = new Map(players.map((player) => [player.id, { ...player }]));
  for (const session of sessions) {
    if (session.status === "active" || session.status === "cancelled") continue;
    const player = byId.get(session.customerId);
    if (!player) continue;
    if (session.endedAt > player.lastPlayedAt) player.lastPlayedAt = session.endedAt;
    if (session.endedAt >= year) player.yearPoints += session.points;
    if (session.endedAt >= month) player.monthPoints += session.points;
    if (session.endedAt >= week) {
      player.weekPoints += session.points;
      player.weekMinutes += session.paidMinutes;
    }
    if (session.endedAt >= today) player.todayPoints += session.points;
  }
  return [...byId.values()];
}

export function closedSessions(sessions: OpsSession[], from: number, to: number) {
  return sessions.filter((session) => session.status !== "active" && session.status !== "cancelled" && inRange(session.endedAt, from, to));
}

export function dayKey(ms: number) {
  const shifted = new Date(ms + 330 * 60 * 1000);
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  return `${shifted.getUTCFullYear()}-${month}-${day}`;
}

export function dailyTotals(sessions: OpsSession[], from: number, to: number) {
  const map = new Map<string, { label: string; hours: number; amount: number; points: number; sessions: number }>();
  for (const session of closedSessions(sessions, from, to)) {
    const key = dayKey(session.endedAt);
    const row = map.get(key) ?? { label: key.slice(5), hours: 0, amount: 0, points: 0, sessions: 0 };
    row.hours += session.paidMinutes / 60;
    row.amount += session.amountRupees;
    row.points += session.points;
    row.sessions += 1;
    map.set(key, row);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, row]) => row);
}

export function stationTotals(sessions: OpsSession[], from: number, to: number) {
  return stations.map((station) => {
    const rows = closedSessions(sessions, from, to).filter((session) => session.stationId === station.id);
    return {
      id: station.id,
      name: station.name,
      sessions: rows.length,
      minutes: rows.reduce((total, session) => total + session.paidMinutes, 0),
      amount: rows.reduce((total, session) => total + session.amountRupees, 0),
    };
  });
}

export function hourTotals(sessions: OpsSession[], from: number, to: number) {
  const hours = Array.from({ length: 24 }, () => 0);
  for (const session of closedSessions(sessions, from, to)) hours[istHour(session.endedAt)] += 1;
  return hours;
}

export function formatIst(ms: number) {
  if (!ms) return "—";
  return new Date(ms).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const body = rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll("\"", "\"\"")}"`).join(","))
    .join("\n");
  const file = new Blob([body], { type: "text/csv" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function hoursLabel(minutes: number) {
  const rounded = Math.round((minutes / 60) * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function playerKind(player: OpsPlayer, now = Date.now()) {
  const month = 30 * 24 * 60 * 60 * 1000;
  if (player.createdAt > 0 && now - player.createdAt <= month && player.sessionCount < 2) return "new";
  if (player.sessionCount >= 8 || player.lifetimeMinutes >= 600) return "frequent";
  if (player.lastPlayedAt > 0 && now - player.lastPlayedAt > month) return "inactive";
  if (player.sessionCount >= 2) return "regular";
  if (player.createdAt === 0 || now - player.createdAt > month) return "inactive";
  return "new";
}
