/** Paid play earns 1 point per 60 minutes. 10 points in a Monday–Sunday IST week unlocks 30 free minutes. */

export const POINT_MINUTES = 60;
export const WEEKLY_TARGET = 10;
export const REWARD_MINUTES = 30;
const IST_OFFSET_MS = 330 * 60 * 1000;

export function normalizePhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.length < 10) return "";
  return digits.slice(-10);
}

export function phoneE164(phone: string) {
  return `+91${phone}`;
}

function istDate(ms: number) {
  return new Date(ms + IST_OFFSET_MS);
}

export function istHour(ms: number) {
  return istDate(ms).getUTCHours();
}

export function istMonthStart(ms: number) {
  const shifted = istDate(ms);
  return Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), 1) - IST_OFFSET_MS;
}

export function istYearStart(ms: number) {
  const shifted = istDate(ms);
  return Date.UTC(shifted.getUTCFullYear(), 0, 1) - IST_OFFSET_MS;
}

/** Monday 00:00 IST for the week that contains `ms`, as a UTC millisecond timestamp. */
export function weekStartMonday(ms: number) {
  const shifted = istDate(ms);
  const dow = shifted.getUTCDay();
  const mondayOffset = (dow + 6) % 7;
  const mondayUtc = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate() - mondayOffset,
  );
  return mondayUtc - IST_OFFSET_MS;
}

export function weekKey(ms: number) {
  const start = istDate(weekStartMonday(ms));
  const month = String(start.getUTCMonth() + 1).padStart(2, "0");
  const day = String(start.getUTCDate()).padStart(2, "0");
  return `${start.getUTCFullYear()}-${month}-${day}`;
}

export function millisOf(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value && typeof value === "object" && "toMillis" in value && typeof (value as { toMillis: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (value && typeof value === "object" && "seconds" in value) {
    return Number((value as { seconds: number }).seconds) * 1000;
  }
  return 0;
}

export function istDayStart(ms: number) {
  const shifted = istDate(ms);
  return Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - IST_OFFSET_MS;
}

/** First `bookedMinutes` of the session count as paid. Minutes are split if they cross Monday 00:00 IST. */
/** Minutes on the clock, rounded up so any started minute is billed. An exact minute stays exact. */
export function usedMinutes(startedAt: number, endedAt: number) {
  const ms = Math.max(0, endedAt - startedAt);
  if (ms === 0) return 0;
  return Math.ceil(ms / 60000);
}

/**
 * Bill the minutes actually played.
 * Leaving early charges only the time used, not the full booking.
 * Staying past the booking, including +15 minutes, charges that extra time too.
 * A membership covers the booked plan. Only time past that plan is charged.
 */
export function chargeForSession(input: {
  hourlyRupees: number;
  startedAt: number;
  endedAt: number;
  planMinutes: number;
  member: boolean;
}) {
  const used = usedMinutes(input.startedAt, input.endedAt);
  const plan = Math.max(0, Math.round(input.planMinutes));
  const billable = input.member ? Math.max(0, used - plan) : used;
  const rate = Number.isFinite(input.hourlyRupees) ? input.hourlyRupees : 0;
  const amount = rate > 0 ? Math.round((billable / 60) * rate) : 0;
  return { usedMinutes: used, billableMinutes: billable, amount };
}

export function allocatePaidMinutes(startedAt: number, endedAt: number, bookedMinutes: number) {
  const elapsed = Math.max(0, Math.floor((endedAt - startedAt) / 60000));
  const paid = Math.min(elapsed, Math.max(0, Math.floor(bookedMinutes)));
  if (paid <= 0) return [];
  const paidEnd = startedAt + paid * 60000;
  const boundary = weekStartMonday(paidEnd);
  if (startedAt >= boundary) return [{ weekId: weekKey(startedAt), minutes: paid }];
  const before = Math.floor((boundary - startedAt) / 60000);
  const slices = [
    { weekId: weekKey(startedAt), minutes: before },
    { weekId: weekKey(boundary), minutes: paid - before },
  ];
  return slices.filter((slice) => slice.minutes > 0);
}

export function awardMinutes(bankedMinutes: number, slices: { weekId: string; minutes: number }[]) {
  let bank = bankedMinutes;
  const weeks = new Map<string, { minutes: number; points: number }>();
  let points = 0;
  for (const slice of slices) {
    const total = bank + slice.minutes;
    const gained = Math.floor(total / POINT_MINUTES);
    bank = total % POINT_MINUTES;
    points += gained;
    const current = weeks.get(slice.weekId) ?? { minutes: 0, points: 0 };
    weeks.set(slice.weekId, {
      minutes: current.minutes + slice.minutes,
      points: current.points + gained,
    });
  }
  return {
    points,
    bankedMinutes: bank,
    weeks: [...weeks.entries()].map(([weekId, value]) => ({ weekId, ...value })),
  };
}

export type FinishedPlay = {
  stationId: string;
  stationName: string;
  name: string;
  phone: string;
  startedAt: number;
  endedAt: number;
  bookedMinutes: number;
  collectedRupees?: number;
};

export function pointsProgress(weeklyPoints: number, redeemed: boolean) {
  const clamped = Math.max(0, weeklyPoints);
  const ready = clamped >= WEEKLY_TARGET && !redeemed;
  const remaining = ready || redeemed ? 0 : WEEKLY_TARGET - clamped;
  return { ready, remaining, percent: Math.min(100, (Math.min(clamped, WEEKLY_TARGET) / WEEKLY_TARGET) * 100) };
}
