"use client";

import { useEffect, useState } from "react";
import { listEditableAmounts, updateMembershipAmount, updateSessionAmount, type AmountRow } from "@/lib/manageApi";

function AmountTable({ title, rows, onSave }: { title: string; rows: AmountRow[]; onSave: (row: AmountRow, amount: number) => Promise<void> }) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  return (
    <div className="grid gap-3">
      <h3 className="text-lg text-paper">{title}</h3>
      {message ? <p className="text-sm text-cyan" role="status">{message}</p> : null}
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="bg-white text-xs text-mist">
            <tr>{["Name", "Details", "Amount ₹", ""].map((heading) => <th key={heading || "action"} className="px-3 py-2 font-medium">{heading}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row) => {
              const value = drafts[row.id] ?? String(row.amount);
              const amount = Number(value);
              const changed = value.trim() !== "" && Number.isInteger(amount) && amount !== row.amount;
              return (
                <tr key={row.id} className="border-t border-white/10">
                  <td className="px-3 py-2 text-paper">{row.name}</td>
                  <td className="px-3 py-2 text-mist">{row.detail}</td>
                  <td className="px-3 py-2">
                    <input
                      className="desk-input mt-0 w-28"
                      inputMode="numeric"
                      value={value}
                      onChange={(event) => setDrafts((current) => ({ ...current, [row.id]: event.target.value.replace(/\D/g, "").slice(0, 6) }))}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      className="btn btn-secondary min-h-9 px-3"
                      disabled={!changed || busy === row.id}
                      onClick={() => {
                        setBusy(row.id);
                        setMessage("");
                        void onSave(row, amount)
                          .then(() => setMessage(`${row.name} is now ₹${amount.toLocaleString("en-IN")}.`))
                          .catch((reason: unknown) => setMessage(reason instanceof Error ? reason.message : "Could not update that amount."))
                          .finally(() => setBusy(""));
                      }}
                    >
                      {busy === row.id ? "Saving…" : "Update"}
                    </button>
                  </td>
                </tr>
              );
            }) : <tr><td colSpan={4} className="px-3 py-4 text-mist">Nothing to edit yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AmountRecords() {
  const [rows, setRows] = useState<AmountRow[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  function load() {
    return listEditableAmounts().then(setRows).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : "Could not load saved amounts.");
    });
  }

  useEffect(() => {
    let cancel = false;
    void listEditableAmounts()
      .then((next) => {
        if (!cancel) setRows(next);
      })
      .catch((reason: unknown) => {
        if (!cancel) setError(reason instanceof Error ? reason.message : "Could not load saved amounts.");
      });
    return () => {
      cancel = true;
    };
  }, []);

  const needle = query.trim().toLowerCase();
  const visible = rows.filter((row) => !needle || `${row.name} ${row.detail}`.toLowerCase().includes(needle));
  const sessions = visible.filter((row) => row.kind === "session");
  const members = visible.filter((row) => row.kind === "member");

  return (
    <section id="amounts" className="grid gap-4 rounded-xl border border-white/10 bg-[#101624] p-5">
      <div>
        <h2 className="text-xl text-paper">Saved amounts</h2>
        <p className="mt-1 max-w-2xl text-sm text-mist">Change the rupees already saved on a completed session or a membership. Today’s revenue and the customer’s amount paid follow the new number.</p>
      </div>
      <input className="desk-input max-w-sm" placeholder="Search name, mobile, or station" value={query} onChange={(event) => setQuery(event.target.value)} />
      {error ? <p className="text-sm text-magenta">{error}</p> : null}
      <AmountTable
        title="Sessions"
        rows={sessions}
        onSave={async (row, amount) => {
          await updateSessionAmount(row.id, amount);
          await load();
        }}
      />
      <AmountTable
        title="Memberships"
        rows={members}
        onSave={async (row, amount) => {
          await updateMembershipAmount(row.id, amount);
          await load();
        }}
      />
    </section>
  );
}
