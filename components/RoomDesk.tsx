"use client";

import { CheckCircle2, Search, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { FloorBoard, type DeskCustomer } from "@/components/FloorBoard";
import { useDesk } from "@/components/admin/AdminShell";
import {
  extendLiveSession,
  findCustomer,
  openLiveSession,
  recordPaidSession,
  registerCustomer,
  subscribeActiveSessions,
  type CustomerProfile,
  type LiveTimer,
} from "@/lib/loyaltyApi";
import { normalizePhone, WEEKLY_TARGET } from "@/lib/loyalty";
import { currentMembership, formatDay, planLabel, sessionsLeft, spendSessions, type Membership } from "@/lib/membershipApi";
import { markStationBusy, releaseStationAfterSession, subscribeStationStatus } from "@/lib/stationStatus";

function CustomerLookup({
  customers,
  customer,
  onCustomer,
  onRegistered,
  membership,
  useMember,
  onUseMember,
}: {
  customers: DeskCustomer[];
  customer: CustomerProfile | null;
  onCustomer: (customer: CustomerProfile | null) => void;
  onRegistered: () => void;
  membership: Membership | null;
  useMember: boolean;
  onUseMember: (value: boolean) => void;
}) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [missing, setMissing] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const needle = query.trim().toLowerCase();
  const digits = query.replace(/\D/g, "");
  const matches = customers
    .filter((item) => {
      if (!needle) return true;
      return item.name.toLowerCase().includes(needle) || (digits.length >= 2 && item.phone.includes(digits));
    })
    .slice(0, 8);

  async function choose(item: DeskCustomer) {
    setOpen(false);
    setQuery("");
    setMissing(false);
    setPending(true);
    setMessage("");
    try {
      const found = await findCustomer(item.phone);
      if (!found) {
        setMessage("That customer could not be opened. Pick them on the console instead.");
        return;
      }
      onCustomer(found);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Search failed.");
    } finally {
      setPending(false);
    }
  }

  async function searchNew() {
    setPending(true);
    setMessage("");
    setMissing(false);
    try {
      const found = await findCustomer(query);
      onCustomer(found);
      if (!found) setMissing(true);
      else setQuery("");
    } catch (reason) {
      onCustomer(null);
      setMessage(reason instanceof Error ? reason.message : "Search failed.");
    } finally {
      setPending(false);
    }
  }

  const rewardReady = Boolean(customer && customer.weeklyPoints >= WEEKLY_TARGET && !customer.rewardRedeemed);

  return (
    <section className="mb-6 rounded-xl border border-white/10 bg-[#101624] p-4">
      <form
        className="relative flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          if (matches.length === 1) {
            void choose(matches[0]);
            return;
          }
          if (!normalizePhone(query)) {
            setMessage(matches.length ? "Pick a customer from the list." : "No customer with that name. Choose them on the console, or search a 10-digit mobile to register someone new.");
            return;
          }
          void searchNew();
        }}
      >
        <label className="block flex-1 text-sm text-mist">
          Find a customer by name or mobile
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
              setMissing(false);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 150)}
            className="desk-input mt-1"
            placeholder="Type a name or mobile number"
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          <Search size={15} aria-hidden="true" />
          {pending ? "Searching…" : "Search"}
        </button>
        {open && !customer ? (
          <ul id={listId} role="listbox" className="absolute top-full z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-white/15 bg-[#101624] shadow-lg sm:w-[calc(100%-8.5rem)]">
            {customers.length === 0 ? (
              <li className="px-3 py-2 text-sm text-mist">No saved customers yet. Register a mobile number below, or type the name on the console.</li>
            ) : matches.length === 0 ? (
              <li className="px-3 py-2 text-sm text-mist">No customer matches. Search a full mobile number to register someone new.</li>
            ) : (
              matches.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-white/5"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => void choose(item)}
                  >
                    <span className="font-medium text-paper">{item.name}</span>
                    <span className="text-mist">{item.phone || "No mobile"}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </form>

      {customer ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4 text-sm">
          <CheckCircle2 size={18} className="text-cyan" aria-hidden="true" />
          <p className="text-paper">
            <strong>{customer.name}</strong> · {customer.phone}. Name and mobile are filled on each open console.
          </p>
          {rewardReady ? <span className="rounded-full border border-cyan/40 bg-cyan/10 px-2.5 py-1 text-xs text-cyan">Free 30 minutes ready — start it on one console</span> : null}
          {membership ? (
            <label className="flex items-center gap-2 rounded-full border border-cyan/40 bg-cyan/10 px-3 py-1 text-xs text-cyan">
              <input type="checkbox" checked={useMember} onChange={(event) => onUseMember(event.target.checked)} />
              {planLabel(membership.plan)} member · {sessionsLeft(membership)} of {membership.sessionsTotal} left · until {formatDay(membership.endAt)} · use for this booking
            </label>
          ) : null}
          <div className="ml-auto flex flex-wrap gap-2">
            <Link href={`/admin/players/${customer.id}`} className="btn btn-secondary min-h-9 px-3">
              View details
            </Link>
            <button
              type="button"
              className="btn btn-secondary min-h-9 px-3"
              aria-label="Clear the selected player"
              onClick={() => {
                onCustomer(null);
                setQuery("");
                setMessage("");
              }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}

      {missing ? (
        <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="grid gap-3">
            <p className="text-sm text-paper">No player on this number yet. Register them to start earning points.</p>
            <label className="block text-sm text-mist">
              Player name
              <input value={name} onChange={(event) => setName(event.target.value)} className="desk-input mt-1" maxLength={60} />
            </label>
            <label className="flex items-start gap-2 text-sm text-mist">
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1" />
              The player agrees to store their name and mobile number for loyalty points.
            </label>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={pending}
            onClick={() => {
              if (!consent) {
                setMessage("Tick consent before registering the player.");
                return;
              }
              setPending(true);
              void registerCustomer(query, name)
                .then((created) => {
                  onCustomer(created);
                  onRegistered();
                  setMissing(false);
                  setQuery("");
                  setMessage(created ? `${created.name} is registered.` : "Could not save this player.");
                })
                .catch((reason: unknown) => setMessage(reason instanceof Error ? reason.message : "Could not register."))
                .finally(() => setPending(false));
            }}
          >
            <UserPlus size={15} aria-hidden="true" />
            Register player
          </button>
        </div>
      ) : null}

      {message ? <p className="mt-3 text-sm text-paper" role="status">{message}</p> : null}
    </section>
  );
}

export function RoomDesk() {
  const desk = useDesk();
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [useMember, setUseMember] = useState(true);
  const [result, setResult] = useState("");
  const [remoteSessions, setRemoteSessions] = useState<LiveTimer[]>([]);
  const [timersReady, setTimersReady] = useState(false);
  const [stationUntil, setStationUntil] = useState<Record<string, number | null>>({});

  useEffect(() => {
    return subscribeActiveSessions(
      (rows) => {
        setRemoteSessions(rows);
        setTimersReady(true);
      },
      () => {
        setTimersReady(true);
        setResult("Open sessions could not be loaded. Refresh this page before starting a timer.");
      },
    );
  }, []);

  useEffect(() => {
    return subscribeStationStatus((entries) => {
      const next: Record<string, number | null> = {};
      for (const [id, entry] of Object.entries(entries)) next[id] = entry.status === "busy" ? entry.until : null;
      setStationUntil(next);
    }, () => undefined);
  }, []);
  const customers: DeskCustomer[] = (desk.data?.players ?? [])
    .map((player) => ({ id: player.id, name: player.name, phone: player.phone }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  function pickCustomer(next: CustomerProfile | null) {
    setCustomer(next);
    if (next?.id === customer?.id) return;
    setMembership(null);
    setUseMember(true);
    if (next) void currentMembership(next.id).then(setMembership);
  }

  const deskMembership = membership && useMember ? { id: membership.id, left: sessionsLeft(membership), endsLabel: formatDay(membership.endAt) } : null;
  const rewardReady = Boolean(customer && customer.weeklyPoints >= WEEKLY_TARGET && !customer.rewardRedeemed);

  return (
    <>
      <CustomerLookup
        customers={customers}
        customer={customer}
        onCustomer={pickCustomer}
        onRegistered={() => desk.reload()}
        membership={membership}
        useMember={useMember}
        onUseMember={setUseMember}
      />
      {result ? (
        <p className="mb-4 rounded-xl border border-cyan/40 bg-cyan/10 px-4 py-3 text-sm text-paper" role="status">{result}</p>
      ) : null}
      <FloorBoard
        wall
        activeCustomer={customer ? { id: customer.id, name: customer.name, phone: customer.phone, membership: deskMembership, rewardReady } : null}
        customers={customers}
        customersLoading={desk.loading && customers.length === 0}
        readOnly={!desk.canEdit("gaming")}
        timersReady={timersReady}
        remoteSessions={remoteSessions}
        stationUntil={stationUntil}
        onLookupMembership={async (customerId) => {
          const found = await currentMembership(customerId);
          if (!found) return null;
          return { id: found.id, left: sessionsLeft(found), endsLabel: formatDay(found.endAt) };
        }}
        onStart={async (play) => {
          await openLiveSession(play);
          desk.reload();
          void markStationBusy(play.stationId, play.startedAt + play.bookedMinutes * 60 * 1000).catch((reason: unknown) => {
            setResult(reason instanceof Error ? reason.message : "The timer started, but the website was not updated.");
          });
          const count = play.memberSessions ?? 0;
          if (play.membershipId && count) {
            void spendSessions(play.membershipId, count, play.stationId, `${play.stationId}_${play.startedAt}`)
              .then((updated) => {
                setMembership(updated);
                setResult(`${play.name}: used ${count} membership session${count > 1 ? "s" : ""}. ${sessionsLeft(updated)} left until ${formatDay(updated.endAt)}.`);
              })
              .catch((reason: unknown) => {
                setResult(`The membership was not updated: ${reason instanceof Error ? reason.message : "unknown error"} Collect payment for this session, or fix it on the Members page.`);
              });
          }
        }}
        onExtend={(play) => {
          void markStationBusy(play.stationId, play.endsAt).catch(() => undefined);
          void extendLiveSession(play).catch((reason: unknown) => {
            const code = typeof reason === "object" && reason && "code" in reason ? String((reason as { code: string }).code) : "";
            if (code === "permission-denied") return;
            setResult(reason instanceof Error ? reason.message : "The extra 15 minutes is on screen, but it was not saved yet.");
          });
        }}
        onFinish={(play) => {
          void releaseStationAfterSession(play.stationId).catch(() => undefined);
          void recordPaidSession(play)
            .then(async (text) => {
              const money = play.collectedRupees
                ? ` ₹${play.collectedRupees.toLocaleString("en-IN")} added to ${play.name} and to today's revenue.`
                : play.reward
                  ? " The free reward was not added to revenue."
                  : ` No rupees were added. Points still follow the paid time when ${play.name} has a mobile number.`;
              setResult(`${text}${money}`);
              desk.reload();
              if (!normalizePhone(play.phone)) return;
              const next = await findCustomer(play.phone).catch(() => null);
              if (next) setCustomer(next);
            })
            .catch((reason: unknown) => {
              setResult(reason instanceof Error ? reason.message : "Points were not saved. The timer is cleared.");
            });
        }}
      />
    </>
  );
}
