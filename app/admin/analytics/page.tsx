import type { Metadata } from "next";
import { AnalyticsDesk } from "@/components/admin/AnalyticsDesk";

export const metadata: Metadata = { title: "Analytics", robots: { index: false, follow: false } };

export default function AnalyticsPage() {
  return <AnalyticsDesk />;
}
