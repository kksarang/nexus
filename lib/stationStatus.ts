import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseServices } from "@/lib/firebaseClient";
import { stations } from "@/lib/site";
import type { StationState } from "@/lib/stationStatusCore";

export * from "@/lib/stationStatusCore";

function staffDb() {
  const services = firebaseServices();
  const user = services?.auth.currentUser;
  if (!services || !user) return null;
  return { db: services.db, user };
}

export async function setStationStatus(stationId: string, status: StationState, until: number | null, reason: string) {
  if (!stations.some((station) => station.id === stationId)) throw new Error("Unknown station.");
  const ready = staffDb();
  if (!ready) throw new Error("Sign in as staff before changing a station.");
  await setDoc(
    doc(ready.db, "stations", stationId),
    {
      status,
      until: status === "available" ? null : until,
      reason: status === "unavailable" ? reason.trim().slice(0, 60) : status === "busy" ? "In a session" : "",
      by: ready.user.uid,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function markStationBusy(stationId: string, until: number) {
  if (!staffDb()) return;
  await setStationStatus(stationId, "busy", until, "");
}

export async function releaseStationAfterSession(stationId: string) {
  const ready = staffDb();
  if (!ready) return;
  const snap = await getDoc(doc(ready.db, "stations", stationId));
  if (snap.exists() && snap.data().status === "unavailable") return;
  await setStationStatus(stationId, "available", null, "");
}
