import type { InterestId } from "./interests";

export interface Event {
  id: string;
  name: string;
  venue: string;
  // When it happens: an exact ISO time, a day ("2026-10-24"), or null when the
  // source didn't give a date. Undated events are still shown — see eventWhen().
  date: string | null;
  lat: number;
  lng: number;
  url?: string;
  imageUrl?: string;
  // Which interest this event belongs to (drives filter chips and pin colour)
  category: InterestId;
  // Where the event came from, so the UI can label it
  source: "ticketmaster" | "seatgeek" | "osm" | "calendar" | "community";
  // For calendar events: which calendar it came from (e.g. "WPI")
  sourceName?: string;
  isFree?: boolean;
  description?: string;
}

export function hasDate(event: Event): event is Event & { date: string } {
  return event.date !== null;
}

// The "when" line on cards and popups. Exact times are shown in the viewer's
// own time zone, which only the browser knows.
export function eventWhen(event: Event) {
  if (!hasDate(event)) {
    // Restaurants never have a date; for events it just wasn't announced
    return event.source === "osm" ? event.description ?? "Restaurant" : "Date not announced";
  }
  if (!event.date.includes("T")) {
    return new Date(`${event.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }
  return new Date(event.date).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// For sorting: undated events go after everything with a date
export function eventTime(event: Event) {
  if (!hasDate(event)) return Infinity;
  return Date.parse(event.date.includes("T") ? event.date : `${event.date}T12:00:00`);
}

// A row in the Supabase "profiles" table (see supabase/schema.sql)
export interface Profile {
  id: string;
  interests: InterestId[];
  home_city: string | null;
}
