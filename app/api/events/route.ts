import { NextRequest, NextResponse } from "next/server";
import { fetchNearbyEvents } from "@/lib/ticketmaster";
import { fetchSeatGeekEvents } from "@/lib/seatgeek";
import { fetchCalendarEvents } from "@/lib/calendar";
import { fetchRestaurants } from "@/lib/osm";
import { fetchCommunityEvents } from "@/lib/community";
import { ALL_INTEREST_IDS, DEFAULT_LOCATION, isInterestId } from "@/lib/interests";
import type { Event } from "@/lib/types";

// The same show is often on both Ticketmaster and SeatGeek. Treat two events as
// duplicates if their names match and they're at (nearly) the same spot.
function removeDuplicates(events: Event[]) {
  const kept: Event[] = [];
  for (const e of events) {
    const key = e.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const dupe = kept.some(
      (k) =>
        k.name.toLowerCase().replace(/[^a-z0-9]/g, "") === key &&
        Math.abs(k.lat - e.lat) < 0.01 &&
        Math.abs(k.lng - e.lng) < 0.01
    );
    if (!dupe) kept.push(e);
  }
  return kept;
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
    fetchCommunityEvents(lat, lng, days),
    fetchCalendarEvents(lat, lng, days),
    wantsTicketed ? fetchNearbyEvents(lat, lng, days) : [],
    wantsTicketed ? fetchSeatGeekEvents(lat, lng, days) : [],
    interests.has("dining") ? fetchRestaurants(lat, lng) : [],
  ]);

  // An event matches if its category was picked, or it's free and "free" was picked
  const events = removeDuplicates([...community, ...calendars, ...ticketmaster, ...seatgeek, ...dining]).filter(
    (e) => interests.has(e.category) || (interests.has("free") && e.isFree)
  );

  return NextResponse.json({ events });
}
