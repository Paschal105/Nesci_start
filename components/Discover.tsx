// ─── COMPONENT: Discover ────────────────────────────────────────────────────
//
// The whole home screen. It owns all the state, then hands events down to
// EventMap and EventList as props — so the API is called once, and clicking a
// card in the list highlights the same pin on the map.
//
// What the user controls:
//   - interest chips  (starts from their saved quiz answers)
//   - time window     (today / this week / next 3 weeks)
//   - location        (their GPS, or any city they search for)
// ────────────────────────────────────────────────────────────────────────────

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EventMap from "./EventMap";
import EventList from "./EventList";
import { useAuth } from "@/lib/useAuth";
import { ALL_INTEREST_IDS, DEFAULT_LOCATION, INTERESTS, type InterestId } from "@/lib/interests";
import type { Event } from "@/lib/types";

const WINDOWS = [
  { days: 1, label: "Today" },
  { days: 7, label: "This week" },
  { days: 21, label: "Next 3 weeks" },
];

export default function Discover() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [interests, setInterests] = useState<InterestId[]>(ALL_INTEREST_IDS);
  const [days, setDays] = useState(7);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Event | null>(null);
  const [cityQuery, setCityQuery] = useState("");
  const [cityError, setCityError] = useState<string | null>(null);

  // Signed-in users who skipped the quiz go back to it
  useEffect(() => {
    if (authLoading) return;
    if (user && !profile?.interests?.length) router.replace("/onboarding");
    else if (profile?.interests?.length) setInterests(profile.interests);
  }, [authLoading, user, profile, router]);

  // Use the browser's location if allowed; otherwise stay on Worcester
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Near you" });
    });
  }, []);

  useEffect(() => {
    // Wait until we know the user's saved interests, to avoid fetching twice
    if (authLoading) return;
    if (!interests.length) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams({
      lat: String(location.lat),
      lng: String(location.lng),
      days: String(days),
      interests: interests.join(","),
    });
    fetch(`/api/events?${params}`)
      .then((r) => r.json())
      .then((data) => setEvents(data.events ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [authLoading, location, interests, days]);

  function toggleInterest(id: InterestId) {
    setInterests((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }

  async function searchCity(e: React.FormEvent) {
    e.preventDefault();
    if (!cityQuery.trim()) return;
    setCityError(null);
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(cityQuery)}`);
    if (!res.ok) {
      setCityError("Couldn't find that place");
      return;
    }
    setLocation(await res.json());
    setSelected(null);
  }

  return (
    <div className="pt-16 h-screen flex flex-col">
      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="border-b border-line bg-surface px-4 py-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={searchCity} className="flex gap-2">
            <input
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              placeholder="Search another city…"
              className="w-48 rounded-lg bg-sand border border-line px-3 py-1.5 text-sm outline-none focus:border-brand"
            />
          </form>
          <span className="text-xs text-muted">📍 {location.label}</span>
          {cityError && <span className="text-xs text-alert">{cityError}</span>}

          <div className="ml-auto flex gap-1">
            {WINDOWS.map((w) => (
              <button
                key={w.days}
                onClick={() => setDays(w.days)}
                className={`rounded-full px-3 py-1 text-xs ${
                  days === w.days ? "bg-accent text-white font-semibold" : "bg-sand text-muted hover:text-accent"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((i) => {
            const on = interests.includes(i.id);
            return (
              <button
                key={i.id}
                onClick={() => toggleInterest(i.id)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  on ? "border-brand text-ink bg-sand" : "border-line text-muted"
                }`}
              >
                {i.emoji} {i.label}
              </button>
            );
          })}
        </div>

        {!authLoading && !user && (
          <p className="text-xs text-muted">
            <Link href="/login" className="text-brand hover:underline">Create an account</Link> to save
            what you&apos;re into.
          </p>
        )}
      </div>

      {/* ── Map + sidebar ───────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          <EventMap center={location} events={events} selected={selected} onSelect={setSelected} />
        </div>
        <aside className="w-80 bg-surface border-l border-line overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b border-line">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-accent">
              {events.length ? `${events.length} things to do` : "Nearby"}
            </h2>
          </div>
          <EventList events={events} loading={loading} selected={selected} onSelect={setSelected} />
        </aside>
      </div>
    </div>
  );
}
