// ─── PAGE: Submit an event (/submit) ────────────────────────────────────────
//
// How networking and underground events get into Nesci. Signed-in users post
// an event here; it's saved to "community_events" as unapproved, and shows up
// in the app once you approve it in the Supabase dashboard.
// ────────────────────────────────────────────────────────────────────────────

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { INTERESTS } from "@/lib/interests";

const inputClass =
  "w-full rounded-lg bg-sand border border-line px-3 py-2 text-sm outline-none focus:border-brand";

export default function SubmitPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [form, setForm] = useState({
    title: "",
    category: "networking",
    venue: "",
    address: "",
    startsAt: "",
    isFree: false,
    url: "",
    description: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);

    // Turn the address into map coordinates
    const geo = await fetch(`/api/geocode?q=${encodeURIComponent(form.address)}`);
    if (!geo.ok) {
      setBusy(false);
      setMessage("We couldn't find that address. Try adding the city and state.");
      return;
    }
    const { lat, lng } = await geo.json();

    const { error } = await supabase.from("community_events").insert({
      title: form.title,
      category: form.category,
      venue: form.venue,
      lat,
      lng,
      starts_at: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      is_free: form.isFree,
      url: form.url || null,
      description: form.description || null,
    });

    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Thanks! Your event will appear once it's approved.");
    setForm((f) => ({ ...f, title: "", venue: "", address: "", startsAt: "", url: "", description: "" }));
  }

  return (
    <div className="pt-24 px-4 pb-12 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-brand">Share an event</h1>
      <p className="text-sm text-muted mt-1">
        Know about a meetup, pop-up or hidden gem? Post it for people nearby.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <input required placeholder="Event name" value={form.title} onChange={(e) => set("title", e.target.value)} className={inputClass} />
        <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputClass}>
          {INTERESTS.map((i) => (
            <option key={i.id} value={i.id}>
              {i.emoji} {i.label}
            </option>
          ))}
        </select>
        <input required placeholder="Venue name" value={form.venue} onChange={(e) => set("venue", e.target.value)} className={inputClass} />
        <input required placeholder="Address (e.g. 1 Main St, Worcester, MA)" value={form.address} onChange={(e) => set("address", e.target.value)} className={inputClass} />
        <label className="block text-xs text-muted">
          Date and time — leave empty if it&apos;s not announced yet
          <input type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} className={`${inputClass} mt-1`} />
        </label>
        <input type="url" placeholder="Link to sign up (optional)" value={form.url} onChange={(e) => set("url", e.target.value)} className={inputClass} />
        <textarea placeholder="What should people know? (optional)" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} className={inputClass} />
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={form.isFree} onChange={(e) => set("isFree", e.target.checked)} />
          It&apos;s free
        </label>

        {message && <p className="text-sm text-accent">{message}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-brand py-2 font-semibold text-white shadow-md shadow-brand/20 disabled:opacity-50"
        >
          {busy ? "Submitting…" : "Submit for review"}
        </button>
      </form>
    </div>
  );
}
