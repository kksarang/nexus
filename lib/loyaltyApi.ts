import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteField,
  where,
} from "firebase/firestore";
import { parseAccess, type AccessMap } from "@/lib/deskAccess";
import { firebaseServices } from "@/lib/firebaseClient";
import {
  REWARD_MINUTES,
  WEEKLY_TARGET,
  awardMinutes,
  clockMinutes,
  earningSlices,
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
  const phone = normalizePhone(play.phone);
  const payment = paymentOf(play);
  const record = {
    name: play.name.trim() || "Player",
    phone,
    stationId: play.stationId,
    stationName: play.stationName,
    startedAt: play.startedAt,
    endedAt: play.endedAt,
    bookedMinutes: play.bookedMinutes,
    paidMinutes,
    points: 0,
    amountRupees: payment.amountRupees,
    paymentRecorded: payment.paymentRecorded,
    status: "completed",
    complimentary: !phone,
    by: user.uid,
  };
  if (existing.exists()) await updateDoc(sessionRef, record);
  else await setDoc(sessionRef, record);
  const staff = await getDoc(doc(db, "staff", user.uid)).catch(() => null);
  await setDoc(doc(collection(db, "auditLogs")), {
    type: "session-end",
    sessionId: sessionRef.id,
    after: {
      name: play.name.trim() || "Player",
      stationName: play.stationName,
      paidMinutes,
      amountRupees: payment.amountRupees,
    },
    by: user.uid,
    byName: String(staff?.data()?.name ?? ""),
    at: serverTimestamp(),
  });
  if (!phone || payment.amountRupees <= 0) return;
  const phoneSnap = await getDoc(doc(db, "phones", phone));
  if (!phoneSnap.exists()) return;
  const customerRef = doc(db, "customers", String(phoneSnap.data().customerId ?? ""));
  const customerSnap = await getDoc(customerRef);
  if (!customerSnap.exists()) return;
  await updateDoc(customerRef, {
    lifetimeRupees: Number(customerSnap.data().lifetimeRupees ?? 0) + payment.amountRupees,
  });
}

export type LiveTimer = {
  stationId: string;
  name: string;
  phone: string;
  note: string;
  players: number;
  planMinutes: number;
  startedAt: number;
  endsAt: number;
  extraMinutes: number;
  member: boolean;
  reward: boolean;
};

function asLiveTimer(data: Record<string, unknown>): LiveTimer | null {
  const stationId = String(data.stationId ?? "");
  const startedAt = Number(data.startedAt ?? 0);
  if (!stationId || !startedAt || String(data.status ?? "") !== "active") return null;
  const extraMinutes = Math.max(0, Math.round(Number(data.extraMinutes ?? 0)));
  const bookedMinutes = Math.max(0, Math.round(Number(data.bookedMinutes ?? 0)));
  const planMinutes = Math.max(0, Math.round(Number(data.planMinutes ?? bookedMinutes - extraMinutes)));
  const endsAt = Number(data.endsAt ?? 0) || startedAt + (planMinutes + extraMinutes) * 60 * 1000;
  return {
    stationId,
    name: String(data.name ?? "Player"),
    phone: String(data.phone ?? ""),
    note: String(data.note ?? ""),
    players: Math.max(1, Math.round(Number(data.players ?? 2))),
    planMinutes,
    startedAt,
    endsAt,
    extraMinutes,
    member: data.member === true,
    reward: data.reward === true,
  };
}

export function subscribeActiveSessions(onChange: (sessions: LiveTimer[]) => void, onError: () => void) {
  const services = firebaseServices();
  if (!services) {
    onError();
    return () => undefined;
  }
  return onSnapshot(
    query(collection(services.db, "sessions"), where("status", "==", "active"), limit(30)),
    (snap) => {
      const rows: LiveTimer[] = [];
      snap.forEach((item) => {
        const row = asLiveTimer(item.data() as Record<string, unknown>);
        if (row) rows.push(row);
      });
      onChange(rows);
    },
    () => onError(),
  );
}

export async function openLiveSession(play: {
  stationId: string;
  stationName: string;
  name: string;
  phone: string;
  startedAt: number;
  bookedMinutes: number;
  planMinutes?: number;
  players?: number;
  note?: string;
  member?: boolean;
  reward?: boolean;
}) {
  const services = firebaseServices();
  const user = services?.auth.currentUser;
  if (!services || !user) throw new Error("Sign in as staff before starting a session.");
  const phone = normalizePhone(play.phone);
  const reward = play.reward === true;
  const planMinutes = reward ? REWARD_MINUTES : Math.max(0, Math.round(play.planMinutes ?? play.bookedMinutes));
  const sessionId = `${play.stationId}_${play.startedAt}`;
  const record = {
    status: "active",
    name: play.name.trim() || "Player",
    phone,
    phoneE164: phone ? phoneE164(phone) : "",
    stationId: play.stationId,
    stationName: play.stationName,
    startedAt: play.startedAt,
    endedAt: play.startedAt,
    endsAt: play.startedAt + planMinutes * 60 * 1000,
    bookedMinutes: planMinutes,
    planMinutes,
    extraMinutes: 0,
    players: Math.max(1, Math.round(play.players ?? 2)),
    note: (play.note ?? "").slice(0, 120),
    member: reward ? false : Boolean(play.member),
    reward,
    paidMinutes: 0,
    points: 0,
    amountRupees: 0,
    paymentRecorded: false,
    complimentary: false,
    by: user.uid,
  };
  if (!reward) {
    await setDoc(doc(services.db, "sessions", sessionId), record);
  } else {
    if (!phone) throw new Error("Add a mobile number before using the free 30 minutes.");
    await runTransaction(services.db, async (tx) => {
      const phoneSnap = await tx.get(doc(services.db, "phones", phone));
      if (!phoneSnap.exists()) throw new Error("Register this mobile number before using the free 30 minutes.");
      const customerId = String(phoneSnap.data().customerId ?? "");
      const weekId = weekKey(play.startedAt);
      const weekRef = doc(services.db, "weeklyProgress", `${customerId}_${weekId}`);
      const weekSnap = await tx.get(weekRef);
      const points = Number(weekSnap.data()?.points ?? 0);
      if (points < WEEKLY_TARGET) throw new Error(`Needs ${WEEKLY_TARGET} points this week before the free 30 minutes. Currently ${points}.`);
      if (weekSnap.data()?.redeemedAt) throw new Error("This week's free 30 minutes is already used.");
      const held = String(weekSnap.data()?.rewardSessionId ?? "");
      if (held && held !== sessionId) {
        const heldSnap = await tx.get(doc(services.db, "sessions", held));
        if (heldSnap.exists() && String(heldSnap.data()?.status ?? "") === "active") {
          throw new Error("The free 30 minutes is already running on another console.");
        }
      }
      tx.set(doc(services.db, "sessions", sessionId), record);
      tx.set(weekRef, { customerId, weekId, rewardSessionId: sessionId }, { merge: true });
    });
  }
  const staff = await getDoc(doc(services.db, "staff", user.uid)).catch(() => null);
  await setDoc(doc(collection(services.db, "auditLogs")), {
    type: "session-start",
    sessionId: `${play.stationId}_${play.startedAt}`,
    after: { name: play.name.trim() || "Player", stationName: play.stationName, bookedMinutes: planMinutes, reward },
    by: user.uid,
    byName: String(staff?.data()?.name ?? ""),
    at: serverTimestamp(),
  });
}

export async function extendLiveSession(play: {
  stationId: string;
  startedAt: number;
  endsAt: number;
  bookedMinutes: number;
  extraMinutes: number;
}) {
  const services = firebaseServices();
  const user = services?.auth.currentUser;
  if (!services || !user) return;
  await updateDoc(doc(services.db, "sessions", `${play.stationId}_${play.startedAt}`), {
    endsAt: play.endsAt,
    bookedMinutes: Math.round(play.bookedMinutes),
    extraMinutes: Math.round(play.extraMinutes),
  });
  const staff = await getDoc(doc(services.db, "staff", user.uid)).catch(() => null);
  await setDoc(doc(collection(services.db, "auditLogs")), {
    type: "session-extend",
    sessionId: `${play.stationId}_${play.startedAt}`,
    after: { extraMinutes: Math.round(play.extraMinutes), bookedMinutes: Math.round(play.bookedMinutes) },
    by: user.uid,
    byName: String(staff?.data()?.name ?? ""),
    at: serverTimestamp(),
  });
}

export async function recordPaidSession(play: FinishedPlay) {
  const phone = normalizePhone(play.phone);
  const clock = clockMinutes(play.startedAt, play.endedAt);
  if (!phone) {
    await closeWithoutPoints(play, clock);
    return "No mobile number on this session, so no points were saved.";
  }
  const previewPaid = earningSlices(play.startedAt, play.endedAt, false).reduce((sum, slice) => sum + slice.minutes, 0);
  if (!play.reward && previewPaid <= 0) {
    await closeWithoutPoints(play, previewPaid);
    return "No paid minutes on this session, so no points were saved.";
  }
  const { db, user } = requireDb();
  const staff = await getDoc(doc(db, "staff", user.uid)).catch(() => null);
  const byName = String(staff?.data()?.name ?? "");
  const sessionRef = doc(db, "sessions", `${play.stationId}_${play.startedAt}`);

  const result = await runTransaction(db, async (tx) => {
    const existingSession = await tx.get(sessionRef);
    const previousStatus = String(existingSession.data()?.status ?? "");
    const previousPaid = Number(existingSession.data()?.paidMinutes ?? 0);
    const alreadyClosed = existingSession.exists() && (previousStatus === "completed" || (previousStatus !== "active" && previousPaid > 0));
    if (alreadyClosed) {
      return { duplicate: true as const, points: 0, paidMinutes: previousPaid, weeklyPoints: 0, name: play.name, banked: 0, rewardApplied: false, rewardOpen: false };
    }

    const phoneRef = doc(db, "phones", phone);
    const phoneSnap = await tx.get(phoneRef);
    const customerRef = phoneSnap.exists()
      ? doc(db, "customers", String(phoneSnap.data().customerId))
      : doc(collection(db, "customers"));
    const customerSnap = phoneSnap.exists() ? await tx.get(customerRef) : null;
    const previous = customerSnap?.exists() ? customerSnap.data() : null;
    const rewardWeekId = weekKey(play.startedAt);
    const rewardWeekRef = doc(db, "weeklyProgress", `${customerRef.id}_${rewardWeekId}`);
    const rewardWeekSnap = play.reward ? await tx.get(rewardWeekRef) : null;
    const heldReward = String(rewardWeekSnap?.data()?.rewardSessionId ?? "");
    const rewardApplied = Boolean(
      play.reward
      && rewardWeekSnap?.exists()
      && Number(rewardWeekSnap.data()?.points ?? 0) >= WEEKLY_TARGET
      && !rewardWeekSnap.data()?.redeemedAt
      && (!heldReward || heldReward === sessionRef.id),
    );
    const slices = earningSlices(play.startedAt, play.endedAt, rewardApplied);
    const paidMinutes = slices.reduce((sum, slice) => sum + slice.minutes, 0);
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
      complimentary: rewardApplied && payment.amountRupees === 0,
      reward: rewardApplied,
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
        lifetimeRupees: payment.amountRupees,
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
        lifetimeRupees: Number(previous?.lifetimeRupees ?? 0) + payment.amountRupees,
        bankedMinutes: award.bankedMinutes,
        sessionCount: Number(previous?.sessionCount ?? 0) + 1,
        lastPlayedAt: play.endedAt,
      });
    }

    if (existingSession.exists()) tx.update(sessionRef, sessionRecord);
    else tx.set(sessionRef, sessionRecord);

    let shownWeekly = Number(rewardWeekSnap?.data()?.points ?? 0);
    let rewardOpen = false;
    const endedWeek = weekKey(play.endedAt);
    let rewardWeekWritten = false;
    const releaseHold = Boolean(play.reward && !rewardApplied && heldReward === sessionRef.id);
    for (const { slice, weekRef, weekSnap } of weekReads) {
      const prevPoints = Number(weekSnap.data()?.points ?? 0);
      const nextPoints = prevPoints + slice.points;
      const redeeming = rewardApplied && slice.weekId === rewardWeekId;
      const clearing = releaseHold && slice.weekId === rewardWeekId;
      if (slice.weekId === endedWeek) {
        shownWeekly = nextPoints;
        rewardOpen = nextPoints >= WEEKLY_TARGET && !weekSnap.data()?.redeemedAt && !redeeming;
      }
      if (slice.weekId === rewardWeekId && rewardApplied) shownWeekly = nextPoints;
      if (redeeming || clearing) rewardWeekWritten = true;
      tx.set(
        weekRef,
        {
          customerId: customerRef.id,
          phoneE164: phoneE164(phone),
          weekId: slice.weekId,
          minutes: Number(weekSnap.data()?.minutes ?? 0) + slice.minutes,
          points: nextPoints,
          rewardEligible: nextPoints >= WEEKLY_TARGET && !(redeeming || weekSnap.data()?.redeemedAt),
          redeemedAt: redeeming ? Date.now() : (weekSnap.data()?.redeemedAt ?? null),
          ...(redeeming ? { redeemedBy: user.uid, rewardSessionId: deleteField() } : {}),
          ...(clearing ? { rewardSessionId: deleteField() } : {}),
        },
        { merge: true },
      );
    }
    if (rewardApplied && !rewardWeekWritten) {
      tx.set(rewardWeekRef, { redeemedAt: Date.now(), redeemedBy: user.uid, rewardSessionId: deleteField(), rewardEligible: false }, { merge: true });
    } else if (releaseHold && !rewardWeekWritten) {
      tx.update(rewardWeekRef, { rewardSessionId: deleteField() });
    }

    tx.set(doc(collection(db, "auditLogs")), {
      type: "session-end",
      sessionId: sessionRef.id,
      after: { name, stationName: play.stationName, paidMinutes, amountRupees: payment.amountRupees, points: award.points, reward: rewardApplied },
      by: user.uid,
      byName,
      at: serverTimestamp(),
    });

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
      rewardApplied,
      rewardOpen,
    };
  });

  if (result.duplicate) return "This session was already saved.";
  const toward = result.banked ?? 0;
  const weekly = result.weeklyPoints;
  const pointText = `+${result.points} point${result.points === 1 ? "" : "s"}. ${toward} min toward the next point.`;
  if (result.rewardApplied) {
    return `${result.name}: free ${REWARD_MINUTES} minutes used for this week. ${result.paidMinutes} min after that, ${pointText} Week total ${weekly}.`;
  }
  if (play.reward) {
    return `${result.name}: the free 30 minutes was not available, so the full visit counted. ${result.paidMinutes} paid min, ${pointText} Week total ${weekly}.`;
  }
  return `${result.name}: ${result.paidMinutes} paid min, ${pointText} Week ${weekly}.${result.rewardOpen ? " Free 30 minutes is ready." : ""}`;
}

export type StaffLookup =
  | { ok: true; role: string; name: string; username: string; access: AccessMap }
  | { ok: false; reason: "missing" | "blocked" | "timeout" | "unavailable" };

export async function staffProfile(uid: string): Promise<StaffLookup> {
  const services = firebaseServices();
  if (!services) return { ok: false, reason: "unavailable" };
  const read = async (): Promise<StaffLookup> => {
    const user = services.auth.currentUser;
    if (user) await user.getIdToken();
    const snap = await getDocFromServer(doc(services.db, "staff", uid));
    if (!snap.exists()) return { ok: false, reason: "missing" };
    const data = snap.data();
    const role = String(data.role ?? "admin") === "office" ? "office" : "admin";
    return {
      ok: true,
      role,
      name: String(data.name ?? ""),
      username: String(data.username ?? ""),
      access: parseAccess(role, data.access),
    };
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
