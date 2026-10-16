import type { Metadata } from "next";
import { SessionsDesk } from "@/components/admin/SessionsDesk";

export const metadata: Metadata = { title: "Session history", robots: { index: false, follow: false } };

export default function HistoryPage() {
  return <SessionsDesk mode="history" />;
}
