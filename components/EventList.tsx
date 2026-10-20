// ─── COMPONENT: EventList ───────────────────────────────────────────────────
//
// The sidebar list of events. It no longer fetches anything itself — the
// parent (Discover) passes the events in, so the list and the map always
// show the same data. Clicking a card selects that event on the map.
// ────────────────────────────────────────────────────────────────────────────

"use client";

import type { Event } from "@/lib/types";
import { INTERESTS } from "@/lib/interests";

interface Props {
  events: Event[];
  loading: boolean;
  selected: Event | null;
  onSelect: (event: Event) => void;
}

const SOURCE_LABEL: Record<Event["source"], string> = {
  ticketmaster: "Ticketmaster",
  google: "Google",
  community: "Community",
};

export default function EventList({ events, loading, selected, onSelect }: Props) {
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
      <p className="p-4 text-sm text-gray-500">
        Nothing matches right now. Try a longer time window or more interests.
      </p>
    );
  }

  // ── Event cards ────────────────────────────────────────────────────────
  return (
    <ul className="divide-y divide-border">
      {events.map((event) => {
        const interest = INTERESTS.find((i) => i.id === event.category);
        const isSelected = selected?.id === event.id;
        return (
          <li
            key={event.id}
            onClick={() => onSelect(event)}
            className={`p-4 hover:bg-bg-card transition-colors cursor-pointer group ${isSelected ? "bg-bg-card" : ""}`}
          >
            <p className="text-sm font-medium text-text-primary group-hover:text-neon-cyan transition-colors line-clamp-1">
              {interest?.emoji} {event.name}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{event.venue}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-neon-purple">{event.date}</span>
              {event.isFree && <span className="text-[10px] rounded bg-neon-cyan/20 text-neon-cyan px-1.5">FREE</span>}
              <span className="text-[10px] text-gray-600 ml-auto">{SOURCE_LABEL[event.source]}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
