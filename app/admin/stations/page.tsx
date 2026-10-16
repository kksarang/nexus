import type { Metadata } from "next";
import { StationsDesk } from "@/components/admin/StationsDesk";

export const metadata: Metadata = { title: "Stations", robots: { index: false, follow: false } };

export default function StationsPage() {
  return <StationsDesk />;
}
