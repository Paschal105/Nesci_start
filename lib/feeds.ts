// ─── CALENDAR FEEDS ─────────────────────────────────────────────────────────
//
// The list of public calendars Nesci reads: colleges, libraries, museums,
// venues, community groups. This is how free and networking events get in
// without a paid API.
//
// To add a calendar, add one entry below — no other code changes needed.
// Test a link first on your computer with:   npm run check-feed <url>
//
// Two kinds of calendar are supported:
//   "ics"      — any standard calendar link (usually ends in .ics, or is
//                labelled "iCal", "Subscribe" or "Add to calendar")
//   "localist" — calendars run on Localist, used by many colleges. Use the
//                calendar's main address, e.g. "https://calendar.example.edu".
//                These include each event's exact location and a free flag.
//
// Fields:
//   name      — shown on event cards (e.g. "WPI")
//   kind      — "ics" or "localist"
//   url       — the calendar link
//   location  — where to pin events that don't have their own coordinates
//               (usually the campus / building). Also used to only show the
//               feed's events to people browsing nearby.
//   category  — which interest its events count as, unless an event's title
//               clearly says otherwise (e.g. "Career fair" → networking)
//   alwaysFree — true if everything on this calendar is free (e.g. a library)
// ────────────────────────────────────────────────────────────────────────────

import type { InterestId } from "./interests";

export interface FeedConfig {
  name: string;
  kind: "ics" | "localist";
  url: string;
  location: { lat: number; lng: number };
  category: InterestId;
  alwaysFree?: boolean;
}

export const FEEDS: FeedConfig[] = [
  // Example — replace with real calendars once you've tested them:
  // {
  //   name: "Example University",
  //   kind: "localist",
  //   url: "https://calendar.example.edu",
  //   location: { lat: 42.3601, lng: -71.0942 },
  //   category: "networking",
  // },
];
