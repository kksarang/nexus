import type { Metadata } from "next";
import { AdminDesk } from "@/components/AdminDesk";

export const metadata: Metadata = {
  title: "Admin",
  description: "Nexus Playzone staff analytics.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main id="content">
      <section className="pt-28 pb-20 sm:pt-32 sm:pb-24">
        <div className="shell">
          <p className="font-tech text-[0.65rem] tracking-[0.28em] text-cyan uppercase">Staff</p>
          <h1 className="mt-3 text-5xl leading-none tracking-wide text-paper uppercase sm:text-7xl">Loyalty report</h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-mist">
            Paid hours, station use, peak times, and rewards. This page is for staff accounts only.
          </p>
          <div className="mt-8">
            <AdminDesk />
          </div>
        </div>
      </section>
    </main>
  );
}
