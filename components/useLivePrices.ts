"use client";

import { useSyncExternalStore } from "react";
import { defaultPrices, getPrices, subscribePriceStore, type PriceBook } from "@/lib/prices";

export function useLivePrices(): PriceBook {
  return useSyncExternalStore(subscribePriceStore, getPrices, () => defaultPrices);
}
