"use client";

import { KeyRound, Pencil, ShieldOff, UserPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDesk } from "@/components/admin/AdminShell";
import { useStaff } from "@/components/StaffAccess";
import { displayLogin, moduleInfo, officeDefaults, type AccessMap, type Level } from "@/lib/deskAccess";
import { createOfficeLogin, createStaffLogin, grantExistingLogin, listStaff, removeStaff, renameStaff, sendStaffReset, updateStaffAccess, type StaffRow } from "@/lib/manageApi";

type Mode = "none" | "new" | "existing";

export function StaffManager() {
  const desk = useDesk();
  const staff = useStaff();
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<Mode>("none");
  const [form, setForm] = useState({ name: "", email: "", password: "", uid: "", access: officeDefaults() });
  const [accessFor, setAccessFor] = useState<{ id: string; access: AccessMap } | null>(null);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [removing, setRemoving] = useState<StaffRow | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(() => {
    void listStaff()
      .then((next) => setRows(next))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load staff."))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (desk.isAdmin) refresh();
  }, [desk.isAdmin, refresh]);

  async function run(task: () => Promise<unknown>, done: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await task();
      setNotice(done);
      refresh();
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Something went wrong.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function closeForms() {
    setMode("none");
    setForm({ name: "", email: "", password: "", uid: "", access: officeDefaults() });
  }

  return (
    <section id="staff" className="grid gap-4 rounded-xl border border-white/10 bg-[#101624] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl text-paper">Office staff and admins</h2>
          <p className="mt-1 max-w-2xl text-sm text-mist">
            Only an admin can create logins. Office staff use the same sign-in page with a username and password, and they only see the sections you choose. They cannot create admins or other staff. An admin still has the full desk, including revenue.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={() => { closeForms(); setMode("new"); }}>
            <UserPlus size={15} aria-hidden="true" /> Add office staff
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => { closeForms(); setMode("existing"); }}>
            Add an admin
          </button>
        </div>
      </div>

      {notice ? <p className="rounded-lg border border-cyan/40 bg-cyan/10 px-3 py-2 text-sm text-cyan" role="status">{notice}</p> : null}
      {error ? <p className="rounded-lg border border-magenta/40 bg-magenta/10 px-3 py-2 text-sm text-magenta" role="alert">{error}</p> : null}

      {mode === "new" ? (
        <form
          className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const { name, email, password, access } = form;
            void run(
              () => createOfficeLogin(name, email, password, access),
              `${name.trim()} can sign in on the admin page with username ${email.trim().toLowerCase()} and the password you set. Share it privately. Office staff cannot open sections you left off, and they cannot create staff.`,
            ).then((ok) => ok && closeForms());
          }}
        >
          <p className="text-sm font-semibold text-paper">New office staff login</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm text-mist">Name<input className="desk-input mt-1" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength={60} required /></label>
            <label className="text-sm text-mist">Username<input className="desk-input mt-1" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="off" placeholder="counter1" required /></label>
            <label className="text-sm text-mist">Password<input type="text" className="desk-input mt-1" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="new-password" minLength={8} required /></label>
          </div>
          <p className="text-xs text-mist">They type this username and password on the same admin sign-in page. Use 3 to 30 letters or numbers. Password at least 8 characters.</p>
          <AccessPicker value={form.access} onChange={(access) => setForm({ ...form, access })} />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Creating…" : "Create office login"}</button>
            <button type="button" className="btn btn-secondary" disabled={busy} onClick={closeForms}>Cancel</button>
          </div>
        </form>
      ) : null}

      {mode === "existing" ? (
        <form
          className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const { uid, name, email } = form;
            void run(() => grantExistingLogin(uid, name, email), `${name.trim()} now has desk access.`).then((ok) => ok && closeForms());
          }}
        >
          <p className="text-sm font-semibold text-paper">Another admin</p>
          <p className="text-xs text-mist">Creates a full admin: email, password, and every section including revenue and staff. Office staff cannot do this.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-mist">Name<input className="desk-input mt-1" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength={60} required /></label>
            <label className="text-sm text-mist">Email<input type="email" className="desk-input mt-1" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="off" required /></label>
            <label className="text-sm text-mist sm:col-span-2">Password<input type="text" className="desk-input mt-1" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="new-password" minLength={8} /></label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() => {
                const { name, email, password } = form;
                void run(() => createStaffLogin(name, email, password), `${name.trim()} is an admin and can sign in with ${email.trim()}.`).then((ok) => ok && closeForms());
              }}
            >
              {busy ? "Creating…" : "Create admin login"}
            </button>
            <button type="button" className="btn btn-secondary" disabled={busy} onClick={closeForms}>Cancel</button>
          </div>
          <p className="text-xs text-mist">Or give admin access to a login that already exists. Copy their User UID from Firebase console → Authentication → Users.</p>
          <label className="text-sm text-mist">User UID<input className="desk-input mt-1 font-mono" value={form.uid} onChange={(event) => setForm({ ...form, uid: event.target.value })} /></label>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Give access"}</button>
            <button type="button" className="btn btn-secondary" disabled={busy} onClick={closeForms}>Cancel</button>
          </div>
        </form>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="bg-white/[0.03] text-xs text-mist">
            <tr>{["Name", "Login", "Role", "Can open", ""].map((heading, index) => <th key={heading || index} className="px-4 py-3 font-medium">{heading}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const self = row.id === staff.uid;
              return (
                <tr key={row.id} className="border-t border-white/10 align-top">
                  <td className="px-4 py-3 text-paper">
                    {editing?.id === row.id ? (
                      <form
                        className="flex gap-2"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void run(() => renameStaff(row.id, editing.name), "Name updated.").then((ok) => ok && setEditing(null));
                        }}
                      >
                        <input className="desk-input mt-0 min-h-9" value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} maxLength={60} autoFocus />
                        <button type="submit" className="btn btn-primary min-h-9 px-3" disabled={busy}>Save</button>
                        <button type="button" className="btn btn-secondary min-h-9 px-3" onClick={() => setEditing(null)}>Cancel</button>
                      </form>
                    ) : (
                      <>
                        <span className="font-medium">{row.name || "No name"}</span>
                        {self ? <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs text-mist">You</span> : null}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3 text-mist">{displayLogin(row.email, row.username) || "Not saved"}</td>
                  <td className="px-4 py-3 text-paper">{row.role === "office" ? "Office staff" : "Admin"}</td>
                  <td className="px-4 py-3 text-mist">{row.role === "office" ? accessLabel(row.access) : "Full desk, including revenue and staff"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      {row.role === "office" ? (
                        <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-paper hover:border-cyan/50" onClick={() => setAccessFor({ id: row.id, access: { ...row.access } })}>
                          Sections
                        </button>
                      ) : null}
                      <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-paper hover:border-cyan/50" onClick={() => setEditing({ id: row.id, name: row.name })}>
                        <Pencil size={13} aria-hidden="true" /> Rename
                      </button>
                      {row.email ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-paper hover:border-cyan/50"
                          disabled={busy}
                          onClick={() => void run(() => sendStaffReset(row.email), `A password reset email was sent to ${row.email}.`)}
                        >
                          <KeyRound size={13} aria-hidden="true" /> Send password reset
                        </button>
                      ) : null}
                      {!self ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-magenta/40 px-3 py-1.5 text-xs text-magenta"
                          onClick={() => { setRemoving(row); setConfirmText(""); setError(""); setNotice(""); }}
                        >
                          <ShieldOff size={13} aria-hidden="true" /> Remove access
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
            {loaded && !rows.length ? <tr><td colSpan={5} className="px-4 py-6 text-mist">No staff records found.</td></tr> : null}
          </tbody>
        </table>
      </div>

      {accessFor ? (
        <form
          className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const current = accessFor;
            void run(() => updateStaffAccess(current.id, current.access), "Sections updated. They will see the change the next time the desk loads.").then((ok) => ok && setAccessFor(null));
          }}
        >
          <AccessPicker value={accessFor.access} onChange={(access) => setAccessFor({ ...accessFor, access })} />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save sections"}</button>
            <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => setAccessFor(null)}>Cancel</button>
          </div>
        </form>
      ) : null}

      {removing ? (
        <form
          className="grid gap-3 rounded-lg border border-magenta/40 bg-magenta/10 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const target = removing;
            void run(() => removeStaff(target.id, target.name), `${target.name || "That account"} no longer has desk access.`).then((ok) => ok && setRemoving(null));
          }}
        >
          <p className="text-sm text-paper">
            Remove desk access for <strong>{removing.name || removing.email || removing.id}</strong>? From now on the desk blocks everything they try, and they cannot sign in to it again. Their login itself stays in Firebase Authentication, and nothing they recorded is deleted.
          </p>
          <label className="text-sm text-mist">
            Type REMOVE to confirm
            <input className="desk-input mt-1" value={confirmText} onChange={(event) => setConfirmText(event.target.value)} />
          </label>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={busy || confirmText.trim().toUpperCase() !== "REMOVE"}>{busy ? "Removing…" : "Remove access"}</button>
            <button type="button" className="btn btn-secondary" onClick={() => setRemoving(null)}>Cancel</button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

function accessLabel(access: AccessMap) {
  const open = moduleInfo.filter((item) => access[item.id] !== "none");
  if (!open.length) return "No sections";
  return open.map((item) => `${item.label} (${access[item.id]})`).join(", ");
}

function AccessPicker({ value, onChange }: { value: AccessMap; onChange: (next: AccessMap) => void }) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-semibold text-paper">Sections</legend>
      <p className="text-xs text-mist">Off hides that part of the desk. View lets them look. Edit lets them change it. Leave Revenue off if they should not see monthly revenue.</p>
      {moduleInfo.map((item) => (
        <div key={item.id} className="grid gap-2 rounded-lg border border-white/10 px-3 py-2 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-sm text-paper">{item.label}</p>
            <p className="text-xs text-mist">{item.detail}</p>
          </div>
          <div className="flex gap-1">
            {(["none", "view", "edit"] as const satisfies readonly Level[]).map((level) => (
              <button
                key={level}
                type="button"
                aria-pressed={value[item.id] === level}
                className={`rounded-full border px-3 py-1 text-xs capitalize ${value[item.id] === level ? "border-cyan bg-cyan text-ink" : "border-white/15 text-paper"}`}
                onClick={() => onChange({ ...value, [item.id]: level })}
              >
                {level === "none" ? "Off" : level}
              </button>
            ))}
          </div>
        </div>
      ))}
    </fieldset>
  );
}
