"use client";

import { Eye, Pencil, UserPlus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DeskNote } from "@/components/admin/RangeBar";
import { useDesk } from "@/components/admin/AdminShell";
import { addPlayer, updatePlayer } from "@/lib/adminApi";
import { downloadCsv, formatIst, hoursLabel, playerKind, type OpsPlayer } from "@/lib/adminStats";

type Editing = { id: string | null; name: string; phone: string };

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
  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const needle = query.trim().toLowerCase();

  function openForm(next: Editing) {
    setEditing(next);
    setFormError("");
    setNotice("");
  }

  function save() {
    if (!editing) return;
    const current = editing;
    setSaving(true);
    setFormError("");
    const task = current.id ? updatePlayer(current.id, current.name, current.phone) : addPlayer(current.name, current.phone);
    void task
      .then(() => {
        setNotice(current.id ? `${current.name.trim()} was updated.` : `${current.name.trim()} was added.`);
        setEditing(null);
        desk.reload();
      })
      .catch((reason: unknown) => setFormError(reason instanceof Error ? reason.message : "The player could not be saved."))
      .finally(() => setSaving(false));
  }
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl tracking-wide text-paper uppercase">Players</h1>
          <p className="mt-2 text-sm text-mist">Open a player to see their hours, sessions, weekly progress, rewards, and full history.</p>
        </div>
        {desk.canEdit("customers") ? (
          <button type="button" className="btn btn-primary" onClick={() => openForm({ id: null, name: "", phone: "" })}>
            <UserPlus size={16} aria-hidden="true" />
            Add player
          </button>
        ) : null}
      </div>
      {notice ? (
        <p className="rounded-xl border border-cyan/40 bg-cyan/10 px-3 py-2 text-sm text-cyan" role="status">{notice}</p>
      ) : null}
      {editing ? (
        <form
          className="grid gap-4 rounded-2xl border border-cyan/30 bg-[#0d1322] p-5"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <h2 className="text-2xl tracking-wide text-paper uppercase">{editing.id ? "Edit player" : "Add player"}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-mist">
              Name
              <input
                value={editing.name}
                onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                className="desk-input mt-1"
                autoComplete="off"
                required
              />
            </label>
            <label className="text-sm text-mist">
              Mobile number
              <input
                value={editing.phone}
                onChange={(event) => setEditing({ ...editing, phone: event.target.value })}
                className="desk-input mt-1"
                inputMode="numeric"
                placeholder="98765 43210"
                autoComplete="off"
                required
              />
            </label>
          </div>
          {editing.id ? (
            <p className="text-xs text-mist">Points, hours, and session history stay with this player when the name or number changes.</p>
          ) : null}
          {formError ? (
            <p className="rounded-xl border border-magenta/40 bg-magenta/10 px-3 py-2 text-sm text-magenta" role="alert">{formError}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : editing.id ? "Save changes" : "Add player"}
            </button>
            <button type="button" className="btn btn-secondary" disabled={saving} onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}
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
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="bg-[#101624] text-xs text-mist">
            <tr>
              {["Player", "Mobile", "Points", "Last played", ""].map((heading, index) => (
                <th key={heading || `col-${index}`} className="px-4 py-3 font-medium">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.length ? slice.map((player) => (
              <tr key={player.id} className="border-t border-white/10">
                <td className="px-4 py-3 font-medium text-paper">{player.name}</td>
                <td className="px-4 py-3 text-mist">{player.phone || "—"}</td>
                <td className="px-4 py-3 text-paper">{player.lifetimePoints}</td>
                <td className="px-4 py-3 text-mist">{player.lastPlayedAt ? formatIst(player.lastPlayedAt) : "Not yet"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/players/${player.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-paper hover:border-cyan/50 hover:text-cyan"
                    >
                      <Eye size={13} aria-hidden="true" />
                      View details
                    </Link>
                    {desk.canEdit("customers") ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-paper hover:border-cyan/50 hover:text-cyan"
                        onClick={() => {
                          openForm({ id: player.id, name: player.name, phone: player.phone });
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        <Pencil size={13} aria-hidden="true" />
                        Edit
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-mist">
                  {desk.data?.players.length ? "No players match these filters." : "No players yet. Use Add player to register the first one."}
                </td>
              </tr>
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
