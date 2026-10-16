"use client";

import { DeskNote, RangeBar } from "@/components/admin/RangeBar";
import { useDesk } from "@/components/admin/AdminShell";
import { closedSessions, dayKey, downloadCsv, formatIst, hoursLabel, inRange, stationTotals } from "@/lib/adminStats";

export function ReportsDesk() {
  const desk = useDesk();
  const sessions = desk.data ? closedSessions(desk.data.sessions, desk.from, desk.to) : [];
  const players = desk.data?.players ?? [];
  const stations = desk.data ? stationTotals(desk.data.sessions, desk.from, desk.to) : [];
  const created = players.filter((player) => player.createdAt && inRange(player.createdAt, desk.from, desk.to));
  const playedIds = new Set(sessions.map((session) => session.customerId));
  const returning = [...playedIds].filter((id) => {
    const player = players.find((item) => item.id === id);
    return player && player.createdAt > 0 && player.createdAt < desk.from;
  });

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl tracking-wide text-paper uppercase">Reports</h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          Downloads use the selected dates. Rupee columns are estimated from the station rate. The site does not store a separate payment receipt.
        </p>
      </div>
      <RangeBar />
      <DeskNote />
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" className="btn btn-secondary" onClick={() => downloadCsv("daily-estimated-takings.csv", [
          ["Date", "Sessions", "Paid hours", "Estimated rupees", "Points"],
          ...groupDays(sessions),
        ])}>Daily estimated takings</button>
        <button type="button" className="btn btn-secondary" onClick={() => downloadCsv("station-hours.csv", [
          ["Station", "Sessions", "Paid hours", "Estimated rupees"],
          ...stations.map((station) => [station.name, station.sessions, hoursLabel(station.minutes), station.amount]),
        ])}>Hours by station</button>
        <button type="button" className="btn btn-secondary" onClick={() => downloadCsv("sessions.csv", [
          ["Session", "Player", "Mobile", "Station", "Start", "End", "Paid minutes", "Estimated rupees", "Points", "Status", "Staff id"],
          ...sessions.map((session) => [session.id, session.name, session.phone, session.stationName, formatIst(session.startedAt), formatIst(session.endedAt), session.paidMinutes, session.amountRupees, session.points, session.status, session.by]),
        ])}>Session history</button>
        <button type="button" className="btn btn-secondary" onClick={() => downloadCsv("players.csv", [
          ["Name", "Mobile", "Registered", "Hours", "Sessions", "Available points", "Rewards", "Last played"],
          ...players.map((player) => [player.name, player.phone, formatIst(player.createdAt), hoursLabel(player.lifetimeMinutes), player.sessionCount, player.lifetimePoints, player.rewardsRedeemed, formatIst(player.lastPlayedAt)]),
        ])}>Player activity</button>
        <button type="button" className="btn btn-secondary" onClick={() => downloadCsv("new-and-returning.csv", [
          ["Type", "Name", "Mobile"],
          ...created.map((player) => ["New registration", player.name, player.phone]),
          ...returning.map((id) => {
            const player = players.find((item) => item.id === id);
            return ["Returning", player?.name ?? id, player?.phone ?? ""];
          }),
        ])}>New and returning players</button>
        <button type="button" className="btn btn-secondary" onClick={() => downloadCsv("reward-redemptions.csv", [
          ["Player id", "Week points", "Redeemed at"],
          ...(desk.data?.weeks ?? []).filter((week) => week.redeemedAt && inRange(week.redeemedAt, desk.from, desk.to)).map((week) => [week.customerId, week.points, formatIst(week.redeemedAt)]),
        ])}>Reward redemptions</button>
        <button type="button" className="btn btn-secondary" onClick={() => downloadCsv("staff-activity.csv", staffRows(sessions))}>Staff activity</button>
      </div>
    </div>
  );
}

function groupDays(sessions: ReturnType<typeof closedSessions>) {
  const map = new Map<string, { sessions: number; minutes: number; amount: number; points: number }>();
  for (const session of sessions) {
    const key = dayKey(session.endedAt);
    const row = map.get(key) ?? { sessions: 0, minutes: 0, amount: 0, points: 0 };
    row.sessions += 1;
    row.minutes += session.paidMinutes;
    row.amount += session.amountRupees;
    row.points += session.points;
    map.set(key, row);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, row]) => [key, row.sessions, hoursLabel(row.minutes), row.amount, row.points]);
}

function staffRows(sessions: ReturnType<typeof closedSessions>) {
  const map = new Map<string, number>();
  for (const session of sessions) map.set(session.by || "unknown", (map.get(session.by || "unknown") ?? 0) + 1);
  return [["Staff id", "Sessions closed"], ...[...map.entries()]];
}
