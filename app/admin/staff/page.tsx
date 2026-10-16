import type { Metadata } from "next";
import { StaffDesk } from "@/components/admin/StaffDesk";

export const metadata: Metadata = { title: "Staff", robots: { index: false, follow: false } };

export default function StaffPage() {
  return <StaffDesk />;
}
