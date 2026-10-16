import { collection, doc, getDoc, getDocs, limit, orderBy, query, runTransaction, serverTimestamp, where } from "firebase/firestore";
import { firebaseServices } from "@/lib/firebaseClient";
import { millisOf, normalizePhone, phoneE164 } from "@/lib/loyalty";
import { memberships as plans } from "@/lib/site";

const IST = 330 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

export const plan = plans[0];
export const memberStations = ["01", "02", "03", "04"];

export type Membership = {
  id: string;
  customerId: string;
  name: string;
  phone: string;
  sessionsTotal: number;
  sessionsUsed: number;
  priceRupees: number;
  amountPaid: number;
  startAt: number;
  endAt: number;
  status: "active" | "cancelled";
  createdAt: number;
  createdBy: string;
  lastUsedAt: number;
  note: string;
};

export type MemberState = "active" | "used" | "expired" | "cancelled";

export type MembershipUse = {
  id: string;
  type: "use" | "undo";
  count: number;
  stationId: string;
  sessionId: string;
  reason: string;
  at: number;
  by: string;
};

function requireDb() {
  const services = firebaseServices();
  if (!services) throw new Error("The site is not connected to Firebase.");
  const user = services.auth.currentUser;
  if (!user) throw new Error("Sign in again to manage members.");
  return { ...services, user };
}

function friendly(reason: unknown, fallback: string) {
  const text = reason instanceof Error ? reason.message : String(reason ?? "");
  if (/permission/i.test(text)) return "Firestore rules blocked this. Publish the latest rules in the Firebase console, then try again.";
  return text || fallback;
}

function asMembership(id: string, data: Record<string, unknown>): Membership {
  return {
    id,
    customerId: String(data.customerId ?? ""),
    name: String(data.name ?? "Member"),
    phone: String(data.phone ?? ""),
    sessionsTotal: Number(data.sessionsTotal ?? 0),
    sessionsUsed: Number(data.sessionsUsed ?? 0),
    priceRupees: Number(data.priceRupees ?? 0),
    amountPaid: Number(data.amountPaid ?? 0),
    startAt: Number(data.startAt ?? 0),
    endAt: Number(data.endAt ?? 0),
    status: data.status === "cancelled" ? "cancelled" : "active",
    createdAt: millisOf(data.createdAt),
    createdBy: String(data.createdBy ?? ""),
    lastUsedAt: Number(data.lastUsedAt ?? 0),
    note: String(data.note ?? ""),
  };
}

export function memberState(item: Membership, now: number): MemberState {
  if (item.status === "cancelled") return "cancelled";
  if (item.sessionsUsed >= item.sessionsTotal) return "used";
  if (now > item.endAt) return "expired";
  return "active";
}

export function sessionsLeft(item: Membership) {
  return Math.max(0, item.sessionsTotal - item.sessionsUsed);
}

/** Start of the given IST calendar date (YYYY-MM-DD). */
export function istDateStart(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return Date.UTC(year, month - 1, day) - IST;
}

/** Valid through the day before the same date next month, IST. */
export function oneMonthFrom(startAt: number) {
  const shifted = new Date(startAt + IST);
  const next = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate()) - IST;
  return next - 1;
}

export function istDateInput(ms: number) {
  const shifted = new Date(ms + IST);
  return shifted.toISOString().slice(0, 10);
}

export function formatDay(ms: number) {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
}

export async function listMemberships(): Promise<Membership[]> {
  const { db } = requireDb();
  const snap = await getDocs(query(collection(db, "memberships"), orderBy("startAt", "desc"), limit(1000)));
  return snap.docs.map((item) => asMembership(item.id, item.data()));
}

export async function membershipsFor(customerId: string): Promise<Membership[]> {
  const { db } = requireDb();
  const snap = await getDocs(query(collection(db, "memberships"), where("customerId", "==", customerId), limit(50)));
  return snap.docs.map((item) => asMembership(item.id, item.data())).sort((a, b) => b.startAt - a.startAt);
}

export async function currentMembership(customerId: string) {
  const now = Date.now();
  const list = await membershipsFor(customerId).catch(() => []);
  return list.find((item) => memberState(item, now) === "active") ?? null;
}

export async function loadUses(membershipId: string): Promise<MembershipUse[]> {
  const { db } = requireDb();
  const snap = await getDocs(query(collection(db, "membershipUses"), where("membershipId", "==", membershipId), limit(200)));
  return snap.docs
    .map((item) => {
      const data = item.data();
      return {
        id: item.id,
        type: data.type === "undo" ? ("undo" as const) : ("use" as const),
        count: Number(data.count ?? 1),
        stationId: String(data.stationId ?? ""),
        sessionId: String(data.sessionId ?? ""),
        reason: String(data.reason ?? ""),
        at: millisOf(data.at) || Number(data.atMs ?? 0),
        by: String(data.by ?? ""),
      };
    })
    .sort((a, b) => b.at - a.at);
}

export async function createMembership(input: { phone: string; name: string; amountPaid: number; startAt: number; consent: boolean; note: string }) {
  const phone = normalizePhone(input.phone);
  if (!phone) throw new Error("Enter a 10-digit mobile number.");
  if (!Number.isInteger(input.amountPaid) || input.amountPaid < 0) throw new Error("Enter the amount collected in whole rupees.");
  const { db, user } = requireDb();
  const phoneRef = doc(db, "phones", phone);
  const existingPhone = await getDoc(phoneRef);
  const customerId = existingPhone.exists() ? String(existingPhone.data().customerId) : "";
  if (customerId) {
    const now = Date.now();
    const current = (await membershipsFor(customerId)).find((item) => memberState(item, now) === "active");
    if (current) throw new Error(`This player already has an active membership with ${sessionsLeft(current)} sessions left until ${formatDay(current.endAt)}.`);
  } else {
    if (!input.name.trim()) throw new Error("This number is new. Add the player's name.");
    if (!input.consent) throw new Error("Tick consent to store the new player's name and number.");
  }
  const endAt = oneMonthFrom(input.startAt);
  const memberRef = doc(collection(db, "memberships"));
  try {
    await runTransaction(db, async (tx) => {
      const phoneSnap = await tx.get(phoneRef);
      let id = phoneSnap.exists() ? String(phoneSnap.data().customerId) : "";
      let name = input.name.trim();
      if (id) {
        const customer = await tx.get(doc(db, "customers", id));
        name = String(customer.data()?.name ?? name) || "Member";
      } else {
        const customerRef = doc(collection(db, "customers"));
        id = customerRef.id;
        tx.set(phoneRef, { customerId: id, phoneE164: phoneE164(phone) });
        tx.set(customerRef, {
          name,
          phone,
          phoneE164: phoneE164(phone),
          lifetimeMinutes: 0,
          lifetimePoints: 0,
          bankedMinutes: 0,
          createdAt: serverTimestamp(),
          consentAt: serverTimestamp(),
          createdBy: user.uid,
        });
      }
      tx.set(memberRef, {
        customerId: id,
        name,
        phone,
        plan: plan.key,
        sessionsTotal: plan.sessions,
        sessionsUsed: 0,
        priceRupees: plan.rupees,
        amountPaid: input.amountPaid,
        startAt: input.startAt,
        endAt,
        status: "active",
        note: input.note.trim().slice(0, 120),
        lastUsedAt: 0,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      tx.set(doc(collection(db, "auditLogs")), {
        type: "member-add",
        customerId: id,
        membershipId: memberRef.id,
        after: { name, phone, amountPaid: input.amountPaid, endAt },
        by: user.uid,
        at: serverTimestamp(),
      });
    });
  } catch (reason) {
    throw new Error(friendly(reason, "Could not add the member."));
  }
  return memberRef.id;
}

async function change(
  membershipId: string,
  apply: (item: Membership) => { patch: Record<string, unknown>; use?: Omit<MembershipUse, "id" | "at" | "by">; audit: Record<string, unknown> },
) {
  const { db, user } = requireDb();
  const ref = doc(db, "memberships", membershipId);
  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error("That membership was not found.");
      const item = asMembership(snap.id, snap.data());
      const { patch, use, audit } = apply(item);
      tx.update(ref, patch);
      if (use) {
        tx.set(doc(collection(db, "membershipUses")), { ...use, membershipId, customerId: item.customerId, at: serverTimestamp(), atMs: Date.now(), by: user.uid });
      }
      tx.set(doc(collection(db, "auditLogs")), { ...audit, membershipId, customerId: item.customerId, by: user.uid, at: serverTimestamp() });
      return { ...item, ...patch } as Membership;
    });
  } catch (reason) {
    throw new Error(friendly(reason, "Could not update the membership."));
  }
}

export async function spendSessions(membershipId: string, count: number, stationId: string, sessionId: string) {
  if (!Number.isInteger(count) || count < 1) throw new Error("Choose at least one session.");
  if (stationId && !memberStations.includes(stationId)) throw new Error("The membership covers Stations 01 to 04 only.");
  return change(membershipId, (item) => {
    const state = memberState(item, Date.now());
    if (state === "cancelled") throw new Error("This membership was cancelled.");
    if (state === "expired") throw new Error(`This membership ended on ${formatDay(item.endAt)}.`);
    if (item.sessionsUsed + count > item.sessionsTotal) throw new Error(`Only ${sessionsLeft(item)} membership sessions are left.`);
    return {
      patch: { sessionsUsed: item.sessionsUsed + count, lastUsedAt: Date.now() },
      use: { type: "use", count, stationId, sessionId, reason: "" },
      audit: { type: "member-use", after: { count, stationId, left: sessionsLeft(item) - count } },
    };
  });
}

export async function undoUse(membershipId: string, reason: string) {
  const note = reason.trim();
  if (!note) throw new Error("Add a reason for giving the session back.");
  return change(membershipId, (item) => {
    if (item.status === "cancelled") throw new Error("This membership was cancelled.");
    if (item.sessionsUsed < 1) throw new Error("No sessions have been used yet.");
    return {
      patch: { sessionsUsed: item.sessionsUsed - 1 },
      use: { type: "undo", count: 1, stationId: "", sessionId: "", reason: note.slice(0, 120) },
      audit: { type: "member-undo", reason: note, after: { left: sessionsLeft(item) + 1 } },
    };
  });
}

export async function extendMembership(membershipId: string, endDate: string, reason: string) {
  const note = reason.trim();
  const start = istDateStart(endDate);
  if (start === null) throw new Error("Pick the new last day.");
  if (!note) throw new Error("Add a reason for changing the end date.");
  const endAt = start + DAY - 1;
  return change(membershipId, (item) => {
    if (item.status === "cancelled") throw new Error("This membership was cancelled.");
    if (endAt <= item.startAt) throw new Error("The last day must be after the start date.");
    return { patch: { endAt }, audit: { type: "member-extend", reason: note, before: { endAt: item.endAt }, after: { endAt } } };
  });
}

export async function cancelMembership(membershipId: string, reason: string) {
  const note = reason.trim();
  if (!note) throw new Error("Add a reason for cancelling.");
  return change(membershipId, (item) => {
    if (item.status === "cancelled") throw new Error("This membership is already cancelled.");
    return { patch: { status: "cancelled", note: `Cancelled: ${note}`.slice(0, 120) }, audit: { type: "member-cancel", reason: note, after: { left: sessionsLeft(item) } } };
  });
}
