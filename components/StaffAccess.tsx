"use client";

import {
  browserLocalPersistence,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signOut,
} from "firebase/auth";
import { useState, useSyncExternalStore } from "react";
import { firebaseConfig, firebaseServices } from "@/lib/firebaseClient";
import { staffProfile } from "@/lib/loyaltyApi";

const EMAIL_KEY = "nexus-staff-email";

export type StaffSnap = {
  configured: boolean;
  uid: string;
  email: string;
  role: string;
  status: "off" | "out" | "link" | "pending" | "staff" | "denied";
};

const signedOut: StaffSnap = { configured: true, uid: "", email: "", role: "", status: "out" };
const unconfigured: StaffSnap = { configured: false, uid: "", email: "", role: "", status: "off" };
let staffSnap: StaffSnap = signedOut;
let linkAttempt: Promise<void> | null = null;

function publish(next: StaffSnap, notify: () => void) {
  staffSnap = next;
  notify();
}

function completeEmailLink(notify: () => void) {
  const services = firebaseServices();
  if (!services || !isSignInWithEmailLink(services.auth, window.location.href)) return;
  const email = window.localStorage.getItem(EMAIL_KEY);
  if (!email) {
    publish({ ...signedOut, status: "link" }, notify);
    return;
  }
  if (!linkAttempt) {
    linkAttempt = signInWithEmailLink(services.auth, email, window.location.href)
      .then(() => {
        window.localStorage.removeItem(EMAIL_KEY);
        window.history.replaceState({}, "", window.location.pathname);
      })
      .catch(() => {
        linkAttempt = null;
        publish({ ...signedOut, status: "link" }, notify);
      });
  }
}

function subscribe(notify: () => void) {
  const services = firebaseServices();
  if (!services) {
    staffSnap = unconfigured;
    return () => {};
  }
  completeEmailLink(notify);
  return onAuthStateChanged(services.auth, (user) => {
    if (!user) {
      if (staffSnap.status === "link") return;
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

export function authMessage(reason: unknown) {
  const code = typeof reason === "object" && reason && "code" in reason ? String(reason.code) : "";
  if (code === "auth/configuration-not-found") {
    return "Firebase Authentication is not turned on yet. In the Firebase console, open Authentication, click Get started, then enable Email/Password.";
  }
  if (code === "auth/operation-not-allowed") {
    return "In Firebase Authentication, turn on Email/Password and Email link.";
  }
  if (code === "auth/invalid-email") return "Enter a valid staff email.";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found" || code === "auth/invalid-login-credentials") {
    return "That email or password was not accepted.";
  }
  if (code === "auth/too-many-requests") return "Too many attempts. Wait a moment and try again.";
  if (code === "auth/invalid-action-code") return "That sign-in link has expired. Request a new one.";
  if (reason instanceof Error && reason.message) return reason.message;
  return "Sign-in could not be completed.";
}

export async function signInWithPassword(email: string, password: string) {
  const services = firebaseServices();
  if (!services) throw new Error("Add the Firebase web app keys in .env.local, then restart the site.");
  await setPersistence(services.auth, browserLocalPersistence);
  await signInWithEmailAndPassword(services.auth, email.trim(), password);
}

export function StaffSignIn() {
  const staff = useStaff();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

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

  const finishing = staff.status === "link";

  return (
    <form
      className="grid gap-3 rounded-2xl border border-white/10 bg-navy p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const services = firebaseServices();
        if (!services) return;
        const address = email.trim();
        setPending(true);
        setError("");
        const task = finishing
          ? signInWithEmailLink(services.auth, address, window.location.href).then(() => {
              window.localStorage.removeItem(EMAIL_KEY);
              window.history.replaceState({}, "", window.location.pathname);
            })
          : sendSignInLinkToEmail(services.auth, address, {
              url: `${window.location.origin}${window.location.pathname}`,
              handleCodeInApp: true,
            }).then(() => {
              window.localStorage.setItem(EMAIL_KEY, address);
              setSent(true);
            });
        void task
          .catch((reason: unknown) => setError(authMessage(reason)))
          .finally(() => setPending(false));
      }}
    >
      <p className="font-tech text-[0.62rem] tracking-[0.2em] text-cyan uppercase">Staff sign in</p>
      <p className="text-sm text-mist">
        {finishing
          ? "Open the link on this browser, or enter the same email to finish."
          : "Enter your staff email. Firebase sends a sign-in link. No password."}
      </p>
      <label className="block">
        <span className="text-[0.62rem] tracking-[0.16em] text-mist uppercase">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="desk-input mt-2"
          autoComplete="email"
          required
        />
      </label>
      {sent ? <p className="text-sm text-cyan">Check that inbox and open the link on this device.</p> : null}
      {error ? <p className="text-sm text-magenta">{error}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Please wait" : finishing ? "Finish sign in" : "Email me a link"}
      </button>
    </form>
  );
}
