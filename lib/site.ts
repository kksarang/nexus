export const site = {
  name: "Nexus Playzone",
  tagline: "Play. Connect. Level Up.",
  phoneDisplay: "+91 99952 54290",
  phoneTel: "+919995254290",
  email: "nexusplayzon@gmail.com",
  location: "Panoor, Kannur, Kerala, India",
  whatsapp: "https://wa.me/919995254290",
  maps: "https://www.google.com/maps/search/?api=1&query=Nexus+Playzone+Panoor+Kannur+Kerala",
  directions:
    "https://www.google.com/maps/dir/?api=1&destination=Nexus+Playzone+Panoor+Kannur+Kerala",
  mapEmbed: "https://www.google.com/maps?q=Nexus+Playzone+Panoor+Kannur+Kerala&output=embed",
  description:
    "Experience next-generation PS5 gaming at Nexus Playzone, Panoor, Kannur. Explore six console stations, a dedicated private gaming room, and a new way to play with friends.",
} as const;

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

export function whatsappLink(message: string) {
  return `${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

export const messages = {
  book: "Hi Nexus Playzone, I would like to book a PS5 session in Panoor. Please share what is available.",
  room: "Hi Nexus Playzone, I would like to book the private gaming room. Please share what is available.",
  pricing: "Hi Nexus Playzone, could you share your current hourly rates, group packages, and offers?",
  membership: "Hi Nexus Playzone, I would like to know about monthly membership plans.",
  games: "Hi Nexus Playzone, could you share the full list of games available right now?",
} as const;

/**
 * Fill these in when they are confirmed. Empty values render as
 * "Ask on WhatsApp" so the site never shows a number that is not real.
 */
export const hours: { days: string; time: string }[] = [];

export const rates: {
  key: string;
  label: string;
  detail: string;
  rupees: number | null;
  unit: string;
  featured?: boolean;
}[] = [
  {
    key: "station",
    label: "PS5 station",
    detail: "Stations 01 to 05 on the main floor.",
    rupees: 160,
    unit: "per hour",
  },
  {
    key: "private",
    label: "Private room",
    detail: "Station 06. The room and the PS5 are yours for the session.",
    rupees: 200,
    unit: "per hour",
    featured: true,
  },
  {
    key: "monthly",
    label: "Monthly plan",
    detail: "20 sessions on the main floor. ₹100 a session instead of ₹160.",
    rupees: 2000,
    unit: "for 20 sessions",
  },
];

export const offers: { title: string; body: string; code?: string }[] = [];

export const memberships = [
  {
    key: "monthly",
    tier: "Monthly",
    fit: "20 sessions on Stations 01 to 05. The private room stays at its hourly rate.",
    rupees: 2000,
    sessions: 20,
    perks: ["20 sessions in the month", "₹100 a session instead of ₹160", "Any main-floor station"],
    featured: true,
  },
] as const;

export const nav = [
  { href: "/stations", label: "Stations" },
  { href: "/private-room", label: "Private Room" },
  { href: "/room", label: "Room" },
  { href: "/games", label: "Games" },
  { href: "/pricing", label: "Pricing" },
  { href: "/gallery", label: "Gallery" },
  { href: "/visit", label: "Visit" },
] as const;

export const highlights = [
  { value: "06", label: "PS5 stations" },
  { value: "01", label: "Private room" },
  { value: "PS5", label: "New consoles" },
  { value: "Panoor", label: "Kannur, Kerala" },
] as const;

export const games = [
  {
    title: "EA Sports FC",
    genre: "Football",
    modes: "1–2 players · Online",
    image: "/images/games/game-fc.jpg",
    alt: "A football on a green floodlit pitch",
    accent: "#3DDC6A",
  },
  {
    title: "WWE 2K",
    genre: "Wrestling",
    modes: "1–4 players",
    image: "/images/games/game-wwe.jpg",
    alt: "A wrestling ring under red and gold lights",
    accent: "#FF3B30",
  },
  {
    title: "GTA V",
    genre: "Open world",
    modes: "Solo · Online",
    image: "/images/games/game-gta.jpg",
    alt: "A car on an amber night street",
    accent: "#FF9F1A",
  },
  {
    title: "Marvel’s Spider-Man",
    genre: "Action adventure",
    modes: "Solo story",
    image: "/images/games/game-spiderman.jpg",
    alt: "A city split between red light and blue light",
    accent: "#4C6FFF",
  },
  {
    title: "Racing games",
    genre: "Racing",
    modes: "Solo · Split-screen",
    image: "/images/games/game-racing.jpg",
    alt: "A car on a track with lime light trails",
    accent: "#D6FF3F",
  },
] as const;

export const gameGenres = ["All", "Football", "Wrestling", "Open world", "Action adventure", "Racing"] as const;

export const stations = [
  {
    id: "01",
    name: "PlayStation 01",
    privateRoom: false,
    image: "/images/ps5-console.jpg",
    alt: "PlayStation 5 console and controller on a dark desk",
    objectPosition: "center",
    summary: "A new PS5 on the main floor, ready when you sit down.",
  },
  {
    id: "02",
    name: "PlayStation 02",
    privateRoom: false,
    image: "/images/hero-lounge.jpg",
    alt: "A wide screen and PlayStation 5 in a dark lounge",
    objectPosition: "center",
    summary: "A new PS5 station for the next match with your crew.",
  },
  {
    id: "03",
    name: "PlayStation 03",
    privateRoom: false,
    image: "/images/controller-glow.jpg",
    alt: "A controller lit in cyan and purple",
    objectPosition: "center",
    summary: "Settle in with a friend on a new PlayStation 5.",
  },
  {
    id: "04",
    name: "PlayStation 04",
    privateRoom: false,
    image: "/images/hero-lounge.jpg",
    alt: "Screen light across a dark gaming desk",
    objectPosition: "72% center",
    summary: "A full PS5 setup for shared sessions on the main floor.",
  },
  {
    id: "05",
    name: "PlayStation 05",
    privateRoom: false,
    image: "/images/crew-session.jpg",
    alt: "Two people seated together in front of a large screen",
    objectPosition: "center",
    summary: "A new PS5 station for friends to play side by side.",
  },
  {
    id: "06",
    name: "Private Room",
    privateRoom: true,
    image: "/images/private-room.jpg",
    alt: "Private gaming room with a PlayStation 5, a large screen, and two chairs",
    objectPosition: "center",
    summary: "The dedicated private-room console. A more personal session on a new PS5.",
  },
] as const;

export const gallery = [
  { src: "/images/hero-lounge.jpg", alt: "The lounge in low light with a console and screen", tag: "Lounge", wide: true },
  { src: "/images/ps5-console.jpg", alt: "A PlayStation 5 console", tag: "Consoles" },
  { src: "/images/private-room.jpg", alt: "The private gaming room", tag: "Private room" },
  { src: "/images/crew-session.jpg", alt: "Friends playing in front of a wide screen", tag: "Gaming moments", wide: true },
  { src: "/images/controller-glow.jpg", alt: "A controller in neon light", tag: "Setup" },
] as const;

export const founders = [
  { name: "Adarsh", role: "Co-founder", initial: "A" },
  { name: "Sarang", role: "Co-founder", initial: "S" },
  { name: "Vishnu", role: "Co-founder", initial: "V" },
] as const;
