import type { Metadata } from "next";
import { AdminLogin } from "@/components/admin/AdminLogin";

export const instant = false;
export const metadata: Metadata = { title: "Admin login", robots: { index: false, follow: false } };

export default function LoginPage() {
  return <AdminLogin />;
}
