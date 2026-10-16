import type { Metadata } from "next";
import { RevenueDesk } from "@/components/admin/RevenueDesk";

export const metadata: Metadata = { title: "Revenue", robots: { index: false, follow: false } };

export default function RevenuePage() {
  return <RevenueDesk />;
}
