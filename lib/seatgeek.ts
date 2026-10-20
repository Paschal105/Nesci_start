// ─── SEATGEEK ───────────────────────────────────────────────────────────────
//
// A second ticketing source next to Ticketmaster: concerts, sports, comedy
// and theatre. Optional — if SEATGEEK_CLIENT_ID isn't set, this source is
// simply skipped. Get a free client ID at https://seatgeek.com/account/develop
// ────────────────────────────────────────────────────────────────────────────

import type { Event } from "./types";
import type { InterestId } from "./interests";

const CLIENT_ID = process.env.SEATGEEK_CLIENT_ID;

interface SeatGeekEvent {
  id: number;
  title: string;
  url: string;
  datetime_utc: string; // UTC without the trailing "Z"
  datetime_local: string;
  time_tbd: boolean;
  type: string;
  taxonomies?: { name: string }[];
  venue?: { name: string; location?: { lat: number; lon: number } };
  performers?: { image?: string | null }[];
  stats?: { lowest_price?: number | null };
}

// SeatGeek labels events with types like "concert", "nba", "comedy", "broadway_tickets_national"
function categoryFor(e: SeatGeekEvent): InterestId | null {
  const labels = [e.type, ...(e.taxonomies ?? []).map((t) => t.name)].join(" ");
  if (/sports|nba|nfl|mlb|nhl|mls|ncaa|soccer|baseball|hockey|basketball|football|wrestling|boxing|mma/.test(labels)) return "sports";
  if (/concert|music|festival/.test(labels)) return "music";
  if (/theater|theatre|broadway|comedy|dance|classical|opera|family|cirque/.test(labels)) return "arts";
  return null;
}

export async function fetchSeatGeekEvents(lat: number, lng: number, days: number): Promise<Event[]> {
  if (!CLIENT_ID) return [];

  const now = new Date();
  const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    lat: String(lat),
    lon: String(lng),
    range: "25mi",
    "datetime_utc.gte": now.toISOString().split(".")[0],
    "datetime_utc.lte": end.toISOString().split(".")[0],
    per_page: "50",
    sort: "datetime_utc.asc",
  });

  try {
    const res = await fetch(`https://api.seatgeek.com/2/events?${params}`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`SeatGeek request failed: ${res.status}`);
      return [];
    }
    const data: { events?: SeatGeekEvent[] } = await res.json();

    return (data.events ?? []).flatMap((e): Event[] => {
      const category = categoryFor(e);
      const loc = e.venue?.location;
      if (!category || !loc) return [];
      return [
        {
          id: `sg-${e.id}`,
          name: e.title,
          venue: e.venue?.name ?? "Unknown venue",
          // Exact time (shown in the viewer's time zone), or just the day if the time isn't set yet
          date: e.time_tbd ? e.datetime_local.slice(0, 10) : `${e.datetime_utc}Z`,
          lat: loc.lat,
          lng: loc.lon,
          url: e.url,
          imageUrl: e.performers?.[0]?.image ?? undefined,
          category,
          source: "seatgeek",
        },
      ];
    });
  } catch (err) {
    console.error("SeatGeek request failed:", err);
    return [];
  }
}
