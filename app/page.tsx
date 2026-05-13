// ─── PAGE: Home (/) ────────────────────────────────────────────────────────
//
// This is the main screen of Nesci. It shows two things side by side:
//   LEFT  → a full-screen Google Map with event pins
//   RIGHT → a scrollable sidebar listing those same events
//
// How data flows:
//   1. The browser asks the user for their location (geolocation API)
//   2. Both components independently call /api/events?lat=...&lng=...
//   3. That API route fetches from Ticketmaster and returns a list of events
//   4. The map drops purple pins; the sidebar lists event cards
//
// This file is a SERVER component (no "use client" at the top), which means
// it renders on the server for fast initial load. The child components
// (EventMap, EventList) are CLIENT components because they need the browser
// for geolocation and the Google Maps SDK.
// ────────────────────────────────────────────────────────────────────────────

import EventMap from "@/components/EventMap";
import EventList from "@/components/EventList";

export default function Home() {
  return (
    // pt-16 pushes content below the fixed Navbar (which is 4rem / 16 tall)
    // h-screen + flex make the map fill the entire viewport height
    <div className="pt-16 h-screen flex flex-col">
      <div className="flex flex-1 overflow-hidden">

        {/* ── Map panel ────────────────────────────────────────────────────
            flex-1 means it takes all available width after the sidebar.
            EventMap is a client component that loads the Google Maps SDK. */}
        <div className="flex-1 relative">
          <EventMap />
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────────────
            Fixed 320px wide, scrolls independently from the map.
            Shows the same events as map pins, in a readable list format. */}
        <aside className="w-80 bg-bg-secondary border-l border-[#1f1f2e] overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b border-[#1f1f2e]">
            <h2 className="text-sm font-semibold uppercase tracking-widest neon-text-cyan">
              Nearby Events
            </h2>
          </div>
          <EventList />
        </aside>

      </div>
    </div>
  );
}
