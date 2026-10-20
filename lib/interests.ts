// ─── INTERESTS ──────────────────────────────────────────────────────────────
//
// The "taste quiz" options a user picks during onboarding. Every event in the
// app is tagged with exactly one of these ids, so the same list drives:
//   - the onboarding screen (what you can pick)
//   - the filter chips on the home page
//   - which data sources /api/events calls
//
// Where each interest's events come from:
//   dining      → Google Places (well-rated restaurants)
//   music       → Ticketmaster, segment "Music"
//   sports      → Ticketmaster, segment "Sports"
//   arts        → Ticketmaster, segment "Arts & Theatre"
//   networking  → community submissions (no good public API exists)
//   underground → community submissions (by definition, not on big sites)
//   free        → any source where the event is marked free
// ────────────────────────────────────────────────────────────────────────────

export const INTERESTS = [
  { id: "dining", emoji: "🍷", label: "Classy dining", description: "Nice restaurants for when you're free" },
  { id: "networking", emoji: "💼", label: "Networking", description: "Career, business and fashion meetups" },
  { id: "underground", emoji: "🕶️", label: "Underground", description: "Events most people don't know about" },
  { id: "free", emoji: "🎟️", label: "Free events", description: "Just sign up and show up" },
  { id: "music", emoji: "🎶", label: "Live music", description: "Concerts and shows" },
  { id: "sports", emoji: "🏟️", label: "Sports", description: "Games and matches" },
  { id: "arts", emoji: "🎭", label: "Arts & theatre", description: "Plays, comedy and exhibits" },
] as const;

export type InterestId = (typeof INTERESTS)[number]["id"];

export const ALL_INTEREST_IDS: InterestId[] = INTERESTS.map((i) => i.id);

export function isInterestId(value: string): value is InterestId {
  return (ALL_INTEREST_IDS as string[]).includes(value);
}

// Ticketmaster groups events into "segments". These are the ones we map to.
export const TICKETMASTER_SEGMENTS: Partial<Record<InterestId, string>> = {
  music: "Music",
  sports: "Sports",
  arts: "Arts & Theatre",
};

// Worcester, MA — the launch city and the fallback when location is denied.
export const DEFAULT_LOCATION = { lat: 42.2626, lng: -71.8023, label: "Worcester, MA" };
