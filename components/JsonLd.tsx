import { founders, getSiteUrl, site } from "@/lib/site";

export function JsonLd() {
  const url = getSiteUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "EntertainmentBusiness",
    name: site.name,
    slogan: site.tagline,
    description: site.description,
    url,
    image: `${url}/images/hero-lounge.jpg`,
    telephone: "+91-99952-54290",
    email: site.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Panoor",
      addressRegion: "Kerala",
      addressCountry: "IN",
    },
    areaServed: ["Panoor", "Kannur"],
    hasMap: site.maps,
    founder: founders.map((founder) => ({
      "@type": "Person",
      name: founder.name,
      jobTitle: founder.role,
    })),
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
