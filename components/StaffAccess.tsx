"use client";

import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useState, useSyncExternalStore } from "react";
import { firebaseConfig, firebaseServices } from "@/lib/firebaseClient";
import { staffProfile } from "@/lib/loyaltyApi";

export type StaffSnap = {
  configured: boolean;
  uid: string;
  email: string;
  role: string;
  status: "off" | "out" | "pending" | "staff" | "denied";
};

const signedOut: StaffSnap = { configured: true, uid: "", email: "", role: "", status: "out" };
const unconfigured: StaffSnap = { configured: false, uid: "", email: "", role: "", status: "off" };
let staffSnap: StaffSnap = signedOut;

function publish(next: StaffSnap, notify: () => void) {
  staffSnap = next;
  notify();
}

function subscribe(notify: () => void) {
  const services = firebaseServices();
  if (!services) {
    staffSnap = unconfigured;
    return () => {};
  }
  return onAuthStateChanged(services.auth, (user) => {
    if (!user) {
      publish({ ...signedOut }, notify);
      return;
    }
    const base = { configured: true, uid: user.uid, email: user.email ?? "", role: "" };
    publish({ ...base, status: "pending" }, notify);
    void staffProfile(user.uid).then((profile) => {
      if (firebaseServices()?.auth.currentUser?.uid !== user.uid) return;
      publish(
        {
          ...base,
          role: profile?.role ?? "",
          status: profile ? "staff" : "denied",
        },
        notify,
      );
    });
  });
}

function getSnapshot() {
  if (!firebaseConfig()) return unconfigured;
  return staffSnap;
}

function getServerSnapshot(): StaffSnap {
  return firebaseConfig() ? signedOut : unconfigured;
}

export function useStaff() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function StaffSignIn() {
  const staff = useStaff();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (!staff.configured) {
    return (
      <div className="rounded-2xl border border-violet/40 bg-violet/10 p-4 text-sm leading-relaxed text-paper">
        <p className="font-tech text-[0.62rem] tracking-[0.2em] text-violet uppercase">Firebase web app</p>
        <p className="mt-2">
          In the Firebase project <span className="text-cyan">nexusplayzone-7324d</span>, add a Web app, then put
          the apiKey and appId in <span className="text-cyan">.env.local</span> and restart the site. Points stay on
          this device until that connection exists.
        </p>
      </div>
    );
  }

  if (staff.status === "staff" || staff.status === "pending" || staff.status === "denied") {
    return (
      <div className="rounded-2xl border border-white/10 bg-navy p-4 text-sm text-paper">
        <p>{staff.email || "Staff account"}</p>
        {staff.status === "denied" ? (
          <p className="mt-2 text-mist">
            This login is not on the staff list yet. In Firestore, create a document at{" "}
            <span className="text-cyan">staff/{staff.uid}</span> with fields role: &quot;admin&quot; and name.
          </p>
        ) : null}
        {staff.status === "staff" ? <p className="mt-2 text-cyan">{staff.role}</p> : null}
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
    );
  }

  return (
    <form
      className="grid gap-3 rounded-2xl border border-white/10 bg-navy p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const services = firebaseServices();
        if (!services) return;
        setPending(true);
        setError("");
        void signInWithEmailAndPassword(services.auth, email.trim(), password)
          .catch((reason: unknown) => {
            setError(reason instanceof Error ? "That staff email or password was not accepted." : "Sign-in failed.");
          })
          .finally(() => setPending(false));
      }}
    >
      <p className="font-tech text-[0.62rem] tracking-[0.2em] text-cyan uppercase">Staff sign in</p>
      <label className="block">
        <span className="text-[0.62rem] tracking-[0.16em] text-mist uppercase">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="desk-input mt-2"
          autoComplete="username"
          required
        />
      </label>
      <label className="block">
        <span className="text-[0.62rem] tracking-[0.16em] text-mist uppercase">Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="desk-input mt-2"
          autoComplete="current-password"
          required
        />
      </label>
      {error ? <p className="text-sm text-magenta">{error}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Signing in" : "Sign in"}
      </button>
    </form>
  );
}
