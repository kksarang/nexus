"use client";

import { BadgeCheck, Download, UserPlus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDesk } from "@/components/admin/AdminShell";
import { downloadCsv, formatIst } from "@/lib/adminStats";
import {
  cancelMembership,
  createMembership,
  extendMembership,
  formatDay,
  istDateInput,
  istDateStart,
  listMemberships,
  loadUses,
  memberState,
  oneMonthFrom,
  plan,
  sessionsLeft,
  undoUse,
  spendSessions,
  type MemberState,
  type Membership,
  type MembershipUse,
} from "@/lib/membershipApi";

const DAY = 24 * 60 * 60 * 1000;

const stateLabel: Record<MemberState, string> = { active: "Active", used: "All sessions used", expired: "Expired", cancelled: "Cancelled" };
const stateStyle: Record<MemberState, string> = {
  active: "border-cyan/40 bg-cyan/10 text-cyan",
  used: "border-white/15 bg-white/5 text-mist",
  expired: "border-white/15 bg-white/5 text-mist",
  cancelled: "border-magenta/40 bg-magenta/10 text-magenta",
};

const filters = [
  ["active", "Active"],
  ["expiring", "Ending in 7 days"],
  ["low", "3 or fewer left"],
  ["ended", "Used up or expired"],
  ["cancelled", "Cancelled"],
  ["all", "All"],
] as const;

type Filter = (typeof filters)[number][0];

function Message({ value }: { value: { ok: boolean; text: string } | null }) {
  if (!value) return null;
  return (
    <p className={`rounded-lg border px-3 py-2 text-sm ${value.ok ? "border-cyan/40 bg-cyan/10 text-cyan" : "border-magenta/40 bg-magenta/10 text-magenta"}`} role={value.ok ? "status" : "alert"}>
      {value.text}
    </p>
  );
}

function AddMember({ now, onDone }: { now: number; onDone: (text: string) => void }) {
  const [form, setForm] = useState({ phone: "", name: "", amount: String(plan.rupees), start: "", note: "", consent: false });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const start = form.start || (now ? istDateInput(now) : "");
  const startAt = istDateStart(start);

  return (
    <form
      className="grid gap-4 rounded-xl border border-cyan/30 bg-[#101624] p-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (startAt === null) return setMessage({ ok: false, text: "Pick the start date." });
        setBusy(true);
        setMessage(null);
        void createMembership({ phone: form.phone, name: form.name, amountPaid: Number(form.amount || 0), startAt, consent: form.consent, note: form.note })
          .then(() => onDone(`Membership added. ${plan.sessions} sessions valid until ${formatDay(oneMonthFrom(startAt))}.`))
          .catch((reason: unknown) => setMessage({ ok: false, text: reason instanceof Error ? reason.message : "Could not add the member." }))
          .finally(() => setBusy(false));
      }}
    >
      <div>
        <h2 className="text-xl text-paper">Add a monthly member</h2>
        <p className="mt-1 text-sm text-mist">
          {plan.sessions} one-hour sessions on Stations 01 to 04, valid for one month from the start date. If the number is already registered, the existing player is used.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm text-mist">Mobile number<input className="desk-input mt-1" inputMode="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required /></label>
        <label className="text-sm text-mist">Name (for a new player)<input className="desk-input mt-1" value={form.name} maxLength={60} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <label className="text-sm text-mist">Amount collected ₹<input className="desk-input mt-1" inputMode="numeric" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value.replace(/\D/g, "").slice(0, 6) })} /></label>
        <label className="text-sm text-mist">Start date<input type="date" className="desk-input mt-1" value={start} onChange={(event) => setForm({ ...form, start: event.target.value })} required /></label>
      </div>
      <label className="text-sm text-mist">Note (optional)<input className="desk-input mt-1" value={form.note} maxLength={120} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="For example: paid by UPI" /></label>
      <label className="flex items-start gap-2 text-sm text-mist">
        <input type="checkbox" className="mt-1" checked={form.consent} onChange={(event) => setForm({ ...form, consent: event.target.checked })} />
        A new player agrees to store their name and mobile number. Not needed for players already registered.
      </label>
      {startAt !== null ? <p className="text-sm text-paper">Valid {formatDay(startAt)} to {formatDay(oneMonthFrom(startAt))}. Leave the amount at 0 if nothing was collected yet; only collected amounts count as revenue.</p> : null}
      <Message value={message} />
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Add membership"}</button>
      </div>
    </form>
  );
}

function MemberDetail({ item, now, editable, onChanged }: { item: Membership; now: number; editable: boolean; onChanged: (text: string) => void }) {
  const [uses, setUses] = useState<MembershipUse[]>([]);
  const [action, setAction] = useState<"" | "undo" | "extend" | "cancel">("");
  const [reason, setReason] = useState("");
  const [endDate, setEndDate] = useState(istDateInput(item.endAt));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const state = memberState(item, now);

  useEffect(() => {
    let cancel = false;
    void loadUses(item.id).then((next) => {
      if (!cancel) setUses(next);
    }).catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, [item.id, item.sessionsUsed]);

  function run(task: () => Promise<unknown>, done: string) {
    setBusy(true);
    setMessage(null);
    void task()
      .then(() => {
        setAction("");
        setReason("");
        onChanged(done);
      })
      .catch((caught: unknown) => setMessage({ ok: false, text: caught instanceof Error ? caught.message : "Could not save." }))
      .finally(() => setBusy(false));
  }

  return (
    <section className="grid gap-4 rounded-xl border border-white/10 bg-[#101624] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl text-paper">{item.name}</h2>
          <p className="text-sm text-mist">{item.phone} · <Link href={`/admin/players/${item.customerId}`} className="text-cyan">Player details</Link></p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs ${stateStyle[state]}`}>{stateLabel[state]}</span>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Sessions left", `${sessionsLeft(item)} of ${item.sessionsTotal}`],
          ["Valid", `${formatDay(item.startAt)} – ${formatDay(item.endAt)}`],
          ["Collected", `₹${item.amountPaid.toLocaleString("en-IN")}${item.amountPaid < item.priceRupees ? ` of ₹${item.priceRupees.toLocaleString("en-IN")}` : ""}`],
          ["Last used", item.lastUsedAt ? formatIst(item.lastUsedAt) : "Not yet"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <dt className="text-xs text-mist">{label}</dt>
            <dd className="mt-1 text-sm font-semibold text-paper">{value}</dd>
          </div>
        ))}
      </dl>
      {item.note ? <p className="text-sm text-mist">Note: {item.note}</p> : null}

      {editable && item.status === "active" ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" disabled={busy || state !== "active"} onClick={() => run(() => spendSessions(item.id, 1, "", ""), "1 session used.")}>
            Use 1 session now
          </button>
          <button type="button" className="btn btn-secondary" disabled={busy || item.sessionsUsed < 1} onClick={() => setAction(action === "undo" ? "" : "undo")}>Give back 1 session</button>
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => setAction(action === "extend" ? "" : "extend")}>Change end date</button>
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => setAction(action === "cancel" ? "" : "cancel")}>Cancel membership</button>
        </div>
      ) : null}
      {state !== "active" && item.status === "active" ? <p className="text-sm text-mist">This membership is finished. Add a new membership above to renew; this record and its history stay.</p> : null}

      {action ? (
        <form
          className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (action === "undo") run(() => undoUse(item.id, reason), "1 session given back.");
            if (action === "extend") run(() => extendMembership(item.id, endDate, reason), "End date updated.");
            if (action === "cancel") run(() => cancelMembership(item.id, reason), "Membership cancelled. The record stays in history.");
          }}
        >
          {action === "extend" ? (
            <label className="w-fit text-sm text-mist">New last day<input type="date" className="desk-input mt-1" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
          ) : null}
          <label className="text-sm text-mist">
            Reason (saved in the activity log)
            <input className="desk-input mt-1" value={reason} maxLength={120} onChange={(event) => setReason(event.target.value)} placeholder={action === "undo" ? "For example: session started by mistake" : action === "extend" ? "For example: shop closed for 3 days" : "For example: member asked to stop"} required />
          </label>
          {action === "cancel" ? <p className="text-sm text-magenta">Cancelling stops further use. It does not delete anything and does not refund money.</p> : null}
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
            <button type="button" className="btn btn-secondary" onClick={() => setAction("")}>Close</button>
          </div>
        </form>
      ) : null}
      <Message value={message} />

      <div>
        <h3 className="text-base text-paper">History</h3>
        <ul className="mt-2 grid gap-1.5 text-sm">
          <li className="flex justify-between gap-3 text-mist"><span>Membership added · ₹{item.amountPaid.toLocaleString("en-IN")} collected</span><span>{formatIst(item.createdAt || item.startAt)}</span></li>
          {uses.map((use) => (
            <li key={use.id} className="flex justify-between gap-3 text-paper">
              <span>{use.type === "use" ? `Used ${use.count} session${use.count > 1 ? "s" : ""}${use.stationId ? ` on station ${use.stationId}` : ""}` : `Gave back 1 session · ${use.reason}`}</span>
              <span className="text-mist">{formatIst(use.at)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function MembersDesk() {
  const desk = useDesk();
  const [rows, setRows] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(0);
  const [filter, setFilter] = useState<Filter>("active");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(() => {
    void listMemberships()
      .then((next) => {
        setRows(next);
        setError("");
      })
      .catch((reason: unknown) => {
        const text = reason instanceof Error ? reason.message : "Could not load members.";
        setError(/permission/i.test(text) ? "Firestore rules blocked this. Publish the latest rules in the Firebase console, then reload." : text);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (desk.signedIn) refresh();
  }, [desk.signedIn, refresh]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setNow(Date.now()));
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, []);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const digits = search.replace(/\D/g, "");
    return rows.filter((item) => {
      const state = memberState(item, now);
      const text = !needle || item.name.toLowerCase().includes(needle) || (digits.length >= 3 && item.phone.includes(digits));
      if (!text) return false;
      if (filter === "active") return state === "active";
      if (filter === "expiring") return state === "active" && item.endAt - now <= 7 * DAY;
      if (filter === "low") return state === "active" && sessionsLeft(item) <= 3;
      if (filter === "ended") return state === "used" || state === "expired";
      if (filter === "cancelled") return state === "cancelled";
      return true;
    });
  }, [rows, filter, search, now]);

  const active = rows.filter((item) => memberState(item, now) === "active");
  const monthStart = now ? istDateStart(istDateInput(now).slice(0, 8) + "01") ?? 0 : 0;
  const soldThisMonth = rows.filter((item) => item.startAt >= monthStart);
  const chosen = rows.find((item) => item.id === selected);

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-4xl tracking-wide text-paper uppercase"><BadgeCheck size={26} aria-hidden="true" /> Members</h1>
          <p className="mt-2 max-w-2xl text-sm text-mist">
            Monthly plan: ₹{plan.rupees.toLocaleString("en-IN")} for {plan.sessions} sessions on Stations 01 to 04. Only staff can add members. Visitors can only read about the plan on the website.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {desk.canEdit("members") ? (
            <button type="button" className="btn btn-primary" onClick={() => { setAdding((value) => !value); setNotice(""); }}>
              <UserPlus size={15} aria-hidden="true" /> {adding ? "Close" : "Add member"}
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => downloadCsv("nexus-members.csv", [
              ["Name", "Mobile", "Status", "Sessions used", "Sessions total", "Start", "Last day", "Collected ₹", "Note"],
              ...rows.map((item) => [item.name, item.phone, stateLabel[memberState(item, now)], item.sessionsUsed, item.sessionsTotal, formatDay(item.startAt), formatDay(item.endAt), item.amountPaid, item.note]),
            ])}
          >
            <Download size={15} aria-hidden="true" /> Download
          </button>
        </div>
      </div>

      {notice ? <p className="rounded-lg border border-cyan/40 bg-cyan/10 px-3 py-2 text-sm text-cyan" role="status">{notice}</p> : null}
      {error ? <p className="rounded-lg border border-magenta/40 bg-magenta/10 px-3 py-2 text-sm text-magenta" role="alert">{error}</p> : null}

      {adding ? (
        <AddMember
          now={now}
          onDone={(text) => {
            setAdding(false);
            setNotice(text);
            setFilter("active");
            refresh();
            desk.reload();
          }}
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Active members", String(active.length)],
          ["Sessions left across members", String(active.reduce((total, item) => total + sessionsLeft(item), 0))],
          ["Ending in 7 days", String(active.filter((item) => item.endAt - now <= 7 * DAY).length)],
          ["Collected this month", `₹${soldThisMonth.reduce((total, item) => total + item.amountPaid, 0).toLocaleString("en-IN")} · ${soldThisMonth.length} sold`],
        ].map(([label, value]) => (
          <article key={label} className="rounded-xl border border-white/10 bg-[#101624] p-4">
            <p className="text-xs text-mist">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-paper">{value}</p>
          </article>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map(([key, label]) => (
            <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)} className={`rounded-full border px-3 py-1.5 text-sm ${filter === key ? "border-cyan bg-cyan text-ink" : "border-white/15 text-paper"}`}>
              {label}
            </button>
          ))}
        </div>
        <input className="desk-input mt-0 lg:max-w-xs" placeholder="Search name or mobile" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="bg-[#101624] text-xs text-mist">
            <tr>{["Member", "Mobile", "Sessions left", "Last day", "Status", ""].map((heading, index) => <th key={heading || index} className="px-4 py-3 font-medium">{heading}</th>)}</tr>
          </thead>
          <tbody>
            {visible.length ? visible.map((item) => {
              const state = memberState(item, now);
              const left = sessionsLeft(item);
              return (
                <tr key={item.id} className={`border-t border-white/10 ${selected === item.id ? "bg-cyan/10" : ""}`}>
                  <td className="px-4 py-3 font-medium text-paper">{item.name}</td>
                  <td className="px-4 py-3 text-mist">{item.phone}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-14 text-paper">{left} / {item.sessionsTotal}</span>
                      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-cyan" style={{ width: `${(left / Math.max(1, item.sessionsTotal)) * 100}%` }} /></span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-mist">{formatDay(item.endAt)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full border px-2.5 py-0.5 text-xs ${stateStyle[state]}`}>{stateLabel[state]}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-paper hover:border-cyan/50" onClick={() => setSelected(selected === item.id ? "" : item.id)}>
                      {selected === item.id ? "Hide" : "Manage"}
                    </button>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan={6} className="px-4 py-6 text-mist">{loading ? "Loading members…" : rows.length ? "No members match this filter." : "No members yet. Use Add member when someone joins at the counter."}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {chosen ? (
        <MemberDetail
          key={chosen.id}
          item={chosen}
          now={now}
          editable={desk.canEdit("members")}
          onChanged={(text) => {
            setNotice(text);
            refresh();
          }}
        />
      ) : null}
    </div>
  );
}
