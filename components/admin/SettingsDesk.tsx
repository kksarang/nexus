"use client";

import { Download, Lock, Megaphone, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { AmountRecords } from "@/components/admin/AmountRecords";
import { useDesk } from "@/components/admin/AdminShell";
import { PriceSettings } from "@/components/admin/PriceSettings";
import { StaffManager } from "@/components/admin/StaffManager";
import { formatIst } from "@/lib/adminStats";
import { istDayStart, POINT_MINUTES, REWARD_MINUTES, WEEKLY_TARGET } from "@/lib/loyalty";
import { downloadBackup, loadActivity, listStaff, saveNotice, subscribeNotice, type ActivityRow, type SiteNotice } from "@/lib/manageApi";
import { istClock } from "@/lib/stationStatus";

const sections = [
  ["staff", "Staff accounts"],
  ["prices", "Prices"],
  ["amounts", "Saved amounts"],
  ["notice", "Website notice"],
  ["backup", "Backup"],
  ["activity", "Activity log"],
  ["protection", "Data protection"],
  ["loyalty", "Loyalty rules"],
] as const;

const card = "rounded-xl border border-white/10 bg-[#101624] p-5";

function NoticeManager() {
  const [current, setCurrent] = useState<SiteNotice | null>(null);
  const [text, setText] = useState("");
  const [ends, setEnds] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [now, setNow] = useState(0);

  useEffect(
    () =>
      subscribeNotice((next) => {
        setCurrent(next);
        setText((value) => value || next.text);
      }),
    [],
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setNow(Date.now()));
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, []);

  function endsAt() {
    if (!ends) return null;
    const [hours, minutes] = ends.split(":").map(Number);
    const now = Date.now();
    let target = istDayStart(now) + (hours * 60 + minutes) * 60 * 1000;
    if (target <= now) target += 24 * 60 * 60 * 1000;
    return target;
  }

  async function save(active: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      const until = active ? endsAt() : null;
      await saveNotice(text, active, until);
      setMessage({ ok: true, text: active ? `The notice is showing on the website${until ? ` until ${istClock(until)}` : ""}.` : "The notice is off." });
    } catch (reason) {
      setMessage({ ok: false, text: reason instanceof Error ? reason.message : "Could not save." });
    } finally {
      setBusy(false);
    }
  }

  const live = Boolean(current?.active && current.text && (!current.until || current.until > now));

  return (
    <section id="notice" className={`${card} grid gap-4`}>
      <div>
        <h2 className="flex items-center gap-2 text-xl text-paper"><Megaphone size={18} aria-hidden="true" /> Website notice</h2>
        <p className="mt-1 max-w-2xl text-sm text-mist">A short message visitors see on every public page, for example “Closed today until 4 PM” or “Tournament on Saturday, book early”.</p>
      </div>
      <p className={`text-sm ${live ? "text-cyan" : "text-mist"}`}>
        {live ? `Showing now${current?.until ? ` until ${istClock(current.until)}` : ""}: “${current?.text}”` : "No notice is showing."}
      </p>
      <label className="text-sm text-mist">
        Message ({text.length}/160)
        <textarea className="desk-input mt-1 min-h-20" value={text} maxLength={160} onChange={(event) => setText(event.target.value)} />
      </label>
      <label className="w-fit text-sm text-mist">
        Hide automatically at (IST, optional)
        <input type="time" className="desk-input mt-1" value={ends} onChange={(event) => setEnds(event.target.value)} />
      </label>
      {message ? <p className={`rounded-lg border px-3 py-2 text-sm ${message.ok ? "border-cyan/40 bg-cyan/10 text-cyan" : "border-magenta/40 bg-magenta/10 text-magenta"}`} role="status">{message.text}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void save(true)}>{live ? "Update notice" : "Show on website"}</button>
        {live ? <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => void save(false)}>Turn off</button> : null}
      </div>
    </section>
  );
}

function BackupPanel() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <section id="backup" className={`${card} grid gap-3`}>
      <h2 className="flex items-center gap-2 text-xl text-paper"><Download size={18} aria-hidden="true" /> Backup</h2>
      <p className="max-w-2xl text-sm text-mist">Downloads three spreadsheet files with every player, every session with amounts, and every points change. Keep a copy on your computer or Google Drive once a week.</p>
      {message ? <p className={`rounded-lg border px-3 py-2 text-sm ${message.ok ? "border-cyan/40 bg-cyan/10 text-cyan" : "border-magenta/40 bg-magenta/10 text-magenta"}`} role="status">{message.text}</p> : null}
      <button
        type="button"
        className="btn btn-primary w-fit"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setMessage(null);
          void downloadBackup()
            .then((count) => setMessage({ ok: true, text: `Downloaded ${count.players} players, ${count.sessions} sessions, ${count.ledger} points entries, and ${count.members} memberships.` }))
            .catch((reason: unknown) => setMessage({ ok: false, text: reason instanceof Error ? reason.message : "Backup failed." }))
            .finally(() => setBusy(false));
        }}
      >
        {busy ? "Preparing…" : "Download full backup"}
      </button>
    </section>
  );
}

function ActivityLog() {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    let cancel = false;
    void Promise.all([loadActivity(), listStaff().catch(() => [])])
      .then(([activity, staff]) => {
        if (cancel) return;
        setRows(activity);
        setNames(Object.fromEntries(staff.map((item) => [item.id, item.name || item.email])));
        setError("");
      })
      .catch((reason: unknown) => {
        if (!cancel) setError(reason instanceof Error ? reason.message : "Could not load the activity log.");
      });
    return () => {
      cancel = true;
    };
  }, [generation]);

  return (
    <section id="activity" className={`${card} grid gap-3`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl text-paper">Activity log</h2>
        <button type="button" className="btn btn-secondary min-h-9 px-3" onClick={() => setGeneration((value) => value + 1)}>
          <RefreshCw size={14} aria-hidden="true" /> Refresh
        </button>
      </div>
      <p className="text-sm text-mist">The latest 60 changes: player edits, point corrections, rewards, staff access, and website notices. This log cannot be edited or deleted.</p>
      {error ? <p className="text-sm text-magenta">{error}</p> : null}
      <div className="max-h-[26rem] overflow-auto rounded-lg border border-white/10">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="sticky top-0 bg-white text-xs text-mist">
            <tr>{["When", "What", "By"].map((heading) => <th key={heading} className="px-4 py-2.5 font-medium">{heading}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row) => (
              <tr key={row.id} className="border-t border-white/10">
                <td className="whitespace-nowrap px-4 py-2.5 text-mist">{formatIst(row.at)}</td>
                <td className="px-4 py-2.5 text-paper">{row.summary}</td>
                <td className="px-4 py-2.5 text-mist">{names[row.by] || (row.by ? row.by.slice(0, 8) : "—")}</td>
              </tr>
            )) : <tr><td colSpan={3} className="px-4 py-6 text-mist">No changes recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function SettingsDesk() {
  const desk = useDesk();
  if (!desk.isAdmin) {
    return <p className="text-sm text-mist">This utility is only for admins.</p>;
  }
  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl tracking-wide text-paper uppercase">Utility</h1>
        <p className="mt-2 text-sm text-mist">Admins can edit the prices, correct saved amounts, manage office staff, and update the website notice. Office staff do not see this page.</p>
      </div>
      <nav className="flex flex-wrap gap-2" aria-label="Settings sections">
        {sections.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="rounded-full border border-white/15 px-3 py-1.5 text-sm text-paper hover:border-cyan/50 hover:text-cyan">{label}</a>
        ))}
      </nav>

      <StaffManager />
      <PriceSettings />
      <AmountRecords />
      <NoticeManager />
      <BackupPanel />
      <ActivityLog />

      <section id="protection" className={`${card} grid gap-3`}>
        <h2 className="flex items-center gap-2 text-xl text-paper"><Lock size={18} aria-hidden="true" /> Data protection</h2>
        <p className="text-sm text-mist">The database rules block deleting customer data for everyone, including admins. This cannot be switched off from the desk.</p>
        <ul className="grid gap-2 text-sm text-paper sm:grid-cols-2">
          {[
            "Players and their mobile numbers can be edited but never deleted.",
            "Sessions, paid minutes, and amounts can never be deleted.",
            "Points changes go to a ledger that cannot be edited or deleted.",
            "Every edit, correction, and staff change is written to the activity log.",
            "Removing a staff member keeps everything they recorded.",
            "Website visitors cannot read or write any customer data.",
          ].map((line) => (
            <li key={line} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">{line}</li>
          ))}
        </ul>
      </section>

      <section id="loyalty" className={`${card} grid gap-3`}>
        <h2 className="text-xl text-paper">Loyalty rules</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          {[
            ["Point", `1 point for every ${POINT_MINUTES} paid minutes`],
            ["Weekly target", `${WEEKLY_TARGET} points, Monday to Sunday, India time`],
            ["Reward", `${REWARD_MINUTES} free minutes, once each week, used when that session is completed`],
            ["Reward time", "Those 30 minutes are not charged and do not earn points. Time after them does both."],
            ["Balance", "Lifetime points stay. The weekly reward is not subtracted. A manual correction does not change the weekly reward."],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <dt className="text-xs text-mist">{label}</dt>
              <dd className="mt-1 text-sm text-paper">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-mist">The database rules check every session: no more than one point per 60 paid minutes, and the same session cannot be awarded twice.</p>
      </section>
    </div>
  );
}
