import { NextRequest, NextResponse } from "next/server";
import { fetchNearbyEvents } from "@/lib/ticketmaster";
import { fetchSeatGeekEvents } from "@/lib/seatgeek";
import { fetchCalendarEvents } from "@/lib/calendar";
import { fetchRestaurants } from "@/lib/osm";
import { fetchCommunityEvents } from "@/lib/community";
import { ALL_INTEREST_IDS, DEFAULT_LOCATION, isInterestId } from "@/lib/interests";
import { eventTime, type Event } from "@/lib/types";

// The same show is often on both Ticketmaster and SeatGeek. Treat two events as
// duplicates if their names match, they're at (nearly) the same spot, and at the
// same time — so a weekly meetup, or a matinee and an evening show, all still appear.
function sameTime(a: Event, b: Event) {
  if (a.date === null || b.date === null) return a.date === b.date;
  const gap = Math.abs(eventTime(a) - eventTime(b));
  const bothExact = a.date.includes("T") && b.date.includes("T");
  // Exact times must be within an hour; if a source only gives the day, same day is enough
  return gap < (bothExact ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000);
}

function removeDuplicates(events: Event[]) {
  const kept: Event[] = [];
  for (const e of events) {
    const key = e.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const dupe = kept.some(
      (k) =>
        k.name.toLowerCase().replace(/[^a-z0-9]/g, "") === key &&
        Math.abs(k.lat - e.lat) < 0.01 &&
        Math.abs(k.lng - e.lng) < 0.01 &&
        sameTime(k, e)
    );
    if (!dupe) kept.push(e);
  }
  return kept;
}

// One slow or broken source should never empty the whole feed: if a source
// fails or takes longer than 10 seconds, skip it and show the rest.
async function safely(name: string, load: () => Promise<Event[]>): Promise<Event[]> {
  try {
    return await Promise.race([
      load(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timed out")), 10_000)),
    ]);
  } catch (err) {
    console.error(`Source "${name}" skipped:`, err instanceof Error ? err.message : err);
    return [];
  }
}

// GET /api/events?lat=..&lng=..&interests=dining,music&days=7
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get("lat") ?? String(DEFAULT_LOCATION.lat));
  const lng = parseFloat(searchParams.get("lng") ?? String(DEFAULT_LOCATION.lng));
  const days = Math.min(Math.max(parseInt(searchParams.get("days") ?? "21"), 1), 31);

  if (isNaN(lat) || isNaN(lng) || isNaN(days)) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const requested = searchParams.get("interests")?.split(",").filter(isInterestId);
  const interests = new Set(requested?.length ? requested : ALL_INTEREST_IDS);

  // Only call the sources the user actually cares about, all at the same time
  const wantsTicketed = ["music", "sports", "arts", "free"].some((i) => interests.has(i as never));
  const [community, calendars, ticketmaster, seatgeek, dining] = await Promise.all([
    safely("community", () => fetchCommunityEvents(lat, lng, days)),
    safely("calendars", () => fetchCalendarEvents(lat, lng, days)),
    wantsTicketed ? safely("ticketmaster", () => fetchNearbyEvents(lat, lng, days)) : [],
    wantsTicketed ? safely("seatgeek", () => fetchSeatGeekEvents(lat, lng, days)) : [],
    interests.has("dining") ? safely("restaurants", () => fetchRestaurants(lat, lng)) : [],
  ]);

  // An event matches if its category was picked, or it's free and "free" was picked
  const events = removeDuplicates([...community, ...calendars, ...ticketmaster, ...seatgeek, ...dining])
    .filter((e) => interests.has(e.category) || (interests.has("free") && e.isFree))
    // Soonest first; events without a date (and restaurants) at the end
    .sort((a, b) => eventTime(a) - eventTime(b));

  return NextResponse.json({ events });
}
