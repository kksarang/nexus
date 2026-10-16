import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { firebaseServices } from "@/lib/firebaseClient";
import {
  WEEKLY_TARGET,
  allocatePaidMinutes,
  awardMinutes,
  istHour,
  istMonthStart,
  normalizePhone,
  phoneE164,
  weekKey,
  type FinishedPlay,
} from "@/lib/loyalty";

export type { FinishedPlay };

export type CustomerProfile = {
  id: string;
  name: string;
  phone: string;
  lifetimeMinutes: number;
  lifetimePoints: number;
  bankedMinutes: number;
  weeklyPoints: number;
  weeklyMinutes: number;
  rewardRedeemed: boolean;
};

function requireDb() {
  const services = firebaseServices();
  if (!services) {
    throw new Error("Add the Firebase web app keys in .env.local, then restart the dev server.");
  }
  const user = services.auth.currentUser;
  if (!user) throw new Error("Sign in as staff before saving points.");
  return { ...services, user };
}

function asCustomer(id: string, data: Record<string, unknown>, weekly?: Record<string, unknown>): CustomerProfile {
  return {
    id,
    name: String(data.name ?? ""),
    phone: String(data.phone ?? ""),
    lifetimeMinutes: Number(data.lifetimeMinutes ?? 0),
    lifetimePoints: Number(data.lifetimePoints ?? 0),
    bankedMinutes: Number(data.bankedMinutes ?? 0),
    weeklyPoints: Number(weekly?.points ?? 0),
    weeklyMinutes: Number(weekly?.minutes ?? 0),
    rewardRedeemed: Boolean(weekly?.redeemedAt),
  };
}

export async function findCustomer(rawPhone: string) {
  const phone = normalizePhone(rawPhone);
  if (!phone) throw new Error("Enter a 10-digit mobile number.");
  const { db } = requireDb();
  const phoneSnap = await getDoc(doc(db, "phones", phone));
  if (!phoneSnap.exists()) return null;
  const customerId = String(phoneSnap.data().customerId ?? "");
  const customerSnap = await getDoc(doc(db, "customers", customerId));
  if (!customerSnap.exists()) return null;
  const weeklySnap = await getDoc(doc(db, "weeklyProgress", `${customerId}_${weekKey(Date.now())}`));
  return asCustomer(
    customerId,
    customerSnap.data() as Record<string, unknown>,
    weeklySnap.exists() ? (weeklySnap.data() as Record<string, unknown>) : undefined,
  );
}

export async function registerCustomer(rawPhone: string, name: string) {
  const phone = normalizePhone(rawPhone);
  const cleanName = name.trim();
  if (!phone) throw new Error("Enter a 10-digit mobile number.");
  if (!cleanName) throw new Error("Add the customer's name.");
  const { db, user } = requireDb();
  const existing = await findCustomer(phone);
  if (existing) return existing;
  const customerRef = doc(collection(db, "customers"));
  await runTransaction(db, async (tx) => {
    const phoneRef = doc(db, "phones", phone);
    const phoneSnap = await tx.get(phoneRef);
    if (phoneSnap.exists()) return;
    tx.set(phoneRef, { customerId: customerRef.id, phoneE164: phoneE164(phone) });
    tx.set(customerRef, {
      name: cleanName,
      phone,
      phoneE164: phoneE164(phone),
      lifetimeMinutes: 0,
      lifetimePoints: 0,
      bankedMinutes: 0,
      createdAt: serverTimestamp(),
      consentAt: serverTimestamp(),
      createdBy: user.uid,
    });
    tx.set(doc(collection(db, "auditLogs")), {
      type: "register",
      customerId: customerRef.id,
      phone,
      by: user.uid,
      at: serverTimestamp(),
    });
  });
  return findCustomer(phone);
}

export async function recordPaidSession(play: FinishedPlay) {
  const phone = normalizePhone(play.phone);
  if (!phone) return "No mobile number on this session, so no points were saved.";
  const { db, user } = requireDb();
  const slices = allocatePaidMinutes(play.startedAt, play.endedAt, play.bookedMinutes);
  const paidMinutes = slices.reduce((sum, slice) => sum + slice.minutes, 0);
  if (paidMinutes <= 0) return "No paid minutes on this session, so no points were saved.";
  const sessionRef = doc(db, "sessions", `${play.stationId}_${play.startedAt}`);

  const result = await runTransaction(db, async (tx) => {
    const existingSession = await tx.get(sessionRef);
    if (existingSession.exists()) {
      return { duplicate: true as const, points: 0, paidMinutes, weeklyPoints: 0, name: play.name, banked: 0 };
    }

    const phoneRef = doc(db, "phones", phone);
    const phoneSnap = await tx.get(phoneRef);
    const customerRef = phoneSnap.exists()
      ? doc(db, "customers", String(phoneSnap.data().customerId))
      : doc(collection(db, "customers"));
    const customerSnap = phoneSnap.exists() ? await tx.get(customerRef) : null;
    const previous = customerSnap?.exists() ? customerSnap.data() : null;
    const award = awardMinutes(Number(previous?.bankedMinutes ?? 0), slices);
    const name = String((previous?.name ?? play.name.trim()) || "Player");
    const weekReads = [];
    for (const slice of award.weeks) {
      const weekRef = doc(db, "weeklyProgress", `${customerRef.id}_${slice.weekId}`);
      weekReads.push({ slice, weekRef, weekSnap: await tx.get(weekRef) });
    }

    if (!phoneSnap.exists()) {
      tx.set(phoneRef, { customerId: customerRef.id, phoneE164: phoneE164(phone) });
      tx.set(customerRef, {
        name,
        phone,
        phoneE164: phoneE164(phone),
        lifetimeMinutes: paidMinutes,
        lifetimePoints: award.points,
        bankedMinutes: award.bankedMinutes,
        createdAt: serverTimestamp(),
        consentAt: serverTimestamp(),
        createdBy: user.uid,
      });
    } else {
      tx.update(customerRef, {
        name,
        lifetimeMinutes: Number(previous?.lifetimeMinutes ?? 0) + paidMinutes,
        lifetimePoints: Number(previous?.lifetimePoints ?? 0) + award.points,
        bankedMinutes: award.bankedMinutes,
      });
    }

    tx.set(sessionRef, {
      customerId: customerRef.id,
      name,
      phone,
      phoneE164: phoneE164(phone),
      stationId: play.stationId,
      stationName: play.stationName,
      startedAt: play.startedAt,
      endedAt: play.endedAt,
      bookedMinutes: play.bookedMinutes,
      paidMinutes,
      points: award.points,
      complimentary: false,
      by: user.uid,
    });

    let shownWeekly = 0;
    const endedWeek = weekKey(play.endedAt);
    for (const { slice, weekRef, weekSnap } of weekReads) {
      const prevPoints = Number(weekSnap.data()?.points ?? 0);
      const nextPoints = prevPoints + slice.points;
      if (slice.weekId === endedWeek) shownWeekly = nextPoints;
      tx.set(
        weekRef,
        {
          customerId: customerRef.id,
          phoneE164: phoneE164(phone),
          weekId: slice.weekId,
          minutes: Number(weekSnap.data()?.minutes ?? 0) + slice.minutes,
          points: nextPoints,
          rewardEligible: nextPoints >= WEEKLY_TARGET,
          redeemedAt: weekSnap.data()?.redeemedAt ?? null,
        },
        { merge: true },
      );
    }

    if (award.points > 0) {
      tx.set(doc(collection(db, "pointsLedger")), {
        customerId: customerRef.id,
        phoneE164: phoneE164(phone),
        sessionId: sessionRef.id,
        type: "earn",
        points: award.points,
        minutes: paidMinutes,
        at: serverTimestamp(),
        by: user.uid,
      });
    }

    return {
      duplicate: false as const,
      points: award.points,
      paidMinutes,
      weeklyPoints: shownWeekly,
      name,
      banked: award.bankedMinutes,
    };
  });

  if (result.duplicate) return "This session was already saved.";
  const toward = result.banked ?? 0;
  const weekly = result.weeklyPoints;
  const unlocked = weekly >= WEEKLY_TARGET;
  return `${result.name}: ${result.paidMinutes} paid min, +${result.points} point${result.points === 1 ? "" : "s"}. Week ${Math.min(weekly, WEEKLY_TARGET)}/${WEEKLY_TARGET}.${unlocked ? " Free 30 minutes is ready." : ""} ${toward} min toward the next point.`;
}

export async function redeemReward(customerId: string) {
  const { db, user } = requireDb();
  const weekId = weekKey(Date.now());
  const weekRef = doc(db, "weeklyProgress", `${customerId}_${weekId}`);
  await runTransaction(db, async (tx) => {
    const weekSnap = await tx.get(weekRef);
    const points = Number(weekSnap.data()?.points ?? 0);
    if (points < WEEKLY_TARGET) throw new Error(`Needs ${WEEKLY_TARGET} points this week. Currently ${points}.`);
    if (weekSnap.data()?.redeemedAt) throw new Error("This week's free 30 minutes is already used.");
    tx.update(weekRef, { redeemedAt: Date.now(), redeemedBy: user.uid });
    tx.set(doc(collection(db, "pointsLedger")), {
      customerId,
      phoneE164: weekSnap.data()?.phoneE164 ?? "",
      type: "redeem",
      points: 0,
      minutes: 30,
      weekId,
      at: serverTimestamp(),
      by: user.uid,
    });
    tx.set(doc(collection(db, "auditLogs")), {
      type: "redeem",
      customerId,
      weekId,
      by: user.uid,
      at: serverTimestamp(),
    });
  });
}

export async function staffProfile(uid: string) {
  const services = firebaseServices();
  if (!services) return null;
  try {
    const snap = await getDoc(doc(services.db, "staff", uid));
    if (!snap.exists()) return null;
    return { role: String(snap.data().role ?? "staff"), name: String(snap.data().name ?? "") };
  } catch {
    return null;
  }
}

export async function loadAnalytics() {
  const { db } = requireDb();
  const playersSnap = await getDocs(query(collection(db, "customers"), orderBy("lifetimePoints", "desc"), limit(100)));
  const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const monthStart = istMonthStart(Date.now());
  const sessionsSnap = await getDocs(query(collection(db, "sessions"), where("endedAt", ">=", since), limit(300)));
  const redeemedSnap = await getDocs(
    query(collection(db, "weeklyProgress"), where("redeemedAt", ">=", monthStart), limit(100)),
  );
  const players = playersSnap.docs.map((item) => asCustomer(item.id, item.data() as Record<string, unknown>));
  const sessions = sessionsSnap.docs.map(
    (item) => item.data() as { stationId?: string; paidMinutes?: number; endedAt?: number; points?: number; phone?: string },
  );
  const byStation = new Map<string, number>();
  const phones = new Set<string>();
  const hours = Array.from({ length: 24 }, () => 0);
  let minutes = 0;
  let points = 0;
  for (const session of sessions) {
    minutes += Number(session.paidMinutes ?? 0);
    points += Number(session.points ?? 0);
    if (session.phone) phones.add(String(session.phone));
    const station = String(session.stationId ?? "?");
    byStation.set(station, (byStation.get(station) ?? 0) + 1);
    if (typeof session.endedAt === "number") hours[istHour(session.endedAt)] += 1;
  }
  return {
    players: players.slice(0, 8),
    registered: playersSnap.size,
    activePlayers: phones.size,
    weekMinutes: minutes,
    weekPoints: points,
    redemptions: redeemedSnap.size,
    hours,
    stations: [...byStation.entries()].sort((a, b) => a[0].localeCompare(b[0])),
  };
}
