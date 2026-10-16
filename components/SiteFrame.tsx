"use client";

import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { BackToTop } from "@/components/BackToTop";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileBar } from "@/components/MobileBar";

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
    <>
      <Suspense fallback={<div className="h-20 lg:h-36" />}>
        <Header />
      </Suspense>
      <div className="flex-1">{children}</div>
      <Footer />
      <MobileBar />
      <BackToTop />
    </>
  );
}
