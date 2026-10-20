// ─── SCRIPT: check a calendar link ──────────────────────────────────────────
//
// Usage:   npm run check-feed <calendar link>
//
// Tells you whether Nesci can read a calendar, which kind it is ("ics" or
// "localist"), and shows the next few events — so you know what to put in
// lib/feeds.ts before adding it.
// ────────────────────────────────────────────────────────────────────────────

import { fetchFeedEntries, guessCategory, type CalendarEntry } from "../lib/calendar";

async function tryKind(kind: "ics" | "localist", url: string): Promise<CalendarEntry[] | null> {
  try {
    const entries = await fetchFeedEntries({ kind, url });
    return entries.length ? entries : null;
  } catch {
    return null;
  }
}

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.log("Usage: npm run check-feed <calendar link>");
    process.exit(1);
  }

  // Links ending in .ics are plain calendars; otherwise try Localist first
  const order: ("ics" | "localist")[] = /\.ics($|\?)|^webcal:/i.test(url) ? ["ics"] : ["localist", "ics"];
  for (const kind of order) {
    const entries = await tryKind(kind, url);
    if (!entries) continue;

    const upcoming = entries
      .filter((e) => !e.start || e.start.getTime() >= Date.now() - 86400000)
      .sort((a, b) => (a.start?.getTime() ?? Infinity) - (b.start?.getTime() ?? Infinity));
    const undated = entries.filter((e) => !e.start).length;
    const withCoords = entries.filter((e) => e.lat !== undefined).length;

    console.log(`\n✅ Nesci can read this calendar.`);
    console.log(`   kind: "${kind}"`);
    console.log(`   ${entries.length} events found, ${upcoming.length} upcoming (${undated} with no date — still shown in Nesci)`);
    console.log(`   ${withCoords} have their own map location (the rest will use the "location" you set)\n`);
    for (const e of upcoming.slice(0, 8)) {
      const when = e.start
        ? e.start.toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" })
        : "Date not announced";
      const category = guessCategory([e.title, ...(e.tags ?? [])].join(" "), "arts");
      console.log(`   • ${when}  ${e.title}${e.isFree ? "  [FREE]" : ""}  (looks like: ${category})`);
    }
    return;
  }

  console.log("\n❌ Nesci couldn't read any events from that link.");
  console.log("   Look for a link labelled iCal, .ics, Subscribe or 'Add to calendar' on the events page.");
  process.exit(1);
}

main();
