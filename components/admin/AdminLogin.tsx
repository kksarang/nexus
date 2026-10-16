"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { authMessage, signInWithPassword, StaffSignIn, useStaff } from "@/components/StaffAccess";

export function AdminLogin() {
  const staff = useStaff();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  return (
    <main id="content" className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-5 py-16">
      <Logo className="h-14 w-auto" />
      <h1 className="mt-8 text-4xl tracking-wide text-paper uppercase">Admin Portal</h1>
      <p className="mt-2 text-sm text-mist">Staff email and password. A signed-in account still needs a staff record before the desk opens.</p>

      {!staff.configured ? (
        <div className="mt-8">
          <StaffSignIn />
        </div>
      ) : null}
      <form
          className="mt-8 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!email.includes("@") || password.length < 6) {
              setError("Enter the staff email and a password of at least 6 characters.");
              return;
            }
            if (!staff.configured) {
              setError("That password was not checked. The site is not connected to Firebase yet, so no email or password can succeed or fail. Add the web app apiKey and appId in .env.local, restart the site, then sign in again.");
              return;
            }
            setPending(true);
            setError("");
            void signInWithPassword(email, password)
              .then(() => setPassword(""))
              .catch((reason: unknown) => setError(authMessage(reason)))
              .finally(() => setPending(false));
          }}
        >
          <label className="block text-sm text-mist">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              className="desk-input mt-1"
              required
            />
          </label>
          <label className="block text-sm text-mist">
            Password
            <span className="relative mt-1 block">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="desk-input pr-12"
                required
              />
              <button
                type="button"
                className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center text-mist"
                aria-label={show ? "Hide password" : "Show password"}
                onClick={() => setShow((current) => !current)}
              >
                {show ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </span>
          </label>
          {staff.status === "denied" ? (
            <p className="text-sm text-magenta">
              Signed in as {staff.email || "this account"}, but Firestore has no staff/{staff.uid} record. Access stays closed until an admin document exists.
            </p>
          ) : null}
          {staff.status === "pending" ? <p className="text-sm text-mist">Checking the staff record…</p> : null}
          {error ? <p className="text-sm text-magenta" role="alert">{error}</p> : null}
          <button type="submit" className="btn btn-primary" disabled={pending || staff.status === "pending"}>
            {pending || staff.status === "pending" ? "Signing in…" : "Sign In"}
          </button>
        </form>

      {staff.configured ? (
        <>
          <button type="button" className="mt-6 text-left text-sm text-mist hover:text-paper" onClick={() => setLinkOpen((current) => !current)}>
            {linkOpen ? "Hide email link" : "Use an email link instead"}
          </button>
          {linkOpen ? (
            <div className="mt-3">
              <StaffSignIn />
            </div>
          ) : null}
        </>
      ) : null}
      <Link href="/" className="mt-8 text-sm text-mist hover:text-paper">
        Back to the website
      </Link>
    </main>
  );
}
