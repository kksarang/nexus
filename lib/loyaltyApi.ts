import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { firebaseServices } from "@/lib/firebaseClient";
import {
  WEEKLY_TARGET,
  allocatePaidMinutes,
  awardMinutes,
  istDayStart,
  istMonthStart,
  istYearStart,
  weekStartMonday,
  normalizePhone,
  phoneE164,
  weekKey,
  type FinishedPlay,
} from "@/lib/loyalty";

export type { FinishedPlay };

function paymentOf(play: FinishedPlay) {
  const amount = play.collectedRupees ?? 0;
  if (Number.isInteger(amount) && amount > 0) return { amountRupees: amount, paymentRecorded: true };
  return { amountRupees: 0, paymentRecorded: false };
}

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

async function closeWithoutPoints(play: FinishedPlay, paidMinutes: number) {
  const { db, user } = requireDb();
  const sessionRef = doc(db, "sessions", `${play.stationId}_${play.startedAt}`);
  const existing = await getDoc(sessionRef);
  const status = String(existing.data()?.status ?? "");
  const previousPaid = Number(existing.data()?.paidMinutes ?? 0);
  if (existing.exists() && (status === "completed" || (status !== "active" && previousPaid > 0))) return;
  const record = {
    name: play.name.trim() || "Player",
    phone: normalizePhone(play.phone),
    stationId: play.stationId,
    stationName: play.stationName,
    startedAt: play.startedAt,
    endedAt: play.endedAt,
    bookedMinutes: play.bookedMinutes,
    paidMinutes,
    points: 0,
    amountRupees: paymentOf(play).amountRupees,
    paymentRecorded: paymentOf(play).paymentRecorded,
    status: "completed",
    complimentary: !normalizePhone(play.phone),
    by: user.uid,
  };
  if (existing.exists()) await updateDoc(sessionRef, record);
  else await setDoc(sessionRef, record);
}

export async function openLiveSession(play: {
  stationId: string;
  stationName: string;
  name: string;
  phone: string;
  startedAt: number;
  bookedMinutes: number;
}) {
  const services = firebaseServices();
  const user = services?.auth.currentUser;
  if (!services || !user) return;
  const phone = normalizePhone(play.phone);
  await setDoc(doc(services.db, "sessions", `${play.stationId}_${play.startedAt}`), {
    status: "active",
    name: play.name.trim() || "Player",
    phone,
    phoneE164: phone ? phoneE164(phone) : "",
    stationId: play.stationId,
    stationName: play.stationName,
    startedAt: play.startedAt,
    endedAt: play.startedAt,
    bookedMinutes: play.bookedMinutes,
    paidMinutes: 0,
    points: 0,
    amountRupees: 0,
    paymentRecorded: false,
    complimentary: false,
    by: user.uid,
  });
}

export async function recordPaidSession(play: FinishedPlay) {
  const phone = normalizePhone(play.phone);
  const slices = allocatePaidMinutes(play.startedAt, play.endedAt, play.bookedMinutes);
  const paidMinutes = slices.reduce((sum, slice) => sum + slice.minutes, 0);
  if (!phone || paidMinutes <= 0) {
    await closeWithoutPoints(play, paidMinutes);
    return phone ? "No paid minutes on this session, so no points were saved." : "No mobile number on this session, so no points were saved.";
  }
  const { db, user } = requireDb();
  const sessionRef = doc(db, "sessions", `${play.stationId}_${play.startedAt}`);

  const result = await runTransaction(db, async (tx) => {
    const existingSession = await tx.get(sessionRef);
    const previousStatus = String(existingSession.data()?.status ?? "");
    const previousPaid = Number(existingSession.data()?.paidMinutes ?? 0);
    const alreadyClosed = existingSession.exists() && (previousStatus === "completed" || (previousStatus !== "active" && previousPaid > 0));
    if (alreadyClosed) {
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
    const payment = paymentOf(play);
    const sessionRecord = {
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
      amountRupees: payment.amountRupees,
      paymentRecorded: payment.paymentRecorded,
      status: "completed",
      complimentary: false,
      by: user.uid,
    };
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
        sessionCount: 1,
        lastPlayedAt: play.endedAt,
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
        sessionCount: Number(previous?.sessionCount ?? 0) + 1,
        lastPlayedAt: play.endedAt,
      });
    }

    if (existingSession.exists()) tx.update(sessionRef, sessionRecord);
    else tx.set(sessionRef, sessionRecord);

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
        balanceAfter: Number(previous?.lifetimePoints ?? 0) + award.points,
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

export type StaffLookup =
  | { ok: true; role: string; name: string }
  | { ok: false; reason: "missing" | "blocked" | "timeout" | "unavailable" };

export async function staffProfile(uid: string): Promise<StaffLookup> {
  const services = firebaseServices();
  if (!services) return { ok: false, reason: "unavailable" };
  const read = async (): Promise<StaffLookup> => {
    const user = services.auth.currentUser;
    if (user) await user.getIdToken();
    const snap = await getDocFromServer(doc(services.db, "staff", uid));
    if (!snap.exists()) return { ok: false, reason: "missing" };
    return { ok: true, role: String(snap.data().role ?? "staff"), name: String(snap.data().name ?? "") };
  };
  const reading = read()
    .catch((reason: unknown) => {
      const code = typeof reason === "object" && reason && "code" in reason ? String((reason as { code: string }).code) : "";
      if (code === "not-found") return { ok: false, reason: "missing" } as const;
      return { ok: false, reason: "blocked" } as const;
    });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<StaffLookup>((resolve) => {
    timer = setTimeout(() => resolve({ ok: false, reason: "timeout" }), 12000);
  });
  const result = await Promise.race([reading, timeout]);
  if (timer) clearTimeout(timer);
  return result;
}

export type PlayRecord = {
  id: string;
  customerId: string;
  name: string;
  phone: string;
  stationId: string;
  stationName: string;
  endedAt: number;
  paidMinutes: number;
  points: number;
};

export type PlayerLedger = {
  id: string;
  name: string;
  phone: string;
  lifetimeMinutes: number;
  lifetimePoints: number;
  todayMinutes: number;
  todayPoints: number;
  weekMinutes: number;
  weekPoints: number;
  monthMinutes: number;
  monthPoints: number;
  yearMinutes: number;
  yearPoints: number;
  sessions: number;
};

export type PeriodSummary = {
  key: "today" | "week" | "month" | "year" | "all";
  label: string;
  players: number;
  sessions: number;
  minutes: number;
  points: number;
};

const emptyPlayer = (id: string, name: string, phone: string): PlayerLedger => ({
  id,
  name,
  phone,
  lifetimeMinutes: 0,
  lifetimePoints: 0,
  todayMinutes: 0,
  todayPoints: 0,
  weekMinutes: 0,
  weekPoints: 0,
  monthMinutes: 0,
  monthPoints: 0,
  yearMinutes: 0,
  yearPoints: 0,
  sessions: 0,
});

export async function loadAnalytics() {
  const { db } = requireDb();
  const now = Date.now();
  const todayStart = istDayStart(now);
  const weekStart = weekStartMonday(now);
  const monthStart = istMonthStart(now);
  const yearStart = istYearStart(now);
  const playersSnap = await getDocs(query(collection(db, "customers"), orderBy("lifetimePoints", "desc"), limit(500)));
  const sessionsSnap = await getDocs(
    query(collection(db, "sessions"), where("endedAt", ">=", yearStart), orderBy("endedAt", "desc"), limit(1000)),
  );
  const redeemedSnap = await getDocs(
    query(collection(db, "weeklyProgress"), where("redeemedAt", ">=", monthStart), limit(200)),
  );

  const players = new Map<string, PlayerLedger>();
  for (const item of playersSnap.docs) {
    const data = item.data() as Record<string, unknown>;
    const row = emptyPlayer(item.id, String(data.name ?? "Player"), String(data.phone ?? ""));
    row.lifetimeMinutes = Number(data.lifetimeMinutes ?? 0);
    row.lifetimePoints = Number(data.lifetimePoints ?? 0);
    players.set(item.id, row);
  }

  const sessions: PlayRecord[] = sessionsSnap.docs.map((item) => {
    const data = item.data() as Record<string, unknown>;
    return {
      id: item.id,
      customerId: String(data.customerId ?? ""),
      name: String(data.name ?? "Player"),
      phone: String(data.phone ?? ""),
      stationId: String(data.stationId ?? ""),
      stationName: String(data.stationName ?? data.stationId ?? ""),
      endedAt: Number(data.endedAt ?? 0),
      paidMinutes: Number(data.paidMinutes ?? 0),
      points: Number(data.points ?? 0),
    };
  });

  for (const session of sessions) {
    const row = players.get(session.customerId) ?? emptyPlayer(session.customerId || session.id, session.name, session.phone);
    if (!players.has(row.id)) players.set(row.id, row);
    row.sessions += 1;
    row.yearMinutes += session.paidMinutes;
    row.yearPoints += session.points;
    if (session.endedAt >= monthStart) {
      row.monthMinutes += session.paidMinutes;
      row.monthPoints += session.points;
    }
    if (session.endedAt >= weekStart) {
      row.weekMinutes += session.paidMinutes;
      row.weekPoints += session.points;
    }
    if (session.endedAt >= todayStart) {
      row.todayMinutes += session.paidMinutes;
      row.todayPoints += session.points;
    }
  }

  const list = [...players.values()].sort((a, b) => b.lifetimePoints - a.lifetimePoints || a.name.localeCompare(b.name));
  const tally = (
    pick: (player: PlayerLedger) => boolean,
    minutes: (player: PlayerLedger) => number,
    points: (player: PlayerLedger) => number,
  ) => {
    const active = list.filter(pick);
    return {
      players: active.length,
      minutes: active.reduce((total, player) => total + minutes(player), 0),
      points: active.reduce((total, player) => total + points(player), 0),
    };
  };
  const today = tally((player) => player.todayMinutes > 0, (player) => player.todayMinutes, (player) => player.todayPoints);
  const week = tally((player) => player.weekMinutes > 0, (player) => player.weekMinutes, (player) => player.weekPoints);
  const month = tally((player) => player.monthMinutes > 0, (player) => player.monthMinutes, (player) => player.monthPoints);
  const year = tally((player) => player.yearMinutes > 0, (player) => player.yearMinutes, (player) => player.yearPoints);

  const periods: PeriodSummary[] = [
    { key: "today", label: "Today", sessions: sessions.filter((session) => session.endedAt >= todayStart).length, ...today },
    { key: "week", label: "This week", sessions: sessions.filter((session) => session.endedAt >= weekStart).length, ...week },
    { key: "month", label: "This month", sessions: sessions.filter((session) => session.endedAt >= monthStart).length, ...month },
    { key: "year", label: "This year", sessions: sessions.filter((session) => session.endedAt >= yearStart).length, ...year },
    {
      key: "all",
      label: "All time",
      players: list.length,
      sessions: sessions.length,
      minutes: list.reduce((total, player) => total + player.lifetimeMinutes, 0),
      points: list.reduce((total, player) => total + player.lifetimePoints, 0),
    },
  ];

  return {
    players: list,
    sessions,
    periods,
    redemptions: redeemedSnap.size,
    capped: sessionsSnap.size >= 1000,
  };
}
