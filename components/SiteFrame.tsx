"use client";

import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { Analytics } from "@/components/Analytics";
import { BackToTop } from "@/components/BackToTop";
import { FinalCta } from "@/components/FinalCta";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileBar } from "@/components/MobileBar";
import { SiteNotice } from "@/components/SiteNotice";

export function SiteFrame({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <Chrome>{children}</Chrome>
    </Suspense>
  );
}

function Chrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return <>{children}</>;

  return (
    <div className="site-skin">
      <Suspense fallback={<div className="h-20" />}>
        <Header />
      </Suspense>
      <div key={pathname} className="page-in flex-1">{children}</div>
      {pathname === "/book" ? null : <FinalCta />}
      <Footer />
      <MobileBar />
      <BackToTop />
      <SiteNotice />
      <Analytics />
    </div>
  );
}
