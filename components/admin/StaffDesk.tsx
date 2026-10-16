"use client";

import { StaffManager } from "@/components/admin/StaffManager";

export function StaffDesk() {
  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl tracking-wide text-paper uppercase">Office staff</h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">Create office logins, choose which sections they can view or edit, and keep revenue and staff setup for admins.</p>
      </div>
      <StaffManager />
    </div>
  );
}
