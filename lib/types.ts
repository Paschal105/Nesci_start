import type { InterestId } from "./interests";

export interface Event {
  id: string;
  name: string;
  venue: string;
  date: string;
  lat: number;
  lng: number;
  url?: string;
  imageUrl?: string;
  // Which interest this event belongs to (drives filter chips and pin colour)
  category: InterestId;
  // Where the event came from, so the UI can label it
  source: "ticketmaster" | "osm" | "community";
  isFree?: boolean;
  description?: string;
}

// Event dates are either a label ("2026-10-24", "Open most days") or, for
// community events, an exact ISO time. Exact times are shown in the viewer's
// own time zone, which only the browser knows.
export function formatEventDate(date: string) {
  if (!date.includes("T")) return date;
  return new Date(date).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// A row in the Supabase "profiles" table (see supabase/schema.sql)
export interface Profile {
  id: string;
  interests: InterestId[];
  home_city: string | null;
}
