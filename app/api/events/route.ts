import { NextRequest, NextResponse } from "next/server";
import { fetchNearbyEvents } from "@/lib/ticketmaster";
import { fetchClassyRestaurants } from "@/lib/places";
import { fetchCommunityEvents } from "@/lib/community";
import { ALL_INTEREST_IDS, DEFAULT_LOCATION, isInterestId } from "@/lib/interests";

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
  const wantsTicketmaster = ["music", "sports", "arts", "free"].some((i) => interests.has(i as never));
  const [ticketmaster, dining, community] = await Promise.all([
    wantsTicketmaster ? fetchNearbyEvents(lat, lng, days) : [],
    interests.has("dining") ? fetchClassyRestaurants(lat, lng) : [],
    fetchCommunityEvents(lat, lng, days),
  ]);

  // An event matches if its category was picked, or it's free and "free" was picked
  const events = [...community, ...ticketmaster, ...dining].filter(
    (e) => interests.has(e.category) || (interests.has("free") && e.isFree)
  );

  return NextResponse.json({ events });
}
