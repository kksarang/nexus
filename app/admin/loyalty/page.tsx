import type { Metadata } from "next";
import { RewardsDesk } from "@/components/admin/RewardsDesk";

export const metadata: Metadata = { title: "Loyalty", robots: { index: false, follow: false } };

export default function LoyaltyPage() {
  return <RewardsDesk />;
}
