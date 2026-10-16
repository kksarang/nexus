import { Suspense, type ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

export const instant = false;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="admin-light min-h-svh bg-slate-50" />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
