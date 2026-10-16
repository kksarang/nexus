"use client";

import Link from "next/link";
import { useState } from "react";
import { PlayerCard } from "@/components/PlayerCard";
import { StaffSignIn, useStaff } from "@/components/StaffAccess";
import { findCustomer, redeemReward, registerCustomer, type CustomerProfile } from "@/lib/loyaltyApi";

export function LoyaltyDesk({
  customer,
  onCustomer,
}: {
  customer: CustomerProfile | null;
  onCustomer: (customer: CustomerProfile | null) => void;
}) {
  const staff = useStaff();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState("");
  const [missing, setMissing] = useState(false);
  const [pending, setPending] = useState(false);

  async function search() {
    setPending(true);
    setMessage("");
    setMissing(false);
    try {
      const found = await findCustomer(phone);
      onCustomer(found);
      if (!found) {
        setMissing(true);
        setMessage("No player on this number yet.");
      }
    } catch (reason) {
      onCustomer(null);
      setMessage(reason instanceof Error ? reason.message : "Search failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <div className="grid content-start gap-4">
        <StaffSignIn />
        {staff.status === "staff" ? (
          <form
            className="grid gap-3 rounded-2xl border border-white/10 bg-black/30 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              void search();
            }}
          >
            <p className="font-tech text-[0.62rem] tracking-[0.2em] text-cyan uppercase">Customer lookup</p>
            <label className="block">
              <span className="text-[0.62rem] tracking-[0.16em] text-mist uppercase">Mobile number</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="desk-input mt-2"
                inputMode="tel"
                placeholder="10-digit mobile"
                maxLength={16}
              />
            </label>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "Searching" : "Search customer"}
            </button>
            {missing ? (
              <div className="grid gap-3 border-t border-white/10 pt-3">
                <label className="block">
                  <span className="text-[0.62rem] tracking-[0.16em] text-mist uppercase">Customer name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="desk-input mt-2"
                    maxLength={60}
                  />
                </label>
                <label className="flex items-start gap-3 text-sm text-mist">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                    className="mt-1"
                  />
                  Customer agrees to store their name and mobile number for loyalty points.
                </label>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={pending}
                  onClick={() => {
                    if (!consent) {
                      setMessage("Tick consent before creating the player.");
                      return;
                    }
                    setPending(true);
                    void registerCustomer(phone, name)
                      .then((created) => {
                        onCustomer(created);
                        setMissing(false);
                        setMessage(created ? `${created.name} is registered.` : "Could not save this player.");
                      })
                      .catch((reason: unknown) => {
                        setMessage(reason instanceof Error ? reason.message : "Could not register.");
                      })
                      .finally(() => setPending(false));
                  }}
                >
                  Register player
                </button>
              </div>
            ) : null}
            {message ? <p className="text-sm text-paper">{message}</p> : null}
          </form>
        ) : null}
        <p className="text-xs leading-relaxed text-mist">
          One point for every 60 paid minutes. Ten points from Monday to Sunday unlocks 30 free minutes.{" "}
          <Link href="/player" className="text-cyan">
            Players check their own card
          </Link>
          {" · "}
          <Link href="/admin" className="text-cyan">
            Admin
          </Link>
        </p>
      </div>
      <div className="grid content-start gap-4">
        {customer ? (
          <>
            <PlayerCard customer={customer} />
            {staff.status === "staff" && customer.weeklyPoints >= 10 && !customer.rewardRedeemed ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setPending(true);
                  void redeemReward(customer.id)
                    .then(async () => {
                      const next = await findCustomer(customer.phone);
                      if (next) onCustomer(next);
                      setMessage("Free 30 minutes marked as used.");
                    })
                    .catch((reason: unknown) => {
                      setMessage(reason instanceof Error ? reason.message : "Could not redeem.");
                    })
                    .finally(() => setPending(false));
                }}
              >
                Redeem free 30 minutes
              </button>
            ) : null}
          </>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/15 p-6 text-sm leading-relaxed text-mist">
            Search a mobile number to see weekly points, lifetime play, and whether a free 30-minute session is ready.
            The number is the lookup key. Ending a console with that number awards points for paid time only.
          </div>
        )}
      </div>
    </section>
  );
}
