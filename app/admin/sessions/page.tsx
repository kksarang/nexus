import type { Metadata } from "next";
import { SessionsDesk } from "@/components/admin/SessionsDesk";

export const metadata: Metadata = { title: "Live sessions", robots: { index: false, follow: false } };

export default function SessionsPage() {
  return <SessionsDesk mode="live" />;
}
