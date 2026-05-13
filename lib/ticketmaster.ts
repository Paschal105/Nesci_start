import type { Event } from "./types";

const BASE = "https://app.ticketmaster.com/discovery/v2";
const KEY = process.env.TICKETMASTER_API_KEY;

export async function fetchNearbyEvents(lat: number, lng: number, radius = 25): Promise<Event[]> {
  const url = `${BASE}/events.json?apikey=${KEY}&latlong=${lat},${lng}&radius=${radius}&unit=miles&size=20&sort=date,asc`;
  const res = await fetch(url, { next: { revalidate: 300 } });

  if (!res.ok) return [];

  const data = await res.json();
  const items = data._embedded?.events ?? [];

  return items.map((item: any): Event => ({
    id: item.id,
    name: item.name,
    venue: item._embedded?.venues?.[0]?.name ?? "Unknown venue",
    date: item.dates?.start?.localDate ?? "TBD",
    lat: parseFloat(item._embedded?.venues?.[0]?.location?.latitude ?? "0"),
    lng: parseFloat(item._embedded?.venues?.[0]?.location?.longitude ?? "0"),
    url: item.url,
    imageUrl: item.images?.[0]?.url,
    category: item.classifications?.[0]?.segment?.name,
  }));
}
