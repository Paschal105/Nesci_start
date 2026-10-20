// ─── CALENDAR READER ────────────────────────────────────────────────────────
//
// Reads the calendars listed in lib/feeds.ts and turns their entries into
// Nesci events. Each calendar is fetched at most once an hour (cached), and
// a slow or broken calendar is skipped instead of holding up the page.
// ────────────────────────────────────────────────────────────────────────────

import type { Event } from "./types";
import type { InterestId } from "./interests";
import { FEEDS, type FeedConfig } from "./feeds";

const USER_AGENT = "Nesci event discovery app (https://github.com/Paschal105/Nesci_start)";
const DEFAULT_TZ = "America/New_York"; // every Nesci region is on Eastern time
const NEARBY_KM = 40; // ~25 miles, same as the ticketing sources

// A calendar entry before it becomes a Nesci event
export interface CalendarEntry {
  uid: string;
  title: string;
  start: Date | null; // null when the calendar gives no date — still shown, as "Date not announced"
  allDay: boolean;
  location?: string;
  description?: string;
  url?: string;
  lat?: number;
  lng?: number;
  isFree?: boolean;
  tags?: string[];
}

// ── Picking a category from the event's own words ──────────────────────────

const KEYWORDS: [InterestId, RegExp][] = [
  ["networking", /network|career|job fair|recruit|mixer|professional|entrepreneur|startup|founder|pitch|industry|fashion/i],
  ["music", /concert|live music|band|jazz|choir|orchestra|symphony|recital|\bdj\b|open mic/i],
  ["sports", /\bvs\.?\b|game|match|tournament|athletic|basketball|soccer|hockey|baseball|football|\brun\b|5k|yoga|fitness/i],
  ["arts", /exhibit|gallery|\barts?\b|museum|theat|play\b|film|movie|screening|comedy|dance|poetry|reading|lecture|talk\b/i],
];

export function guessCategory(text: string, fallback: InterestId): InterestId {
  return KEYWORDS.find(([, re]) => re.test(text))?.[0] ?? fallback;
}

// ── Distance, for only showing calendars near the viewer ───────────────────

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

// ── .ics parsing ───────────────────────────────────────────────────────────

// Some calendars use Windows time zone names instead of standard ones
const WINDOWS_TZ: Record<string, string> = {
  "Eastern Standard Time": "America/New_York",
  "Central Standard Time": "America/Chicago",
  "Mountain Standard Time": "America/Denver",
  "Pacific Standard Time": "America/Los_Angeles",
};

// How far ahead of UTC a time zone is at a given moment, in ms
function tzOffset(ts: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(ts));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second")) - ts;
}

// "7 PM on Oct 24 in New York" → the exact moment in UTC
function zonedTimeToDate(y: number, mo: number, d: number, h: number, mi: number, s: number, tzid?: string) {
  let timeZone = (tzid && WINDOWS_TZ[tzid]) || tzid || DEFAULT_TZ;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
  } catch {
    timeZone = DEFAULT_TZ; // unknown zone name — assume Eastern
  }
  const guess = Date.UTC(y, mo - 1, d, h, mi, s);
  const first = guess - tzOffset(guess, timeZone);
  // Recheck once in case the guess landed on the other side of a daylight-saving change
  return new Date(guess - tzOffset(first, timeZone));
}

function parseIcsDate(value: string, params: Record<string, string>) {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, z] = m;
  if (h === undefined || params.VALUE === "DATE") {
    return { date: zonedTimeToDate(+y, +mo, +d, 0, 0, 0, params.TZID), allDay: true };
  }
  if (z) return { date: new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)), allDay: false };
  return { date: zonedTimeToDate(+y, +mo, +d, +h, +mi, +s, params.TZID), allDay: false };
}

function unescapeText(value: string) {
  return value.replace(/\\n/gi, "\n").replace(/\\([,;\\])/g, "$1").trim();
}

export function parseIcs(text: string): CalendarEntry[] {
  // Long lines are "folded" onto the next line with a leading space — join them back
  const lines = text.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "").split("\n");
  const entries: CalendarEntry[] = [];
  let current: Record<string, { value: string; params: Record<string, string> }> | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (line === "END:VEVENT" && current) {
      const start = current.DTSTART ? parseIcsDate(current.DTSTART.value, current.DTSTART.params) : null;
      const title = current.SUMMARY && unescapeText(current.SUMMARY.value);
      if (title && current.STATUS?.value !== "CANCELLED") {
        const geo = current.GEO?.value.split(/[;,]/).map(Number);
        entries.push({
          uid: current.UID?.value ?? `${title}-${start?.date.toISOString() ?? "undated"}`,
          title,
          start: start?.date ?? null,
          allDay: start?.allDay ?? false,
          location: current.LOCATION && unescapeText(current.LOCATION.value),
          description: current.DESCRIPTION && unescapeText(current.DESCRIPTION.value).slice(0, 300),
          url: current.URL?.value,
          lat: geo && !isNaN(geo[0]) ? geo[0] : undefined,
          lng: geo && !isNaN(geo[1]) ? geo[1] : undefined,
          tags: current.CATEGORIES && unescapeText(current.CATEGORIES.value).split(","),
        });
      }
      current = null;
      continue;
    }
    if (!current) continue;

    // e.g. "DTSTART;TZID=America/New_York:20261024T190000"
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const [name, ...paramParts] = line.slice(0, colon).split(";");
    const params = Object.fromEntries(paramParts.map((p) => p.split("=") as [string, string]));
    current[name.toUpperCase()] = { value: line.slice(colon + 1), params };
  }
  return entries;
}

// ── Localist ───────────────────────────────────────────────────────────────

interface LocalistEvent {
  id: number;
  title: string;
  localist_url?: string;
  url?: string | null;
  location_name?: string;
  description_text?: string;
  free?: boolean;
  geo?: { latitude?: string | number | null; longitude?: string | number | null };
  filters?: { event_types?: { name: string }[] };
  event_instances?: { event_instance: { id: number; start: string; all_day?: boolean } }[];
}

export function parseLocalist(data: { events?: { event: LocalistEvent }[] }): CalendarEntry[] {
  return (data.events ?? []).flatMap(({ event }) => {
    const instances = event.event_instances?.length ? event.event_instances.map((i) => i.event_instance) : [null];
    return instances.map((instance) => {
      const lat = Number(event.geo?.latitude);
      const lng = Number(event.geo?.longitude);
      return {
        uid: `${event.id}-${instance?.id ?? "undated"}`,
        title: event.title,
        start: instance ? new Date(instance.start) : null,
        allDay: !!instance?.all_day,
        location: event.location_name,
        description: event.description_text?.slice(0, 300),
        url: event.localist_url ?? event.url ?? undefined,
        lat: lat || undefined,
        lng: lng || undefined,
        isFree: event.free,
        tags: event.filters?.event_types?.map((t) => t.name),
      };
    });
  });
}

// ── Fetching ───────────────────────────────────────────────────────────────

export async function fetchFeedEntries(feed: Pick<FeedConfig, "kind" | "url">, days = 21): Promise<CalendarEntry[]> {
  const url =
    feed.kind === "localist"
      ? `${feed.url.replace(/\/$/, "")}/api/2/events?days=${days}&pp=100`
      : feed.url.replace(/^webcal:/, "https:");
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return feed.kind === "localist" ? parseLocalist(await res.json()) : parseIcs(await res.text());
}

export async function fetchCalendarEvents(lat: number, lng: number, days: number): Promise<Event[]> {
  const here = { lat, lng };
  const nearby = FEEDS.filter((f) => distanceKm(here, f.location) <= NEARBY_KM);
  const now = Date.now();
  const end = now + days * 24 * 60 * 60 * 1000;

  const perFeed = await Promise.all(
    nearby.map(async (feed) => {
      try {
        const entries = await fetchFeedEntries(feed, days);
        return entries
          // Undated entries are kept; dated ones must fall inside the time window
          .filter((e) => !e.start || (e.start.getTime() >= now - (e.allDay ? 86400000 : 0) && e.start.getTime() <= end))
          .map(
            (e): Event => ({
              id: `cal-${feed.name}-${e.uid}`,
              name: e.title,
              venue: e.location || feed.name,
              // All-day events show just the day; timed events show in the viewer's time zone
              date: !e.start
                ? null
                : e.allDay
                  ? e.start.toLocaleDateString("en-CA", { timeZone: DEFAULT_TZ })
                  : e.start.toISOString(),
              lat: e.lat ?? feed.location.lat,
              lng: e.lng ?? feed.location.lng,
              url: e.url,
              description: e.description,
              category: guessCategory([e.title, ...(e.tags ?? [])].join(" "), feed.category),
              source: "calendar",
              sourceName: feed.name,
              isFree: feed.alwaysFree || e.isFree || /\bfree\b/i.test(e.title),
            })
          );
      } catch (err) {
        console.error(`Calendar "${feed.name}" failed:`, err);
        return [];
      }
    })
  );
  return perFeed.flat();
}
