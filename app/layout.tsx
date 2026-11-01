import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Chakra_Petch, Inter, Orbitron } from "next/font/google";
import { JsonLd } from "@/components/JsonLd";
import { Providers } from "@/components/Providers";
import { SiteFrame } from "@/components/SiteFrame";
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

const chakra = Chakra_Petch({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-chakra",
  display: "swap",
});

const title = "Nexus Playzone | PS5 Gaming Station in Panoor, Thalassery and Kannur";

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
    "PS5 gaming station in Panoor",
    "gaming station in Thalassery",
    "PS5 gaming in Thalassery",
    "game station in Kannur",
    "Panoor gaming",
    "private gaming room in Panoor",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: site.name,
    title,
    description: site.description,
    images: [
      {
        url: "/brand/og.jpg",
        width: 1200,
        height: 630,
        alt: "Nexus Playzone logo on a purple nebula",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: site.description,
    images: ["/brand/og.jpg"],
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
      className={`${inter.variable} ${orbitron.variable} ${barlow.variable} ${chakra.variable} h-full antialiased`}
    >
      <body className="stage min-h-full font-sans text-paper antialiased">
        <Providers>
          <div className="relative z-10 flex min-h-svh flex-col">
            <a href="#content" className="skip-link">
              Skip to content
            </a>
            <SiteFrame>{children}</SiteFrame>
          </div>
        </Providers>
        <JsonLd />
      </body>
    </html>
  );
}
