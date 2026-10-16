"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DeskNote } from "@/components/admin/RangeBar";
import { useDesk } from "@/components/admin/AdminShell";
import { downloadCsv, formatIst, hoursLabel, playerKind, type OpsPlayer } from "@/lib/adminStats";

const filters = ["all", "new", "regular", "inactive", "frequent"] as const;
const sorts = [
  ["points", "Points"],
  ["hours", "Hours"],
  ["sessions", "Sessions"],
  ["last", "Last played"],
] as const;

export function PlayersDesk() {
  const desk = useDesk();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [sort, setSort] = useState<(typeof sorts)[number][0]>("points");
  const [registeredFrom, setRegisteredFrom] = useState("");
  const [registeredTo, setRegisteredTo] = useState("");
  const [page, setPage] = useState(0);
  const needle = query.trim().toLowerCase();
  const phoneNeedle = query.replace(/\D/g, "");

  const visible = useMemo(() => {
    const players = desk.data?.players ?? [];
    const from = registeredFrom ? Date.parse(`${registeredFrom}T00:00:00+05:30`) : 0;
    const to = registeredTo ? Date.parse(`${registeredTo}T23:59:59+05:30`) : Number.POSITIVE_INFINITY;
    const rows = players.filter((player) => {
      const matchesText = !needle || player.name.toLowerCase().includes(needle) || (phoneNeedle.length >= 3 && player.phone.includes(phoneNeedle));
      const kind = playerKind(player);
      const matchesKind = filter === "all" || kind === filter;
      const matchesDate = !player.createdAt || (player.createdAt >= from && player.createdAt <= to);
      return matchesText && matchesKind && matchesDate;
    });
    rows.sort((a, b) => {
      if (sort === "hours") return b.lifetimeMinutes - a.lifetimeMinutes;
      if (sort === "sessions") return b.sessionCount - a.sessionCount;
      if (sort === "last") return b.lastPlayedAt - a.lastPlayedAt;
      return b.lifetimePoints - a.lifetimePoints;
    });
    return rows;
  }, [desk.data, needle, phoneNeedle, filter, sort, registeredFrom, registeredTo]);

  const pageSize = 12;
  const pages = Math.max(1, Math.ceil(visible.length / pageSize));
  const slice = visible.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl tracking-wide text-paper uppercase">Players</h1>
        <p className="mt-2 text-sm text-mist">Available points are the lifetime balance. Weekly rewards do not reduce that balance.</p>
      </div>
      <DeskNote />
      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
        <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} className="desk-input" placeholder="Search name or mobile" />
        <select value={filter} onChange={(event) => { setFilter(event.target.value as (typeof filters)[number]); setPage(0); }} className="desk-input">
          {filters.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value as (typeof sorts)[number][0])} className="desk-input">
          {sorts.map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        <label className="text-xs text-mist">Registered from
          <input type="date" value={registeredFrom} onChange={(event) => setRegisteredFrom(event.target.value)} className="desk-input mt-1" />
        </label>
        <label className="text-xs text-mist">to
          <input type="date" value={registeredTo} onChange={(event) => setRegisteredTo(event.target.value)} className="desk-input mt-1" />
        </label>
        <button
          type="button"
          className="btn btn-secondary mt-5"
          onClick={() => downloadCsv("nexus-players.csv", [
            ["Name", "Mobile", "Registered", "Hours", "Sessions", "Week points", "Month points", "Year points", "Available points", "Rewards", "Last played"],
            ...visible.map((player) => playerRow(player)),
          ])}
        >
          Download
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[68rem] text-left text-sm">
          <thead className="bg-[#101624] text-[0.62rem] tracking-[0.12em] text-mist uppercase">
            <tr>
              {["Player", "Mobile", "Registered", "Hours", "Sessions", "Week", "Month", "Year", "Available", "Rewards", "Last played"].map((heading) => (
                <th key={heading} className="px-3 py-3 font-medium">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.length ? slice.map((player) => (
              <tr key={player.id} className="border-t border-white/10">
                <td className="px-3 py-3"><Link href={`/admin/players/${player.id}`} className="text-cyan">{player.name}</Link></td>
                <td className="px-3 py-3 text-mist">{player.phone || "—"}</td>
                <td className="px-3 py-3 text-mist">{formatIst(player.createdAt)}</td>
                <td className="px-3 py-3">{hoursLabel(player.lifetimeMinutes)}</td>
                <td className="px-3 py-3">{player.sessionCount}</td>
                <td className="px-3 py-3">{player.weekPoints}</td>
                <td className="px-3 py-3">{player.monthPoints}</td>
                <td className="px-3 py-3">{player.yearPoints}</td>
                <td className="px-3 py-3 font-tech">{player.lifetimePoints}</td>
                <td className="px-3 py-3">{player.rewardsRedeemed}</td>
                <td className="px-3 py-3 text-mist">{formatIst(player.lastPlayedAt)}</td>
              </tr>
            )) : (
              <tr><td colSpan={11} className="px-3 py-6 text-mist">No players match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm text-mist">
        <p>{visible.length} players</p>
        <div className="flex gap-2">
          <button type="button" className="btn btn-secondary min-h-10" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>Previous</button>
          <button type="button" className="btn btn-secondary min-h-10" disabled={page + 1 >= pages} onClick={() => setPage((current) => current + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}

function playerRow(player: OpsPlayer) {
  return [
    player.name,
    player.phone,
    formatIst(player.createdAt),
    hoursLabel(player.lifetimeMinutes),
    player.sessionCount,
    player.weekPoints,
    player.monthPoints,
    player.yearPoints,
    player.lifetimePoints,
    player.rewardsRedeemed,
    formatIst(player.lastPlayedAt),
  ];
}
