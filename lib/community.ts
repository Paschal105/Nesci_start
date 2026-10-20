// ─── COMMUNITY EVENTS ───────────────────────────────────────────────────────
//
// Events that users submit through /submit — the source for networking and
// underground events, which no public API covers well. Submissions start as
// unapproved; only approved rows are readable (enforced by Supabase RLS, see
// supabase/schema.sql). Approve a submission by setting approved = true in
// the Supabase dashboard.
// ────────────────────────────────────────────────────────────────────────────

import { supabase } from "./supabase";
import type { Event } from "./types";
import { isInterestId } from "./interests";

// Rough bounding box instead of true distance — good enough for one city
const DEGREES_AROUND = 0.4; // ~25 miles

export async function fetchCommunityEvents(lat: number, lng: number, days: number): Promise<Event[]> {
  const now = new Date();
  const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("community_events")
    .select("*")
    .eq("approved", true)
    .gte("starts_at", now.toISOString())
    .lte("starts_at", end.toISOString())
    .gte("lat", lat - DEGREES_AROUND)
    .lte("lat", lat + DEGREES_AROUND)
    .gte("lng", lng - DEGREES_AROUND)
    .lte("lng", lng + DEGREES_AROUND)
    .order("starts_at");

  if (error) {
    console.error("Community events query failed:", error.message);
    return [];
  }

  return (data ?? [])
    .filter((row) => isInterestId(row.category))
    .map(
      (row): Event => ({
        id: `cm-${row.id}`,
        name: row.title,
        venue: row.venue,
        date: new Date(row.starts_at).toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
        lat: row.lat,
        lng: row.lng,
        url: row.url ?? undefined,
        category: row.category,
        source: "community",
        isFree: row.is_free,
        description: row.description ?? undefined,
      })
    );
}
