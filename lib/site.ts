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
    "Nexus Playzone is a PS5 gaming station in Panoor, Kannur, for Thalassery and nearby. Six consoles, a private room, and the latest games for a proper game experience.",
} as const;

// Paste the Google Play listing link here. Until then the site says the app is coming soon.
export const playStoreUrl: string = "";

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (process.env.NODE_ENV === "development") return "http://localhost:3000";
  return "https://www.nexusplayzone.com";
}

export function whatsappLink(message: string) {
  return `${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

export const messages = {
  book: "Hi Nexus Playzone, I would like to book a PS5 session in Panoor. Please share what is available.",
  room: "Hi Nexus Playzone, I would like to book the private gaming room. Please share what is available.",
  pricing: "Hi Nexus Playzone, could you share your current hourly rates, group packages, and offers?",
  membership: "Hi Nexus Playzone, I would like to know about the monthly, quarterly, and yearly membership plans.",
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
    detail: "Stations 01 to 04 on the main floor.",
    rupees: 160,
    unit: "per hour",
  },
  {
    key: "simulator",
    label: "Car simulator",
    detail: "Station 05. The driving simulator on the main floor.",
    rupees: 180,
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
];

export const offers: { title: string; body: string; code?: string }[] = [];

export const memberships = [
  {
    key: "monthly",
    tier: "Monthly",
    months: 1,
    fit: "20 sessions on Stations 01 to 04 for one month.",
    rupees: 2000,
    sessions: 20,
    featured: false,
  },
  {
    key: "quarterly",
    tier: "Quarterly",
    months: 3,
    fit: "60 sessions on Stations 01 to 04 for three months.",
    rupees: 5400,
    sessions: 60,
    featured: true,
  },
  {
    key: "yearly",
    tier: "Yearly",
    months: 12,
    fit: "240 sessions on Stations 01 to 04 for twelve months.",
    rupees: 16800,
    sessions: 240,
    featured: false,
  },
] as const;

export const nav = [
  { href: "/stations", label: "Stations" },
  { href: "/private-room", label: "Private Room" },
  { href: "/games", label: "Games" },
  { href: "/pricing", label: "Pricing" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const footerExplore = [
  { href: "/stations", label: "Stations" },
  { href: "/private-room", label: "Private Room" },
  { href: "/games", label: "Games" },
  { href: "/pricing", label: "Pricing" },
  { href: "/membership", label: "Membership" },
] as const;

export const footerNexus = [
  { href: "/book", label: "Book a session" },
  { href: "/player", label: "Rewards" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const highlights = [
  { value: "06", label: "PS5 stations" },
  { value: "01", label: "Private room" },
  { value: "PS5", label: "New consoles" },
  { value: "Panoor", label: "Kannur, Kerala" },
] as const;

export type Game = {
  title: string;
  genre: string;
  modes: string;
  accent: string;
  about: string;
  bestFor: string;
  story?: boolean;
  image?: string;
  alt?: string;
};

export const games: Game[] = [
  {
    title: "EA Sports FC", about: "Football with real clubs, players, and leagues. Settle it in a quick match with a friend or build your squad over a longer session.", bestFor: "Football rivalries with your friends",
    genre: "Football",
    modes: "Latest edition · 1–2 players",
    image: "/images/games/game-fc.jpg",
    alt: "A football on a green floodlit pitch",
    accent: "#3DDC6A",
  },
  {
    title: "WWE 2K", about: "Step into the ring with WWE superstars across singles, tag team, and multi-man matches.", bestFor: "Loud group sessions",
    genre: "Wrestling",
    modes: "Latest 2K · 1–4 players",
    image: "/images/games/game-wwe.jpg",
    alt: "A wrestling ring under red and gold lights",
    accent: "#FF3B30",
  },
  {
    title: "GTA V", about: "Follow Michael, Franklin, and Trevor through a run of high-stakes heists across the huge open world of Los Santos.", bestFor: "Free-roaming and big story missions", story: true,
    genre: "Open world",
    modes: "Story · GTA Online",
    image: "/images/games/game-gta.jpg",
    alt: "A car on an amber night street",
    accent: "#FF9F1A",
  },
  {
    title: "Marvel’s Spider-Man 2", about: "Swing through Marvel’s New York as Peter Parker and Miles Morales, and take on Venom and Kraven the Hunter.", bestFor: "Superhero fans who want a full story", story: true,
    genre: "Action adventure",
    modes: "Solo story",
    image: "/images/games/game-spiderman.jpg",
    alt: "A city split between red light and blue light",
    accent: "#4C6FFF",
  },
  {
    title: "Star Wars: Galactic Racer", about: "High-speed racing set in the Star Wars galaxy.", bestFor: "Star Wars fans and racing players",
    genre: "Racing",
    modes: "Solo · 2026",
    image: "/images/games/game-racing.jpg",
    alt: "A car on a track with lime light trails",
    accent: "#D6FF3F",
  },
  {
    title: "Ghost of Yōtei", about: "Play as Atsu, a lone mercenary in 1600s Japan, on a hunt for the gang who destroyed her family.", bestFor: "Samurai action and a strong story", story: true,
    genre: "Action",
    modes: "Solo story · PS5",
    accent: "#F5C542",
  },
  { title: "NBA 2K", about: "Basketball with real NBA teams and players, from quick games to full-court battles with friends.", bestFor: "Basketball fans", genre: "Sports", modes: "Latest 2K · 1–4 players", accent: "#FF7A1A" },
  { title: "Cricket 24", about: "Cricket on PS5 with bat-and-ball action across formats. Bring a friend and play a local match.", bestFor: "Cricket fans", genre: "Sports", modes: "Local versus", accent: "#2FD5A7" },
  { title: "Rocket League", about: "Football with rocket-powered cars. Quick matches, simple to start, and hard to put down.", bestFor: "Short, competitive sessions", genre: "Sports", modes: "1–4 players", accent: "#2E9BFF" },
  { title: "Tekken 8", about: "The 3D fighting series continues the Mishima family feud between Jin and Kazuya, with a big roster for head-to-head battles.", bestFor: "One-on-one rivalries", genre: "Fighting", modes: "1–2 players", accent: "#FF3D6E" },
  { title: "Mortal Kombat 1", about: "A reborn Mortal Kombat universe shaped by Liu Kang, with brutal fights and a cinematic story mode.", bestFor: "Fighting game fans", genre: "Fighting", modes: "1–2 players", accent: "#FFB020" },
  { title: "Street Fighter 6", about: "Classic and new fighters meet in fast one-on-one matches, plus a World Tour story mode.", bestFor: "Fighters of every skill level", genre: "Fighting", modes: "1–2 players", accent: "#FF4FD8" },
  { title: "Gran Turismo 7", about: "A driving game built around car culture, with a large collection of cars and famous tracks.", bestFor: "Car lovers", genre: "Racing", modes: "1–2 players", accent: "#37B6FF" },
  { title: "F1", about: "Race as the official F1 teams and drivers on real Grand Prix circuits.", bestFor: "Motorsport fans", genre: "Racing", modes: "Latest season · 1–2 players", accent: "#FF2A2A" },
  { title: "Call of Duty", about: "Fast first-person action with a cinematic campaign and online multiplayer.", bestFor: "Shooter fans", genre: "Shooter", modes: "Campaign · Online", accent: "#9BE34B" },
  { title: "Fortnite", about: "Drop into a 100-player battle royale, gather gear, build, and be the last one standing.", bestFor: "Online matches", genre: "Shooter", modes: "Battle royale · Online", accent: "#A66BFF" },
  { title: "God of War Ragnarök", about: "Kratos and Atreus journey through the Nine Realms as Ragnarök approaches, in an emotional father-and-son story.", bestFor: "Epic story and big battles", story: true, genre: "Action adventure", modes: "Solo story", accent: "#7CC7FF" },
  { title: "The Last of Us Part II", about: "Ellie’s story of revenge and its cost, set in a dangerous post-apocalyptic America.", bestFor: "Players who want a powerful, mature story", story: true, genre: "Action adventure", modes: "Solo story", accent: "#8FBF6A" },
  { title: "Elden Ring", about: "Explore the Lands Between, a vast and dark fantasy world, and face some of gaming’s toughest bosses.", bestFor: "Players who love a challenge", story: true, genre: "Action adventure", modes: "Solo · Online co-op", accent: "#E0B84C" },
  { title: "Red Dead Redemption 2", about: "Live as outlaw Arthur Morgan in 1899 as the Van der Linde gang falls apart at the end of the Wild West.", bestFor: "Long, immersive story sessions", story: true, genre: "Open world", modes: "Solo story", accent: "#E5533D" },
  { title: "It Takes Two", about: "Cody and May are turned into dolls and must work together to get home. Every level is built for two players.", bestFor: "Couples and best friends", story: true, genre: "Co-op", modes: "2 players", accent: "#FF8AC4" },
  { title: "Split Fiction", about: "Writers Mio and Zoe get trapped inside their own stories and need each other to escape. Built for two players.", bestFor: "Co-op with a friend", story: true, genre: "Co-op", modes: "2 players", accent: "#5CE1E6" },
  { title: "Minecraft", about: "Build anything you can imagine, explore, and survive in a world made of blocks.", bestFor: "All ages and relaxed sessions", genre: "Co-op", modes: "1–4 players", accent: "#6FCF4A" },
  { title: "Astro Bot", about: "A joyful platform adventure where Astro travels across colourful worlds to rescue his crew.", bestFor: "Kids, families, and anyone who wants fun", genre: "Co-op", modes: "Solo adventure", accent: "#4C8DFF" },
  { title: "Cyberpunk 2077", about: "Play as V, a mercenary in Night City, chasing a one-of-a-kind implant with the digital ghost of Johnny Silverhand in your head.", bestFor: "Sci-fi and choice-driven stories", story: true, genre: "Open world", modes: "Solo story", accent: "#FCEE0A" },
  { title: "Hogwarts Legacy", about: "Live as a Hogwarts student in the 1800s, learn spells, and explore the wizarding world in your own adventure.", bestFor: "Harry Potter fans", story: true, genre: "Open world", modes: "Solo story", accent: "#C9A24B" },
  { title: "Horizon Forbidden West", about: "Aloy travels into a dangerous frontier full of giant machines to uncover why the world is dying.", bestFor: "Exploration and sci-fi adventure", story: true, genre: "Open world", modes: "Solo story", accent: "#FF7A45" },
  { title: "Assassin’s Creed Shadows", about: "Play as shinobi Naoe and samurai Yasuke in feudal Japan, in two connected stories.", bestFor: "History and stealth action", story: true, genre: "Open world", modes: "Solo story", accent: "#D6423B" },
  { title: "Ghost of Tsushima", about: "Samurai Jin Sakai fights to free his island from the Mongol invasion of 1274.", bestFor: "Samurai fans", story: true, genre: "Action adventure", modes: "Solo story", accent: "#E8E2C8" },
  { title: "Final Fantasy VII Rebirth", about: "Cloud and his friends leave Midgar behind and head out into a huge world in this reimagined classic.", bestFor: "RPG fans", story: true, genre: "Action adventure", modes: "Solo story", accent: "#6FA8FF" },
  { title: "Uncharted: Legacy of Thieves", about: "Treasure hunters Nathan Drake and Chloe Frazer chase lost fortunes in two cinematic adventures.", bestFor: "Movie-style action", story: true, genre: "Action adventure", modes: "Solo story", accent: "#E9A23B" },
  { title: "Black Myth: Wukong", about: "Journey as the Destined One through a mythic China inspired by Journey to the West, with huge boss fights.", bestFor: "Mythology and hard boss battles", story: true, genre: "Action adventure", modes: "Solo story", accent: "#D8A24A" },
  { title: "Resident Evil 4", about: "Agent Leon Kennedy is sent to a sinister village in Europe to rescue the president’s daughter.", bestFor: "Horror and action", story: true, genre: "Action", modes: "Solo story", accent: "#B3261E" },
  { title: "Alan Wake 2", about: "A survival horror thriller following FBI agent Saga Anderson and writer Alan Wake as a dark story comes to life.", bestFor: "Horror and mystery", story: true, genre: "Action", modes: "Solo story", accent: "#7E9BC9" },
];

export function gameSlug(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f’']/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isGameInGenre(game: Game, genre: string) {
  return genre === "All" || (genre === "Story" ? Boolean(game.story) : game.genre === genre);
}

export const gameGenres = ["All", "Story", "Football", "Sports", "Wrestling", "Fighting", "Racing", "Shooter", "Open world", "Action adventure", "Action", "Co-op"];

export const stations = [
  {
    id: "01",
    name: "PlayStation 01",
    privateRoom: false,
    rate: "station",
    image: "/images/ps5-console.jpg",
    alt: "PlayStation 5 console and controller on a dark desk",
    objectPosition: "center",
    summary: "A new PS5 on the main floor, ready when you sit down.",
  },
  {
    id: "02",
    name: "PlayStation 02",
    privateRoom: false,
    rate: "station",
    image: "/images/hero-lounge.jpg",
    alt: "A wide screen and PlayStation 5 in a dark lounge",
    objectPosition: "center",
    summary: "A new PS5 station for the next match with your crew.",
  },
  {
    id: "03",
    name: "PlayStation 03",
    privateRoom: false,
    rate: "station",
    image: "/images/controller-glow.jpg",
    alt: "A controller lit in cyan and purple",
    objectPosition: "center",
    summary: "Settle in with a friend on a new PlayStation 5.",
  },
  {
    id: "04",
    name: "PlayStation 04",
    privateRoom: false,
    rate: "station",
    image: "/images/hero-lounge.jpg",
    alt: "Screen light across a dark gaming desk",
    objectPosition: "72% center",
    summary: "A full PS5 setup for shared sessions on the main floor.",
  },
  {
    id: "05",
    name: "Car Simulator",
    privateRoom: false,
    rate: "simulator",
    image: "/images/games/game-racing.jpg",
    alt: "A car on a track with lime light trails",
    objectPosition: "center",
    summary: "The car simulator on the main floor.",
  },
  {
    id: "06",
    name: "Private Room",
    privateRoom: true,
    rate: "private",
    image: "/images/private-room.jpg",
    alt: "Private gaming room with a PlayStation 5, a large screen, and two chairs",
    objectPosition: "center",
    summary: "The dedicated private-room console. A more personal session on a new PS5.",
  },
] as const;

export function rateForStation(id: string) {
  const station = stations.find((item) => item.id === id);
  return rates.find((rate) => rate.key === station?.rate) ?? rates[0];
}

export const gallery = [
  { src: "/images/hero-lounge.jpg", alt: "The lounge in low light with a console and screen", tag: "Lounge", wide: true },
  { src: "/images/ps5-console.jpg", alt: "A PlayStation 5 console", tag: "Consoles" },
  { src: "/images/private-room.jpg", alt: "The private gaming room", tag: "Private room" },
  { src: "/images/crew-session.jpg", alt: "Friends playing in front of a wide screen", tag: "Gaming moments", wide: true },
  { src: "/images/controller-glow.jpg", alt: "A controller in neon light", tag: "Setup", wide: true },
] as const;

export const founders = [
  { name: "Vishnu", role: "Co-founder", initial: "V", image: "/images/founders/vishnu.jpg" },
  { name: "Sarang", role: "Co-founder", initial: "S", image: "/images/founders/sarang.jpg" },
  { name: "Adarsh", role: "Co-founder", initial: "A", image: "/images/founders/adarsh.jpg" },
] as const;
