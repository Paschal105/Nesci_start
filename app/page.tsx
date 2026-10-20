// ─── PAGE: Home (/) ────────────────────────────────────────────────────────
//
// The main screen of Nesci. All the interactive parts (filters, map, list)
// live in the Discover client component — see components/Discover.tsx.
//
// How data flows:
//   1. Discover loads the user's saved interests (if signed in)
//   2. The browser asks for location (falls back to Worcester, MA)
//   3. Discover calls /api/events with location + interests + time window
//   4. That API route pulls from Ticketmaster, Google Places and community
//      submissions, and returns one combined list
//   5. The map drops pins; the sidebar lists cards
// ────────────────────────────────────────────────────────────────────────────

import Discover from "@/components/Discover";

export default function Home() {
  return <Discover />;
}
