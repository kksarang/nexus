"use client";

import { useEffect, useState } from "react";
import { useDesk } from "@/components/admin/AdminShell";
import { formatIst } from "@/lib/adminStats";
import { listStaff, loadActivity, loadPlayHistory } from "@/lib/manageApi";

type Line = { id: string; at: number; who: string; what: string; play: string };

function visibleText(text: string, showMoney: boolean) {
  if (showMoney) return text;
  return text.replace(/\s*·\s*₹[\d,]+/g, "").replace(/₹[\d,]+/g, "");
}

export function ActivityDesk() {
  const desk = useDesk();
  const showMoney = desk.canSee("revenue");
  const [lines, setLines] = useState<Line[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancel = false;
    void Promise.all([loadActivity(200), loadPlayHistory(200), listStaff().catch(() => [])])
      .then(([activity, plays, staff]) => {
        if (cancel) return;
        const names = Object.fromEntries(staff.map((item) => [item.id, item.name || item.email]));
        const who = (id: string, saved: string) => saved || names[id] || (id ? `Staff ${id.slice(0, 6)}` : "—");
        const covered = new Set(activity.map((item) => item.sessionId).filter(Boolean));
        const fromActivity: Line[] = activity.map((item) => ({
          id: item.id,
          at: item.at,
          who: who(item.by, item.byName),
          what: visibleText(item.summary, showMoney),
          play: item.play,
        }));
        const fromPlay: Line[] = plays
          .filter((item) => !covered.has(item.id))
          .map((item) => ({
            id: `play-${item.id}`,
            at: item.at,
            who: who(item.by, ""),
            what: `${item.name} on ${item.stationName}${showMoney && item.recorded ? ` · ₹${item.amount}` : ""}`,
            play: item.play,
          }));
        setLines([...fromActivity, ...fromPlay].sort((a, b) => b.at - a.at));
        setError("");
      })
      .catch((reason: unknown) => {
        if (!cancel) setError(reason instanceof Error ? reason.message : "Could not load the activity history.");
      });
    return () => {
      cancel = true;
    };
  }, [showMoney]);

  const needle = query.trim().toLowerCase();
  const visible = lines.filter((line) => !needle || `${line.who} ${line.what} ${line.play}`.toLowerCase().includes(needle));

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl tracking-wide text-paper uppercase">Activity</h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          Every admin and office login can read this. It shows who did what, what was edited, and how long was played. Nothing on this page can be added, changed, or deleted. The desk writes each line into Firebase when the work happens.
        </p>
      </div>
      <input className="desk-input max-w-md" placeholder="Search a person, console, or change" value={query} onChange={(event) => setQuery(event.target.value)} />
      {error ? <p className="text-sm text-magenta">{error}</p> : null}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="bg-[#101624] text-xs text-mist">
            <tr>{["When", "Who", "What happened", "Play"].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}</tr>
          </thead>
          <tbody>
            {visible.length ? visible.map((line) => (
              <tr key={line.id} className="border-t border-white/10">
                <td className="whitespace-nowrap px-4 py-3 text-mist">{formatIst(line.at)}</td>
                <td className="px-4 py-3 text-paper">{line.who}</td>
                <td className="px-4 py-3 text-paper">{line.what}</td>
                <td className="px-4 py-3 text-mist">{line.play || "—"}</td>
              </tr>
            )) : <tr><td colSpan={4} className="px-4 py-6 text-mist">{error ? "" : "No activity recorded yet."}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
