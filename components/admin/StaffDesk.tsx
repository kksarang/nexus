"use client";

import { StaffManager } from "@/components/admin/StaffManager";

export function StaffDesk() {
  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl tracking-wide text-paper uppercase">Staff</h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">Add, rename, or remove the people who can use this desk.</p>
      </div>
      <StaffManager />
    </div>
  );
}
