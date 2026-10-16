"use client";

import { onAuthStateChanged, signInWithPhoneNumber, signOut, type ConfirmationResult, type RecaptchaVerifier } from "firebase/auth";
import { useState, useSyncExternalStore } from "react";
import { PlayerCard } from "@/components/PlayerCard";
import { firebaseConfig, firebaseServices } from "@/lib/firebaseClient";
import { findCustomer, type CustomerProfile } from "@/lib/loyaltyApi";
import { normalizePhone, phoneE164 } from "@/lib/loyalty";

type PlayerSnap = {
  configured: boolean;
  status: "out" | "loading" | "ready" | "missing" | "error";
  customer: CustomerProfile | null;
  phone: string;
  message: string;
};

const signedOut: PlayerSnap = { configured: true, status: "out", customer: null, phone: "", message: "" };
const unconfigured: PlayerSnap = {
  configured: false,
  status: "error",
  customer: null,
  phone: "",
  message: "Points open after the Firebase web app is connected.",
};
let playerSnap: PlayerSnap = signedOut;
let verifier: RecaptchaVerifier | null = null;

function publish(next: PlayerSnap, notify: () => void) {
  playerSnap = next;
  notify();
}

function subscribe(notify: () => void) {
  const services = firebaseServices();
  if (!services) {
    playerSnap = unconfigured;
    return () => {};
  }
  return onAuthStateChanged(services.auth, (user) => {
    const phone = user?.phoneNumber?.replace(/\D/g, "").slice(-10) ?? "";
    if (!phone) {
      publish(signedOut, notify);
      return;
    }
    publish({ configured: true, status: "loading", customer: null, phone, message: "" }, notify);
    void findCustomer(phone)
      .then((customer) => {
        if (firebaseServices()?.auth.currentUser?.uid !== user?.uid) return;
        publish(
          customer
            ? { configured: true, status: "ready", customer, phone, message: "" }
            : {
                configured: true,
                status: "missing",
                customer: null,
                phone,
                message: "This number is not registered yet. Ask the counter to add you.",
              },
          notify,
        );
      })
      .catch((reason: unknown) => {
        publish(
          {
            configured: true,
            status: "error",
            customer: null,
            phone,
            message: reason instanceof Error ? reason.message : "Could not load points.",
          },
          notify,
        );
      });
  });
}

function getSnapshot() {
  if (!firebaseConfig()) return unconfigured;
  return playerSnap;
}

function getServerSnapshot(): PlayerSnap {
  return firebaseConfig() ? signedOut : unconfigured;
}

export function PlayerDesk() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <div className="grid content-start gap-4">
        {snap.status === "ready" || snap.status === "missing" || snap.status === "loading" ? (
          <div className="rounded-2xl border border-white/10 bg-navy p-4 text-sm text-paper">
            <p>Signed in as +91 {snap.phone}</p>
            <button
              type="button"
              className="btn btn-secondary mt-4"
              onClick={() => {
                const services = firebaseServices();
                if (services) void signOut(services.auth);
              }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <form
            className="grid gap-3 rounded-2xl border border-white/10 bg-navy p-4"
            onSubmit={(event) => {
              event.preventDefault();
              const services = firebaseServices();
              if (!services) return;
              const mobile = normalizePhone(phone);
              if (!mobile) {
                setError("Enter the 10-digit mobile number used at the counter.");
                return;
              }
              setPending(true);
              setError("");
              void (async () => {
                if (!confirmation) {
                  const { RecaptchaVerifier } = await import("firebase/auth");
                  if (!verifier) {
                    verifier = new RecaptchaVerifier(services.auth, "player-recaptcha", { size: "normal" });
                  }
                  const next = await signInWithPhoneNumber(services.auth, phoneE164(mobile), verifier);
                  setConfirmation(next);
                  return;
                }
                await confirmation.confirm(code.trim());
              })()
                .catch(() => {
                  verifier = null;
                  setError("The code was not accepted. Check the number and try again.");
                })
                .finally(() => setPending(false));
            }}
          >
            <p className="font-tech text-[0.62rem] tracking-[0.2em] text-cyan uppercase">Your number</p>
            <label className="block">
              <span className="text-[0.62rem] tracking-[0.16em] text-mist uppercase">Mobile number</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="desk-input mt-2"
                inputMode="tel"
                autoComplete="tel"
                placeholder="10-digit mobile"
                disabled={Boolean(confirmation)}
              />
            </label>
            {confirmation ? (
              <label className="block">
                <span className="text-[0.62rem] tracking-[0.16em] text-mist uppercase">SMS code</span>
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  className="desk-input mt-2"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              </label>
            ) : null}
            <div id="player-recaptcha" />
            {error ? <p className="text-sm text-magenta">{error}</p> : null}
            {!snap.configured ? <p className="text-sm text-mist">{snap.message}</p> : null}
            <button type="submit" className="btn btn-primary" disabled={pending || !snap.configured}>
              {pending ? "Please wait" : confirmation ? "Verify code" : "Send code"}
            </button>
          </form>
        )}
        <p className="text-xs leading-relaxed text-mist">
          A phone number by itself does not open a player card. The SMS code confirms it is your number.
        </p>
      </div>
      <div>
        {snap.status === "ready" && snap.customer ? <PlayerCard customer={snap.customer} /> : null}
        {snap.status === "loading" ? <p className="text-sm text-mist">Loading your card.</p> : null}
        {snap.configured && (snap.status === "missing" || snap.status === "error") ? (
          <p className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-paper">{snap.message}</p>
        ) : null}
        {snap.status === "out" || !snap.configured ? (
          <div className="rounded-3xl border border-dashed border-white/15 p-6 text-sm leading-relaxed text-mist">
            After the code is confirmed you will see weekly progress, lifetime hours, and whether a free 30-minute
            session is ready. Claiming it happens at the counter.
          </div>
        ) : null}
      </div>
    </div>
  );
}
