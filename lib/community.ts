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
    // Events with no date are kept; dated ones must fall inside the time window
    .or(`starts_at.is.null,and(starts_at.gte."${now.toISOString()}",starts_at.lte."${end.toISOString()}")`)
    .gte("lat", lat - DEGREES_AROUND)
    .lte("lat", lat + DEGREES_AROUND)
    .gte("lng", lng - DEGREES_AROUND)
    .lte("lng", lng + DEGREES_AROUND)
    .order("starts_at", { nullsFirst: false });

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
        // Exact time as ISO (the browser formats it in the viewer's time zone), or null if not given
        date: row.starts_at ?? null,
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
