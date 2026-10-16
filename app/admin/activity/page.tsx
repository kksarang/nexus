import type { Metadata } from "next";
import { ActivityDesk } from "@/components/admin/ActivityDesk";

export const metadata: Metadata = { title: "Activity", robots: { index: false, follow: false } };

export default function ActivityPage() {
  return <ActivityDesk />;
}
