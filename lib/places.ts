// ─── GOOGLE PLACES ──────────────────────────────────────────────────────────
//
// Used for two things:
//   1. "Classy dining" — well-rated restaurants near a location
//   2. City search — turning "Boston, MA" into coordinates
//
// Uses the Places API (New) Text Search endpoint. It needs a SERVER-side key
// (GOOGLE_PLACES_API_KEY, no NEXT_PUBLIC_ prefix) with "Places API (New)"
// enabled in Google Cloud.
// ────────────────────────────────────────────────────────────────────────────

import type { Event } from "./types";

const KEY = process.env.GOOGLE_PLACES_API_KEY;
const URL = "https://places.googleapis.com/v1/places:searchText";

// The fields we ask Google for (see the field masks below)
interface Place {
  id?: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location: { latitude: number; longitude: number };
  googleMapsUri?: string;
}

async function searchText(body: object, fieldMask: string): Promise<Place[]> {
  if (!KEY) {
    console.error("GOOGLE_PLACES_API_KEY is not set");
    return [];
  }

  const res = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": KEY,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify(body),
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    console.error(`Google Places request failed: ${res.status}`);
    return [];
  }

  const data = await res.json();
  return data.places ?? [];
}

export async function fetchClassyRestaurants(lat: number, lng: number): Promise<Event[]> {
  const places = await searchText(
    {
      textQuery: "upscale restaurant",
      locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 15000 } },
      minRating: 4.3,
      pageSize: 10,
    },
    "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri"
  );

  return places.map(
    (p): Event => ({
      id: `gp-${p.id}`,
      name: p.displayName?.text ?? "Restaurant",
      venue: p.formattedAddress ?? "",
      date: "Open most days",
      lat: p.location.latitude,
      lng: p.location.longitude,
      url: p.googleMapsUri,
      category: "dining",
      source: "google",
    })
  );
}

export async function geocodeCity(query: string) {
  const places = await searchText(
    { textQuery: query, pageSize: 1 },
    "places.formattedAddress,places.location"
  );
  const p = places[0];
  if (!p) return null;
  return { lat: p.location.latitude, lng: p.location.longitude, label: p.formattedAddress };
}
