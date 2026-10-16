import type { Metadata } from "next";
import { SettingsDesk } from "@/components/admin/SettingsDesk";

export const metadata: Metadata = { title: "Settings", robots: { index: false, follow: false } };

export default function SettingsPage() {
  return <SettingsDesk />;
}