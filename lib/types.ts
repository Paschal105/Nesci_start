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
  source: "ticketmaster" | "google" | "community";
  isFree?: boolean;
  description?: string;
}

// A row in the Supabase "profiles" table (see supabase/schema.sql)
export interface Profile {
  id: string;
  interests: InterestId[];
  home_city: string | null;
}
