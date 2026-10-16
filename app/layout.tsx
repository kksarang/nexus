import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter, Orbitron } from "next/font/google";
import { Suspense } from "react";
import { BackToTop } from "@/components/BackToTop";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { MobileBar } from "@/components/MobileBar";
import { Providers } from "@/components/Providers";
import { getSiteUrl, site } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-orbitron",
  display: "swap",
});

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

const title = "Nexus Playzone | Premium PS5 Gaming Station in Panoor, Kannur";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: title,
    template: "%s | Nexus Playzone",
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "Nexus Playzone",
    "gaming station in Panoor",
    "PS5 gaming in Panoor",
    "gaming station in Kannur",
    "PlayStation gaming in Kannur",
    "private gaming room in Panoor",
    "gaming zone in Panoor",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: site.name,
    title,
    description: site.description,
    images: [
      {
        url: "/images/hero-lounge.jpg",
        width: 1280,
        height: 720,
        alt: "PlayStation 5 lounge with cyan and purple light",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: site.description,
    images: ["/images/hero-lounge.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#050610",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${orbitron.variable} ${barlow.variable} h-full antialiased`}
    >
      <body className="stage min-h-full font-sans text-paper antialiased">
        <Providers>
          <div className="relative z-10 flex min-h-svh flex-col">
            <a href="#content" className="skip-link">
              Skip to content
            </a>
            <Suspense fallback={<div className="h-[4.5rem]" />}>
              <Header />
            </Suspense>
            <div className="flex-1">{children}</div>
            <Footer />
            <MobileBar />
            <BackToTop />
          </div>
        </Providers>
        <JsonLd />
      </body>
    </html>
  );
}
