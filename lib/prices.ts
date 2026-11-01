import { doc, getDoc, serverTimestamp, writeBatch, collection } from "firebase/firestore";
import { firebaseServices } from "@/lib/firebaseClient";
import { asPrices, defaultPrices, publishPrices, type PriceBook } from "@/lib/pricesCore";

export * from "@/lib/pricesCore";

export async function readPrices() {
  const services = firebaseServices();
  if (!services) return defaultPrices;
  const snap = await getDoc(doc(services.db, "settings", "prices"));
  const next = asPrices(snap.data() as Record<string, unknown> | undefined);
  publishPrices(next);
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
  publishPrices(next);
}
