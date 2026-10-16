"use client";

import { useState } from "react";
import { FloorBoard } from "@/components/FloorBoard";
import { LoyaltyDesk } from "@/components/LoyaltyDesk";
import { findCustomer, recordPaidSession, type CustomerProfile } from "@/lib/loyaltyApi";
import { normalizePhone } from "@/lib/loyalty";

export function RoomDesk() {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [result, setResult] = useState("");

  return (
    <>
      <LoyaltyDesk customer={customer} onCustomer={setCustomer} />
      {result ? (
        <p className="mb-4 rounded-2xl border border-violet/40 bg-violet/10 px-4 py-3 text-sm text-paper">{result}</p>
      ) : null}
      <FloorBoard
        wall
        activeCustomer={customer ? { name: customer.name, phone: customer.phone } : null}
        onFinish={(play) => {
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
