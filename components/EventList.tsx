// ─── COMPONENT: EventList ───────────────────────────────────────────────────
//
// Renders a scrollable list of events in the right-hand sidebar.
//
// What it does:
//   1. On mount, asks the browser for the user's GPS location
//   2. Calls /api/events?lat=...&lng=... with those coordinates
//   3. Displays a skeleton loader while waiting
//   4. Renders one card per event once data arrives
//
// NOTE: This component duplicates the fetch that EventMap also makes.
// In a future iteration we'd lift this state up to the Home page and pass
// events down as props — but keeping them independent makes each component
// simpler to understand right now.
//
// "use client" is required here because:
//   - navigator.geolocation only exists in the browser, not on the server
//   - useState / useEffect are React client-side hooks
// ────────────────────────────────────────────────────────────────────────────

"use client";

import { useEffect, useState } from "react";
import type { Event } from "@/lib/types";

export default function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get the user's real location first.
    // If they deny permission, fall back to NYC as a default.
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        fetch(`/api/events?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`)
          .then((r) => r.json())
          .then((data) => setEvents(data.events ?? []))
          .finally(() => setLoading(false));
      },
      () => {
        // Geolocation denied or unavailable — use NYC as fallback
        fetch("/api/events?lat=40.7128&lng=-74.006")
          .then((r) => r.json())
          .then((data) => setEvents(data.events ?? []))
          .finally(() => setLoading(false));
      }
    );
  }, []); // Empty array = run once when the component first appears on screen

  // ── Loading state: animated placeholder cards ──────────────────────────
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 bg-bg-card rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────
  if (!events.length) {
    return (
      <p className="p-4 text-sm text-gray-500">No events found nearby.</p>
    );
  }

  // ── Event cards ────────────────────────────────────────────────────────
  return (
    <ul className="divide-y divide-[#1f1f2e]">
      {events.map((event) => (
        <li
          key={event.id}
          className="p-4 hover:bg-bg-card transition-colors cursor-pointer group"
        >
          {/* Event name — truncated to one line with ellipsis if too long */}
          <p className="text-sm font-medium text-text-primary group-hover:text-neon-cyan transition-colors line-clamp-1">
            {event.name}
          </p>

          {/* Venue name */}
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{event.venue}</p>

          {/* Date — shown in neon purple to stand out */}
          <p className="text-xs text-neon-purple mt-1">{event.date}</p>
        </li>
      ))}
    </ul>
  );
}
