// ─── OPENSTREETMAP ──────────────────────────────────────────────────────────
//
// Free, no-key replacements for Google Places:
//   1. Restaurants near a location  → Overpass API (searches OpenStreetMap)
//   2. City / address search        → Nominatim (OpenStreetMap's geocoder)
//
// Both are free community services with fair-use rules: identify the app in
// the User-Agent header, keep requests low (Nominatim allows ~1 per second),
// and cache results. That's why every fetch below has a long `revalidate`.
//
// Limitation: OpenStreetMap has no ratings or prices, so we can't tell which
// restaurants are "classy". Users can add upscale spots via /submit under
// "Classy dining" to fill that gap.
// ────────────────────────────────────────────────────────────────────────────

import type { Event } from "./types";

const USER_AGENT = "Nesci event discovery app (https://github.com/Paschal105/Nesci_start)";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

interface OsmElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export async function fetchRestaurants(lat: number, lng: number): Promise<Event[]> {
  // Named sit-down restaurants within 8 km ("nwr" = nodes, ways and relations;
  // "out center" gives buildings a single point to pin)
  const query = `[out:json][timeout:20];nwr["amenity"="restaurant"]["name"](around:8000,${lat},${lng});out center 60;`;

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": USER_AGENT },
    body: `data=${encodeURIComponent(query)}`,
    next: { revalidate: 86400 }, // restaurants don't change often — cache for a day
  });

  if (!res.ok) {
    console.error(`Overpass request failed: ${res.status}`);
    return [];
  }

  const data: { elements: OsmElement[] } = await res.json();

  return (
    data.elements
      // Places with a website tend to be established sit-down spots — show them first
      .sort((a, b) => Number(!!b.tags?.website) - Number(!!a.tags?.website))
      .slice(0, 15)
      .flatMap((el): Event[] => {
        const pLat = el.lat ?? el.center?.lat;
        const pLng = el.lon ?? el.center?.lon;
        if (pLat === undefined || pLng === undefined) return [];

        const tags = el.tags ?? {};
        const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
        const cuisine = tags.cuisine?.split(";")[0].replace(/_/g, " ");
        return [
          {
            id: `osm-${el.type}-${el.id}`,
            name: tags.name,
            venue: street || tags["addr:city"] || "Nearby",
            date: null,
            description: cuisine ? `${cuisine[0].toUpperCase()}${cuisine.slice(1)} restaurant` : "Restaurant",
            lat: pLat,
            lng: pLng,
            url: tags.website ?? `https://www.openstreetmap.org/${el.type}/${el.id}`,
            category: "dining",
            source: "osm",
          },
        ];
      })
  );
}

export async function geocode(query: string) {
  const params = new URLSearchParams({ q: query, format: "json", limit: "1" });
  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    console.error(`Nominatim request failed: ${res.status}`);
    return null;
  }

  const results: { lat: string; lon: string; display_name: string }[] = await res.json();
  const place = results[0];
  if (!place) return null;
  // display_name is long ("Worcester, Worcester County, Massachusetts, United States") — keep the first parts
  const label = place.display_name.split(", ").slice(0, 3).join(", ");
  return { lat: parseFloat(place.lat), lng: parseFloat(place.lon), label };
}
