import { deleteApp, initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { downloadCsv, formatIst } from "@/lib/adminStats";
import { loginEmail, parseAccess, type AccessMap } from "@/lib/deskAccess";
import { firebaseConfig, firebaseServices } from "@/lib/firebaseClient";
import { millisOf } from "@/lib/loyalty";

function requireDb() {
  const services = firebaseServices();
  if (!services) throw new Error("The site is not connected to Firebase.");
  const user = services.auth.currentUser;
  if (!user) throw new Error("Sign in again to manage the desk.");
  return { ...services, user };
}

function friendly(reason: unknown, fallback: string) {
  const code = typeof reason === "object" && reason && "code" in reason ? String((reason as { code: unknown }).code) : "";
  if (code === "auth/email-already-in-use") return "This email already has a login. Use “Give access to an existing login” with their user ID instead.";
  if (code === "auth/invalid-email") return "That email address is not valid.";
  if (code === "auth/weak-password") return "Use a password of at least 8 characters.";
  if (code === "auth/operation-not-allowed") return "Email and password sign-in is turned off in Firebase Authentication.";
  if (code === "permission-denied" || /permission/i.test(String(reason))) return "Firestore rules blocked this. Publish the latest rules in the Firebase console, then try again.";
  return reason instanceof Error && reason.message ? reason.message : fallback;
}

export type StaffRow = { id: string; name: string; email: string; username: string; role: "admin" | "office"; access: AccessMap; addedAt: number };

export async function listStaff(): Promise<StaffRow[]> {
  const { db } = requireDb();
  const snap = await getDocs(collection(db, "staff"));
  return snap.docs
    .map((item) => {
      const data = item.data();
      const role = String(data.role ?? "admin") === "office" ? "office" : "admin";
      return {
        id: item.id,
        name: String(data.name ?? ""),
        email: String(data.email ?? ""),
        username: String(data.username ?? ""),
        role,
        access: parseAccess(role, data.access),
        addedAt: millisOf(data.addedAt),
      } satisfies StaffRow;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function grant(uid: string, name: string, email: string, note: string) {
  const { db, user } = requireDb();
  const batch = writeBatch(db);
  batch.set(doc(db, "staff", uid), { name, email, role: "admin", addedBy: user.uid, addedAt: serverTimestamp() });
  batch.set(doc(collection(db, "auditLogs")), { type: "staff-add", staffId: uid, after: { name, email }, reason: note, by: user.uid, at: serverTimestamp() });
  await batch.commit();
}

export async function createStaffLogin(rawName: string, rawEmail: string, password: string) {
  const name = rawName.trim();
  const email = rawEmail.trim().toLowerCase();
  if (!name) throw new Error("Add the staff member's name.");
  if (!email.includes("@")) throw new Error("Add the staff member's email.");
  if (password.length < 8) throw new Error("Use a password of at least 8 characters.");
  const config = firebaseConfig();
  if (!config) throw new Error("The site is not connected to Firebase.");
  requireDb();
  const helper = initializeApp(config, `staff-create-${Date.now()}`);
  let uid = "";
  try {
    const helperAuth = getAuth(helper);
    const created = await createUserWithEmailAndPassword(helperAuth, email, password);
    uid = created.user.uid;
    await signOut(helperAuth);
  } catch (reason) {
    throw new Error(friendly(reason, "Could not create the login."));
  } finally {
    await deleteApp(helper).catch(() => undefined);
  }
  try {
    await grant(uid, name, email, "New login created in Settings");
  } catch (reason) {
    throw new Error(`The login was created (user ID ${uid}) but access was not saved. ${friendly(reason, "")} Then use “Give access to an existing login” with that user ID.`);
  }
  return uid;
}

export async function createOfficeLogin(rawName: string, rawUsername: string, password: string, access: AccessMap) {
  const name = rawName.trim();
  const email = loginEmail(rawUsername);
  const username = email.endsWith("@staff.nexusplayzone.com") ? email.slice(0, -"@staff.nexusplayzone.com".length) : email;
  if (!name) throw new Error("Add the staff member's name.");
  if (password.length < 8) throw new Error("Use a password of at least 8 characters.");
  if (!Object.values(access).some((level) => level !== "none")) throw new Error("Choose at least one section this person can open.");
  const config = firebaseConfig();
  if (!config) throw new Error("The site is not connected to Firebase.");
  requireDb();
  const helper = initializeApp(config, `office-create-${Date.now()}`);
  let uid = "";
  try {
    const helperAuth = getAuth(helper);
    const created = await createUserWithEmailAndPassword(helperAuth, email, password);
    uid = created.user.uid;
    await signOut(helperAuth);
  } catch (reason) {
    throw new Error(friendly(reason, "Could not create the login."));
  } finally {
    await deleteApp(helper).catch(() => undefined);
  }
  const { db, user } = requireDb();
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, "staff", uid), { name, email, username, role: "office", access, addedBy: user.uid, addedAt: serverTimestamp() });
    batch.set(doc(collection(db, "auditLogs")), { type: "staff-add", staffId: uid, after: { name, username, role: "office", access }, reason: "Office staff login created", by: user.uid, at: serverTimestamp() });
    await batch.commit();
  } catch (reason) {
    throw new Error(`The login was created (user ID ${uid}) but access was not saved. ${friendly(reason, "")} Publish the latest Firestore rules, then use “Give access to an existing login” only for an admin. For office staff, delete that login in Firebase Authentication and create it again.`);
  }
  return { uid, username };
}

export async function updateStaffAccess(uid: string, access: AccessMap) {
  if (!Object.values(access).some((level) => level !== "none")) throw new Error("Choose at least one section this person can open.");
  const { db, user } = requireDb();
  try {
    await updateDoc(doc(db, "staff", uid), { access });
    await setDoc(doc(collection(db, "auditLogs")), { type: "staff-access", staffId: uid, after: { access }, by: user.uid, at: serverTimestamp() });
  } catch (reason) {
    throw new Error(friendly(reason, "Could not update what this person can see."));
  }
}

export async function grantExistingLogin(rawUid: string, rawName: string, rawEmail: string) {
  const uid = rawUid.trim();
  const name = rawName.trim();
  if (!/^[A-Za-z0-9]{20,40}$/.test(uid)) throw new Error("Paste the user ID from Firebase Authentication. It is a 28-character code.");
  if (!name) throw new Error("Add the staff member's name.");
  try {
    await grant(uid, name, rawEmail.trim().toLowerCase(), "Existing login given access in Settings");
  } catch (reason) {
    throw new Error(friendly(reason, "Could not give access."));
  }
}

export async function renameStaff(uid: string, rawName: string) {
  const name = rawName.trim();
  if (!name) throw new Error("Add a name.");
  const { db, user } = requireDb();
  try {
    await updateDoc(doc(db, "staff", uid), { name });
    await setDoc(doc(collection(db, "auditLogs")), { type: "staff-rename", staffId: uid, after: { name }, by: user.uid, at: serverTimestamp() });
  } catch (reason) {
    throw new Error(friendly(reason, "Could not rename."));
  }
}

export async function removeStaff(uid: string, name: string) {
  const { db, user } = requireDb();
  if (uid === user.uid) throw new Error("You cannot remove your own access. Ask another admin to do it.");
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, "staff", uid));
    batch.set(doc(collection(db, "auditLogs")), { type: "staff-remove", staffId: uid, before: { name }, by: user.uid, at: serverTimestamp() });
    await batch.commit();
  } catch (reason) {
    throw new Error(friendly(reason, "Could not remove access."));
  }
}

export async function sendStaffReset(email: string) {
  const services = firebaseServices();
  if (!services) throw new Error("The site is not connected to Firebase.");
  try {
    await sendPasswordResetEmail(services.auth, email);
  } catch (reason) {
    throw new Error(friendly(reason, "Could not send the reset email."));
  }
}

export type SiteNotice = { text: string; active: boolean; until: number | null; updatedAt: number };

const emptyNotice: SiteNotice = { text: "", active: false, until: null, updatedAt: 0 };

export function subscribeNotice(onChange: (notice: SiteNotice) => void) {
  const services = firebaseServices();
  if (!services) return () => undefined;
  return onSnapshot(
    doc(services.db, "settings", "notice"),
    (snap) => {
      const data = snap.data();
      if (!data) return onChange(emptyNotice);
      onChange({
        text: String(data.text ?? ""),
        active: data.active === true,
        until: typeof data.until === "number" ? data.until : null,
        updatedAt: millisOf(data.updatedAt),
      });
    },
    () => onChange(emptyNotice),
  );
}

export async function saveNotice(rawText: string, active: boolean, until: number | null) {
  const text = rawText.trim().slice(0, 160);
  if (active && !text) throw new Error("Type the message before turning the notice on.");
  const { db, user } = requireDb();
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, "settings", "notice"), { text, active, until, updatedBy: user.uid, updatedAt: serverTimestamp() });
    batch.set(doc(collection(db, "auditLogs")), { type: active ? "notice-on" : "notice-off", after: { text }, by: user.uid, at: serverTimestamp() });
    await batch.commit();
  } catch (reason) {
    throw new Error(friendly(reason, "Could not save the notice."));
  }
}

export type ActivityRow = { id: string; type: string; at: number; by: string; summary: string };

function summarize(data: Record<string, unknown>) {
  const after = (data.after ?? {}) as Record<string, unknown>;
  const before = (data.before ?? {}) as Record<string, unknown>;
  const type = String(data.type ?? "");
  if (type === "register") return `Registered player ${String(after.name ?? data.name ?? "")} ${String(after.phone ?? data.phone ?? "")}`.trim();
  if (type === "edit") return `Edited player ${String(before.name ?? "")} → ${String(after.name ?? "")} ${String(after.phone ?? "")}`.trim();
  if (type === "rename") return `Renamed player ${String(data.before ?? "")} → ${String(data.after ?? "")}`;
  if (type === "adjust") return `Points corrected ${String(data.before ?? "")} → ${String(data.after ?? "")}: ${String(data.reason ?? "")}`;
  if (type === "staff-add") return `Gave desk access to ${String(after.name ?? "")}${after.role === "office" ? " as office staff" : ""}`;
  if (type === "staff-access") return "Changed what an office login can see";
  if (type === "staff-remove") return `Removed desk access for ${String(before.name ?? "")}`;
  if (type === "staff-rename") return `Renamed staff to ${String(after.name ?? "")}`;
  if (type === "notice-on") return `Website notice on: ${String(after.text ?? "")}`;
  if (type === "notice-off") return "Website notice turned off";
  if (type === "redeem") return "Free 30 minutes redeemed";
  if (type === "member-add") return `Monthly membership for ${String(after.name ?? "")} ${String(after.phone ?? "")} · ₹${String(after.amountPaid ?? 0)} received`.trim();
  if (type === "member-use") return `Membership used: ${String(after.count ?? 1)} on Station ${String(after.stationId ?? "")} · ${String(after.left ?? "")} left`;
  if (type === "member-undo") return `Membership session given back: ${String(data.reason ?? "")}`;
  if (type === "member-extend") return `Membership end date changed: ${String(data.reason ?? "")}`;
  if (type === "member-cancel") return `Membership cancelled: ${String(data.reason ?? "")}`;
  return type || "Change";
}

export async function loadActivity(count = 60): Promise<ActivityRow[]> {
  const { db } = requireDb();
  const snap = await getDocs(query(collection(db, "auditLogs"), orderBy("at", "desc"), limit(count)));
  return snap.docs.map((item) => ({
    id: item.id,
    type: String(item.data().type ?? ""),
    at: millisOf(item.data().at),
    by: String(item.data().by ?? ""),
    summary: summarize(item.data()),
  }));
}

export async function downloadBackup() {
  const { db } = requireDb();
  const stamp = new Date().toISOString().slice(0, 10);
  const [customers, sessions, ledger, members] = await Promise.all([
    getDocs(collection(db, "customers")),
    getDocs(query(collection(db, "sessions"), orderBy("endedAt", "desc"), limit(10000))),
    getDocs(query(collection(db, "pointsLedger"), orderBy("at", "desc"), limit(10000))),
    getDocs(collection(db, "memberships")).catch(() => null),
  ]);
  downloadCsv(`nexus-players-${stamp}.csv`, [
    ["Player ID", "Name", "Mobile", "Registered", "Paid minutes", "Lifetime points", "Sessions", "Last played"],
    ...customers.docs.map((item) => {
      const data = item.data();
      return [item.id, String(data.name ?? ""), String(data.phone ?? ""), formatIst(millisOf(data.createdAt)), Number(data.lifetimeMinutes ?? 0), Number(data.lifetimePoints ?? 0), Number(data.sessionCount ?? 0), formatIst(Number(data.lastPlayedAt ?? 0))];
    }),
  ]);
  downloadCsv(`nexus-sessions-${stamp}.csv`, [
    ["Session ID", "Player", "Mobile", "Station", "Start", "End", "Booked minutes", "Paid minutes", "Points", "Amount ₹", "Payment recorded", "Status", "Staff ID"],
    ...sessions.docs.map((item) => {
      const data = item.data();
      return [item.id, String(data.name ?? ""), String(data.phone ?? ""), String(data.stationName ?? data.stationId ?? ""), formatIst(Number(data.startedAt ?? 0)), formatIst(Number(data.endedAt ?? 0)), Number(data.bookedMinutes ?? 0), Number(data.paidMinutes ?? 0), Number(data.points ?? 0), Number(data.amountRupees ?? 0), data.paymentRecorded === true ? "yes" : "no", String(data.status ?? ""), String(data.by ?? "")];
    }),
  ]);
  downloadCsv(`nexus-points-ledger-${stamp}.csv`, [
    ["Entry ID", "Player ID", "Type", "Points", "Balance after", "Reason", "Session", "When", "Staff ID"],
    ...ledger.docs.map((item) => {
      const data = item.data();
      return [item.id, String(data.customerId ?? ""), String(data.type ?? ""), Number(data.points ?? 0), String(data.balanceAfter ?? ""), String(data.reason ?? ""), String(data.sessionId ?? ""), formatIst(millisOf(data.at)), String(data.by ?? "")];
    }),
  ]);
  if (members) {
    downloadCsv(`nexus-memberships-${stamp}.csv`, [
      ["Membership ID", "Player ID", "Name", "Mobile", "Sessions used", "Sessions total", "Amount ₹", "Start", "End", "Status", "Note", "Staff ID"],
      ...members.docs.map((item) => {
        const data = item.data();
        return [item.id, String(data.customerId ?? ""), String(data.name ?? ""), String(data.phone ?? ""), Number(data.sessionsUsed ?? 0), Number(data.sessionsTotal ?? 0), Number(data.amountPaid ?? 0), formatIst(Number(data.startAt ?? 0)), formatIst(Number(data.endAt ?? 0)), String(data.status ?? ""), String(data.note ?? ""), String(data.createdBy ?? "")];
      }),
    ]);
  }
  return { players: customers.size, sessions: sessions.size, ledger: ledger.size, members: members?.size ?? 0 };
}