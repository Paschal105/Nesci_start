import type { Event } from "./types";
import { TICKETMASTER_SEGMENTS, type InterestId } from "./interests";

const BASE = "https://app.ticketmaster.com/discovery/v2";
const KEY = process.env.TICKETMASTER_API_KEY;

// Ticketmaster wants dates like 2026-10-20T18:00:00Z (no milliseconds)
function tmDate(d: Date) {
  return d.toISOString().split(".")[0] + "Z";
}

export async function fetchNearbyEvents(
  lat: number,
  lng: number,
  days: number,
  radius = 25
): Promise<Event[]> {
  if (!KEY) {
    console.error("TICKETMASTER_API_KEY is not set");
    return [];
  }

  // Only look a few weeks ahead — Nesci is for spontaneous plans
  const now = new Date();
  const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const url =
    `${BASE}/events.json?apikey=${KEY}&latlong=${lat},${lng}&radius=${radius}&unit=miles` +
    `&startDateTime=${tmDate(now)}&endDateTime=${tmDate(end)}&size=50&sort=date,asc`;
  const res = await fetch(url, { next: { revalidate: 300 } });

  if (!res.ok) {
    console.error(`Ticketmaster request failed: ${res.status}`);
    return [];
  }

  const data = await res.json();
  const items = data._embedded?.events ?? [];
  const events: Event[] = [];

  for (const item of items) {
    const venue = item._embedded?.venues?.[0];
    const venueLat = parseFloat(venue?.location?.latitude);
    const venueLng = parseFloat(venue?.location?.longitude);
    // Skip events without coordinates instead of dropping a pin at 0,0
    if (isNaN(venueLat) || isNaN(venueLng)) continue;

    const segment = item.classifications?.[0]?.segment?.name;
    const category = (Object.keys(TICKETMASTER_SEGMENTS) as InterestId[]).find(
      (id) => TICKETMASTER_SEGMENTS[id] === segment
    );
    // Segments we don't map (e.g. "Miscellaneous") aren't shown
    if (!category) continue;

    const prices = item.priceRanges?.[0];
    events.push({
      id: `tm-${item.id}`,
      name: item.name,
      venue: venue?.name ?? "Unknown venue",
      date: item.dates?.start?.localDate ?? "TBD",
      lat: venueLat,
      lng: venueLng,
      url: item.url,
      imageUrl: item.images?.[0]?.url,
      category,
      source: "ticketmaster",
      isFree: prices ? prices.min === 0 && prices.max === 0 : false,
    });
  }

  return events;
}
