import type { Metadata } from "next";
import { ReportsDesk } from "@/components/admin/ReportsDesk";

export const metadata: Metadata = { title: "Reports", robots: { index: false, follow: false } };

export default function ReportsPage() {
  return <ReportsDesk />;
}
