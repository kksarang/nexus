import type { Metadata } from "next";
import { RedemptionsDesk } from "@/components/admin/RewardsDesk";

export const metadata: Metadata = { title: "Rewards", robots: { index: false, follow: false } };

export default function RewardsPage() {
  return <RedemptionsDesk />;
}
