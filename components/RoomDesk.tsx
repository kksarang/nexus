"use client";

import { CheckCircle2, Search, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { FloorBoard } from "@/components/FloorBoard";
import {
  findCustomer,
  openLiveSession,
  recordPaidSession,
  redeemReward,
  registerCustomer,
  type CustomerProfile,
} from "@/lib/loyaltyApi";
import { normalizePhone, WEEKLY_TARGET } from "@/lib/loyalty";
import { markStationBusy, releaseStationAfterSession } from "@/lib/stationStatus";

function CustomerLookup({
  customer,
  onCustomer,
}: {
  customer: CustomerProfile | null;
  onCustomer: (customer: CustomerProfile | null) => void;
}) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [missing, setMissing] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function search() {
    setPending(true);
    setMessage("");
    setMissing(false);
    try {
      const found = await findCustomer(phone);
      onCustomer(found);
      if (!found) setMissing(true);
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
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          void search();
        }}
      >
        <label className="block flex-1 text-sm text-mist">
          Find a registered player by mobile number
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="desk-input mt-1"
            inputMode="tel"
            placeholder="10-digit mobile"
            maxLength={16}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          <Search size={15} aria-hidden="true" />
          {pending ? "Searching…" : "Search"}
        </button>
      </form>

      {customer ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4 text-sm">
          <CheckCircle2 size={18} className="text-cyan" aria-hidden="true" />
          <p className="text-paper">
            <strong>{customer.name}</strong> is registered. Their name and number fill the next session you start.
          </p>
          {rewardReady ? <span className="rounded-full border border-cyan/40 bg-cyan/10 px-2.5 py-1 text-xs text-cyan">Free 30 minutes ready</span> : null}
          <div className="ml-auto flex flex-wrap gap-2">
            {rewardReady ? (
              <button
                type="button"
                className="btn btn-secondary min-h-9 px-3"
                disabled={pending}
                onClick={() => {
                  setPending(true);
                  void redeemReward(customer.id)
                    .then(async () => {
                      const next = await findCustomer(customer.phone);
                      if (next) onCustomer(next);
                      setMessage("Free 30 minutes marked as used.");
                    })
                    .catch((reason: unknown) => setMessage(reason instanceof Error ? reason.message : "Could not redeem."))
                    .finally(() => setPending(false));
                }}
              >
                Redeem free 30 min
              </button>
            ) : null}
            <Link href={`/admin/players/${customer.id}`} className="btn btn-secondary min-h-9 px-3">
              View details
            </Link>
            <button
              type="button"
              className="btn btn-secondary min-h-9 px-3"
              aria-label="Clear the selected player"
              onClick={() => {
                onCustomer(null);
                setPhone("");
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
              void registerCustomer(phone, name)
                .then((created) => {
                  onCustomer(created);
                  setMissing(false);
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
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [result, setResult] = useState("");

  return (
    <>
      <CustomerLookup customer={customer} onCustomer={setCustomer} />
      {result ? (
        <p className="mb-4 rounded-xl border border-cyan/40 bg-cyan/10 px-4 py-3 text-sm text-paper" role="status">{result}</p>
      ) : null}
      <FloorBoard
        wall
        activeCustomer={customer ? { name: customer.name, phone: customer.phone } : null}
        onStart={(play) => {
          void openLiveSession(play).catch(() => undefined);
          void markStationBusy(play.stationId, play.startedAt + play.bookedMinutes * 60 * 1000).catch(() => undefined);
        }}
        onExtend={(stationId, endsAt) => {
          void markStationBusy(stationId, endsAt).catch(() => undefined);
        }}
        onFinish={(play) => {
          void releaseStationAfterSession(play.stationId).catch(() => undefined);
          void recordPaidSession(play)
            .then(async (text) => {
              setResult(text);
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
