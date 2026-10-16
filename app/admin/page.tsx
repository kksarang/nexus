import type { Metadata } from "next";
import { Overview } from "@/components/admin/Overview";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <Overview />;
}
