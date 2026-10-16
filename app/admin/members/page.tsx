import type { Metadata } from "next";
import { MembersDesk } from "@/components/admin/MembersDesk";

export const metadata: Metadata = { title: "Members", robots: { index: false, follow: false } };

export default function MembersPage() {
  return <MembersDesk />;
}
