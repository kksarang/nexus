# Nexus Playzone

Premium website for Nexus Playzone, a PS5 gaming station in Panoor, Kannur.

Booking is handled on WhatsApp. There is no online payment or reservation system on this site.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The private room and live session clocks are at [http://localhost:3000/room](http://localhost:3000/room).

## Production build

```bash
npm run build
npm start
```

## Deploy

1. Push the project to GitHub.
2. Import it on [Vercel](https://vercel.com).
3. Set `NEXT_PUBLIC_SITE_URL` to the live domain, for example `https://nexusplayzone.com`.
4. Deploy. Vercel detects Next.js automatically.

The same environment variable is used for the canonical URL, Open Graph images, sitemap, and local business data.

## Edit the business details

Phone, email, WhatsApp messages, station copy, and founder names live in `lib/site.ts`.

Images live in `public/images`. The logo is `public/logo.jpg`. Keep the logo proportions if you replace it.
