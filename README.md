# Nesci — Your Personal Learning Guide to This Codebase

This README is written specifically for you. It explains every decision that was made when building this project — not just *what* exists, but *why* it exists and *how* it works. Read it top to bottom the first time, then use it as a reference whenever something confuses you.

---

## What Did We Actually Build?

Nesci is an event discovery app. The home screen shows:
- A **dark-themed map** (Google Maps) covering most of the screen, with glowing purple pins for events near you
- A **sidebar on the right** listing those same events as cards
- A **navbar** fixed to the top with the Nesci brand

When you open the app in a browser:
1. Your browser asks for your GPS location
2. The app sends those coordinates to its own backend
3. The backend asks Ticketmaster "what events are near this location?"
4. Ticketmaster responds with a list of events
5. The map drops pins and the sidebar fills with cards

That's the full loop. Everything below explains how each layer makes that happen.

---

## The Folder Structure — What Lives Where and Why

```
Nesci_start/
│
├── app/                        ← Everything Next.js serves as pages or APIs
│   ├── layout.tsx              ← The outer shell every page shares (Navbar lives here)
│   ├── page.tsx                ← The home page at localhost:3000/
│   ├── globals.css             ← Global styles — colors, neon glow effects, fonts
│   └── api/
│       └── events/
│           └── route.ts        ← Your backend endpoint: GET /api/events
│
├── components/                 ← Reusable UI building blocks
│   ├── Navbar.tsx              ← The top bar with the NESCI logo
│   ├── EventMap.tsx            ← The Google Map with pins
│   └── EventList.tsx           ← The sidebar list of event cards
│
├── lib/                        ← Shared logic and utilities (not UI)
│   ├── types.ts                ← The definition of what an "Event" object looks like
│   ├── supabase.ts             ← The connection to your Supabase database
│   └── ticketmaster.ts         ← The function that fetches events from Ticketmaster
│
├── .env.local                  ← Your secret API keys (never commit this to GitHub)
├── tailwind.config.ts          ← Tailwind color palette customized for Nesci's neon theme
├── tsconfig.json               ← TypeScript settings (already configured — don't touch)
├── next.config.mjs             ← Next.js settings (empty for now, add things as needed)
└── package.json                ← Lists all the packages/libraries the project depends on
```

**The mental model:** `app/` is what the user sees and what the server handles. `components/` are the puzzle pieces that make up the UI. `lib/` is the brain — logic that has nothing to do with how things look.

---

## The Tech Stack — Plain English

### Next.js 14 (App Router)
Next.js is the main framework. Think of it as the engine. It handles:
- **Routing** — `/` goes to `app/page.tsx`, `/events` would go to `app/events/page.tsx`. The folder structure IS the URL structure.
- **Server-side rendering** — Some code runs on the server before the page reaches your browser, making it load faster.
- **API routes** — Files inside `app/api/` become backend endpoints. `app/api/events/route.ts` becomes the URL `/api/events`. This means your app has a built-in backend — you don't need a separate Node/Express server.

The "App Router" is Next.js's newer system (introduced in version 13). The key thing it introduces is the concept of **Server Components** vs **Client Components**, explained below.

### Server Components vs Client Components — The Most Important Concept Here

This is the #1 thing that trips people up in Next.js 14.

**Server Components** (default):
- Run on the server when the page is first requested
- Never run in the browser
- Can't use browser APIs (`navigator`, `window`, `document`)
- Can't use React hooks (`useState`, `useEffect`)
- Faster initial load because the HTML arrives pre-built
- Example in this project: `app/page.tsx` (no `"use client"` at the top = server component)

**Client Components**:
- Marked with `"use client"` at the very top of the file
- Run in the browser after the page loads
- CAN use browser APIs and React hooks
- Required whenever you need interactivity or browser-only features
- Examples in this project: `EventMap.tsx`, `EventList.tsx`, `Navbar.tsx`

**Why does this matter for Nesci?**
- The map needs Google Maps, which only works in a browser → Client Component
- The event list needs `navigator.geolocation` (GPS) → Client Component
- The home page itself (`page.tsx`) just arranges layout → Server Component is fine

### TypeScript
TypeScript is JavaScript with type annotations. Instead of:
```js
let event = { name: "Concert", lat: 40.7, lng: -74.0 }
```
You write:
```ts
let event: Event = { name: "Concert", lat: 40.7, lng: -74.0 }
```
If you try to pass `event.lat` where a string is expected, TypeScript catches it before the code even runs. The `Event` type is defined in `lib/types.ts` — that's the "contract" every piece of the app agrees to when talking about events.

### Tailwind CSS
Tailwind is a CSS framework where you style things by adding class names directly in your HTML/JSX instead of writing separate CSS files. Examples:
- `text-sm` = small text
- `flex` = display flex
- `p-4` = padding 1rem on all sides
- `bg-bg-secondary` = background color set to our custom dark color

The custom colors (`neon-purple`, `neon-cyan`, `bg-card`, etc.) are defined in `tailwind.config.ts`. Any color you add there becomes available as a Tailwind class.

### Google Maps (`@react-google-maps/api`)
This is a React wrapper around the Google Maps JavaScript SDK. Instead of manipulating the map with raw JavaScript, you use React components:
```tsx
<GoogleMap center={...} zoom={12}>
  <Marker position={...} />
</GoogleMap>
```
It needs your Google Maps API key (set in `.env.local`) to work. The map is fully customized with a dark style in `EventMap.tsx` — those are style rules that override Google's default map colors.

### Ticketmaster API
Ticketmaster has a public API called the Discovery API. You send it coordinates and it returns nearby events. The function that does this is in `lib/ticketmaster.ts`. It uses `fetch()` — the same browser/Node built-in you may have used before. The result gets shaped into the `Event` type from `lib/types.ts`.

### Supabase (PostgreSQL)
Supabase is a hosted Postgres database with a JavaScript client. Right now the connection is set up in `lib/supabase.ts` but nothing is reading from or writing to it yet. It's wired and ready. Future use cases: save favorite events, store user accounts, cache Ticketmaster results so you don't hit API rate limits.

---

## How a Request Flows Through the App

Here is the exact sequence when someone opens Nesci:

```
Browser opens localhost:3000
        ↓
Next.js serves app/layout.tsx  (renders the Navbar)
        ↓
Next.js serves app/page.tsx    (renders the page shell: map area + sidebar)
        ↓
Browser downloads JS, runs EventMap and EventList as client components
        ↓
Both components call navigator.geolocation.getCurrentPosition()
        ↓
Browser prompts user: "Allow location access?"
        ↓
Coordinates come back (or NYC fallback if denied)
        ↓
Both components call fetch("/api/events?lat=...&lng=...")
        ↓
Next.js handles that request in app/api/events/route.ts
        ↓
route.ts calls fetchNearbyEvents() from lib/ticketmaster.ts
        ↓
ticketmaster.ts sends a request to Ticketmaster's servers
        ↓
Ticketmaster returns event JSON
        ↓
route.ts sends that back to the browser as { events: [...] }
        ↓
EventMap drops a purple pin for each event
EventList renders a card for each event
```

---

## The `.env.local` File — Your Keys

This file holds your secret API keys. It's listed in `.gitignore` so it never gets pushed to GitHub. You have 4 keys to fill in:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=   ← For the map to render
TICKETMASTER_API_KEY=              ← For fetching events
NEXT_PUBLIC_SUPABASE_URL=          ← Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     ← Your Supabase public key
```

**Important pattern:** Variables starting with `NEXT_PUBLIC_` are sent to the browser. Variables without that prefix stay server-side only. Your Ticketmaster key has NO `NEXT_PUBLIC_` prefix on purpose — it only runs on the server (in `lib/ticketmaster.ts`), so it never gets exposed in the browser's source code.

---

## How to Run the App

```bash
# Install dependencies (first time only)
npm install

# Start the development server
npm run dev
```

Then open `http://localhost:3000` in your browser. Every time you save a file, the browser updates instantly — you don't need to restart the server.

---

## What's Not Built Yet

This is a foundation. Here's what comes next:
- An `/events` page that shows all events in a grid layout
- Clicking a map pin → opening an event detail panel
- Filtering events by category (music, sports, arts)
- Saving favorites to Supabase
- A search bar to look up events by city

---

## Glossary (Things You Might Google)

| Term | What it means |
|---|---|
| `"use client"` | Tells Next.js this component runs in the browser |
| `useEffect` | A React hook that runs code after the component appears on screen |
| `useState` | A React hook that stores a value and re-renders when it changes |
| `async/await` | How JavaScript waits for slow operations (like API calls) without freezing |
| `fetch()` | Built-in function to make HTTP requests (call an API, get data back) |
| `props` | Data passed from a parent component into a child component |
| `JSX` | The HTML-looking syntax inside `.tsx` files — it's actually JavaScript |
| API route | A Next.js file inside `app/api/` that acts as a backend endpoint |
| `.env.local` | A local file for secret keys — never committed to version control |
