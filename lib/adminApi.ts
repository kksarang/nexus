import { collection, doc, getDoc, getDocs, limit, orderBy, query, runTransaction, serverTimestamp, where } from "firebase/firestore";
import {
  buildPlayers,
  recordedPayment,
  type OpsPlayer,
  type OpsSession,
  type WeekRow,
} from "@/lib/adminStats";
import { firebaseServices } from "@/lib/firebaseClient";
import { istYearStart, millisOf, normalizePhone, phoneE164, weekKey } from "@/lib/loyalty";
function requireDb() {
  const services = firebaseServices();
  if (!services) throw new Error("Add the Firebase web app keys in .env.local, then restart the site.");
  const user = services.auth.currentUser;
  if (!user) throw new Error("Sign in as staff before opening the admin desk.");
  return { ...services, user };
}

function asSession(id: string, data: Record<string, unknown>): OpsSession {
  const startedAt = Number(data.startedAt ?? 0);
  const endedAt = Number(data.endedAt ?? startedAt);
  const paidMinutes = Number(data.paidMinutes ?? 0);
  const rawStatus = String(data.status ?? "");
  const status =
    rawStatus === "active" || rawStatus === "completed" || rawStatus === "cancelled"
      ? rawStatus
      : paidMinutes > 0 || endedAt > startedAt
        ? "completed"
        : "active";
  const money = recordedPayment(data.paymentRecorded, Number(data.amountRupees ?? 0));
  return {
    id,
    customerId: String(data.customerId ?? ""),
    name: String(data.name ?? "Player"),
    phone: String(data.phone ?? ""),
    stationId: String(data.stationId ?? ""),
    stationName: String(data.stationName ?? data.stationId ?? ""),
    startedAt,
    endedAt,
    bookedMinutes: Number(data.bookedMinutes ?? 0),
    paidMinutes,
    points: Number(data.points ?? 0),
    amountRupees: money.amountRupees,
    amountRecorded: money.amountRecorded,
    status,
    by: String(data.by ?? ""),
  };
}

export type DeskData = {
  players: OpsPlayer[];
  sessions: OpsSession[];
  active: OpsSession[];
  weeks: WeekRow[];
  unavailable: string[];
  capped: boolean;
};

export async function loadOperations(from: number, to: number): Promise<DeskData> {
  const { db } = requireDb();
  const now = Date.now();
  const fetchFrom = Math.min(from, istYearStart(now));
  const fetchTo = Math.max(to, now);
  const [customersSnap, sessionsSnap, activeSnap, weeksSnap, stationSnap] = await Promise.all([
    getDocs(query(collection(db, "customers"), orderBy("lifetimePoints", "desc"), limit(500))),
    getDocs(query(collection(db, "sessions"), where("endedAt", ">=", fetchFrom), where("endedAt", "<=", fetchTo), orderBy("endedAt", "desc"), limit(2000))),
    getDocs(query(collection(db, "sessions"), where("status", "==", "active"), limit(30))),
    getDocs(query(collection(db, "weeklyProgress"), limit(500))),
    getDocs(collection(db, "stations")),
  ]);

  const sessions = new Map<string, OpsSession>();
  for (const item of sessionsSnap.docs) sessions.set(item.id, asSession(item.id, item.data() as Record<string, unknown>));
  for (const item of activeSnap.docs) sessions.set(item.id, asSession(item.id, item.data() as Record<string, unknown>));

  const rewards = new Map<string, number>();
  const currentWeek = weekKey(Date.now());
  const weeks: WeekRow[] = [];
  for (const item of weeksSnap.docs) {
    const data = item.data() as Record<string, unknown>;
    const customerId = String(data.customerId ?? "");
    if (data.redeemedAt) rewards.set(customerId, (rewards.get(customerId) ?? 0) + 1);
    if (data.weekId === currentWeek) {
      weeks.push({
        customerId,
        points: Number(data.points ?? 0),
        minutes: Number(data.minutes ?? 0),
        redeemedAt: millisOf(data.redeemedAt),
      });
    }
  }

  const base: OpsPlayer[] = customersSnap.docs.map((item) => {
    const data = item.data() as Record<string, unknown>;
    const week = weeks.find((row) => row.customerId === item.id);
    return {
      id: item.id,
      name: String(data.name ?? "Player"),
      phone: String(data.phone ?? ""),
      createdAt: millisOf(data.createdAt),
      lifetimeMinutes: Number(data.lifetimeMinutes ?? 0),
      lifetimePoints: Number(data.lifetimePoints ?? 0),
      bankedMinutes: Number(data.bankedMinutes ?? 0),
      sessionCount: Number(data.sessionCount ?? 0),
      rewardsRedeemed: rewards.get(item.id) ?? 0,
      lastPlayedAt: Number(data.lastPlayedAt ?? 0),
      todayPoints: 0,
      weekPoints: 0,
      monthPoints: 0,
      yearPoints: 0,
      weekMinutes: 0,
      rewardReady: Boolean(week && week.points >= 10 && !week.redeemedAt),
    };
  });

  const list = [...sessions.values()];
  for (const player of base) {
    if (!player.sessionCount) {
      player.sessionCount = list.filter((session) => session.customerId === player.id && session.status === "completed").length;
    }
  }

  const players = buildPlayers(base, list);
  for (const player of players) {
    const week = weeks.find((row) => row.customerId === player.id);
    if (!week) continue;
    player.weekPoints = week.points;
    player.weekMinutes = week.minutes;
  }

  return {
    players,
    sessions: list,
    active: list.filter((session) => session.status === "active"),
    weeks,
    unavailable: stationSnap.docs.filter((item) => item.data().status === "unavailable").map((item) => item.id),
    capped: sessionsSnap.size >= 2000,
  };
}

export type PlayerDetail = {
  player: OpsPlayer;
  sessions: OpsSession[];
  ledger: { id: string; at: number; type: string; points: number; reason: string; sessionId: string; balanceAfter: number | null; by: string }[];
};

export async function loadPlayerDetail(playerId: string): Promise<PlayerDetail> {
  const { db } = requireDb();
  const customerSnap = await getDoc(doc(db, "customers", playerId));
  if (!customerSnap.exists()) throw new Error("That player was not found.");
  const data = customerSnap.data() as Record<string, unknown>;
  const [sessionsSnap, ledgerSnap, weeksSnap] = await Promise.all([
    getDocs(query(collection(db, "sessions"), where("customerId", "==", playerId), limit(200))),
    getDocs(query(collection(db, "pointsLedger"), where("customerId", "==", playerId), limit(200))),
    getDocs(query(collection(db, "weeklyProgress"), where("customerId", "==", playerId), limit(100))),
  ]);
  const sessions = sessionsSnap.docs
    .map((item) => asSession(item.id, item.data() as Record<string, unknown>))
    .sort((a, b) => b.startedAt - a.startedAt);
  const rewards = weeksSnap.docs.filter((item) => item.data().redeemedAt).length;
  const week = weeksSnap.docs.find((item) => item.data().weekId === weekKey(Date.now()));
  const player = buildPlayers(
    [
      {
        id: playerId,
        name: String(data.name ?? "Player"),
        phone: String(data.phone ?? ""),
        createdAt: millisOf(data.createdAt),
        lifetimeMinutes: Number(data.lifetimeMinutes ?? 0),
        lifetimePoints: Number(data.lifetimePoints ?? 0),
        bankedMinutes: Number(data.bankedMinutes ?? 0),
        sessionCount: Number(data.sessionCount ?? sessions.filter((session) => session.status === "completed").length),
        rewardsRedeemed: rewards,
        lastPlayedAt: Number(data.lastPlayedAt ?? 0),
        todayPoints: 0,
        weekPoints: 0,
        monthPoints: 0,
        yearPoints: 0,
        weekMinutes: 0,
        rewardReady: Boolean(week && Number(week.data().points ?? 0) >= 10 && !week.data().redeemedAt),
      },
    ],
    sessions,
  )[0];
  if (week) {
    player.weekPoints = Number(week.data().points ?? 0);
    player.weekMinutes = Number(week.data().minutes ?? 0);
  }
  const ledger = ledgerSnap.docs
    .map((item) => {
      const row = item.data() as Record<string, unknown>;
      return {
        id: item.id,
        at: millisOf(row.at),
        type: String(row.type ?? ""),
        points: Number(row.points ?? 0),
        reason: String(row.reason ?? row.type ?? ""),
        sessionId: String(row.sessionId ?? row.weekId ?? ""),
        balanceAfter: row.balanceAfter == null ? null : Number(row.balanceAfter),
        by: String(row.by ?? ""),
      };
    })
    .sort((a, b) => b.at - a.at);
  return { player, sessions, ledger };
}

export async function renamePlayer(playerId: string, name: string) {
  const clean = name.trim();
  if (!clean) throw new Error("Add the player's name.");
  const { db, user } = requireDb();
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "customers", playerId);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("That player was not found.");
    tx.update(ref, { name: clean });
    tx.set(doc(collection(db, "auditLogs")), {
      type: "rename",
      customerId: playerId,
      before: String(snap.data().name ?? ""),
      after: clean,
      by: user.uid,
      at: serverTimestamp(),
    });
  });
}

export async function addPlayer(name: string, rawPhone: string) {
  const clean = name.trim();
  const phone = normalizePhone(rawPhone);
  if (!clean) throw new Error("Add the player's name.");
  if (!phone) throw new Error("Enter a 10-digit mobile number.");
  const { db, user } = requireDb();
  const customerRef = doc(collection(db, "customers"));
  await runTransaction(db, async (tx) => {
    const phoneRef = doc(db, "phones", phone);
    const phoneSnap = await tx.get(phoneRef);
    if (phoneSnap.exists()) throw new Error("A player with that mobile number already exists.");
    tx.set(phoneRef, { customerId: customerRef.id, phoneE164: phoneE164(phone) });
    tx.set(customerRef, {
      name: clean,
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
      after: { name: clean, phone },
      by: user.uid,
      at: serverTimestamp(),
    });
  });
  return customerRef.id;
}

export async function updatePlayer(playerId: string, name: string, rawPhone: string) {
  const clean = name.trim();
  const phone = normalizePhone(rawPhone);
  if (!clean) throw new Error("Add the player's name.");
  if (!phone) throw new Error("Enter a 10-digit mobile number.");
  const { db, user } = requireDb();
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "customers", playerId);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("That player was not found.");
    const before = { name: String(snap.data().name ?? ""), phone: String(snap.data().phone ?? "") };
    const phoneChanged = phone !== before.phone;
    const phoneRef = doc(db, "phones", phone);
    if (phoneChanged) {
      const phoneSnap = await tx.get(phoneRef);
      if (phoneSnap.exists() && String(phoneSnap.data().customerId ?? "") !== playerId) {
        throw new Error("That mobile number already belongs to another player.");
      }
      if (!phoneSnap.exists()) tx.set(phoneRef, { customerId: playerId, phoneE164: phoneE164(phone) });
    }
    if (!phoneChanged && clean === before.name) return;
    tx.update(ref, { name: clean, phone, phoneE164: phoneE164(phone) });
    tx.set(doc(collection(db, "auditLogs")), {
      type: "edit",
      customerId: playerId,
      before,
      after: { name: clean, phone },
      by: user.uid,
      at: serverTimestamp(),
    });
  });
}

export async function adjustPoints(playerId: string, delta: number, reason: string) {
  const note = reason.trim();
  if (!note) throw new Error("Add a reason for this points change.");
  if (!Number.isInteger(delta) || delta === 0) throw new Error("Enter a whole number of points, other than zero.");
  const { db, user } = requireDb();
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "customers", playerId);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("That player was not found.");
    const before = Number(snap.data().lifetimePoints ?? 0);
    const after = Math.max(0, before + delta);
    tx.update(ref, { lifetimePoints: after });
    tx.set(doc(collection(db, "pointsLedger")), {
      customerId: playerId,
      phoneE164: String(snap.data().phoneE164 ?? ""),
      type: "adjust",
      points: after - before,
      reason: note,
      balanceBefore: before,
      balanceAfter: after,
      at: serverTimestamp(),
      by: user.uid,
    });
    tx.set(doc(collection(db, "auditLogs")), {
      type: "adjust",
      customerId: playerId,
      reason: note,
      before,
      after,
      by: user.uid,
      at: serverTimestamp(),
    });
  });
}

export async function listStaffAccounts() {
  const { db } = requireDb();
  const snap = await getDocs(collection(db, "staff"));
  return snap.docs.map((item) => ({
    id: item.id,
    name: String(item.data().name ?? ""),
    email: String(item.data().email ?? ""),
    role: String(item.data().role ?? "staff"),
  }));
}
