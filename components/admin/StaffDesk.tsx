"use client";

import { useEffect, useState } from "react";
import { useDesk } from "@/components/admin/AdminShell";
import { listStaffAccounts } from "@/lib/adminApi";
import { formatIst } from "@/lib/adminStats";

export function StaffDesk() {
  const desk = useDesk();
  const [rows, setRows] = useState<{ id: string; name: string; email: string; role: string }[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!desk.isAdmin) return;
    let cancel = false;
    void listStaffAccounts()
      .then((next) => {
        if (!cancel) setRows(next);
      })
      .catch((reason: unknown) => {
        if (!cancel) setError(reason instanceof Error ? reason.message : "Could not load staff.");
      });
    return () => {
      cancel = true;
    };
  }, [desk.isAdmin]);

  if (!desk.isAdmin) {
    return (
      <div>
        <h1 className="text-4xl tracking-wide text-paper uppercase">Staff</h1>
        <p className="mt-3 max-w-xl text-sm text-mist">Only an admin can open staff accounts. A manager can read reports. Floor staff can run sessions and look up players.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl tracking-wide text-paper uppercase">Staff</h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          Every account listed here has full access to the desk. To add someone, create their login in Firebase Authentication, then add a Firestore document at staff/uid with their name. The website cannot grant access by itself.
        </p>
      </div>
      {error ? <p className="text-sm text-magenta">{error}</p> : null}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="text-[0.62rem] tracking-[0.12em] text-mist uppercase">
            <tr>{["Name", "Email", "Role", "Status", "Sessions", "Last activity"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row) => {
              const handled = (desk.data?.sessions ?? []).filter((session) => session.by === row.id && session.status === "completed");
              const last = handled.reduce((latest, session) => Math.max(latest, session.endedAt), 0);
              return (
                <tr key={row.id} className="border-t border-white/10">
                  <td className="px-3 py-3">{row.name || "—"}</td>
                  <td className="px-3 py-3 text-mist">{row.email || "Stored in Authentication"}</td>
                  <td className="px-3 py-3">{row.role}</td>
                  <td className="px-3 py-3">Active</td>
                  <td className="px-3 py-3">{handled.length}</td>
                  <td className="px-3 py-3 text-mist">{formatIst(last)}</td>
                </tr>
              );
            }) : <tr><td colSpan={6} className="px-3 py-6 text-mist">No staff documents yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
