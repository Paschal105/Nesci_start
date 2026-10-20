// ─── PAGE: Taste quiz (/onboarding) ─────────────────────────────────────────
//
// Shown right after sign-up (and from "My interests" in the navbar).
// Saves the picked interests to the user's row in the "profiles" table.
// ────────────────────────────────────────────────────────────────────────────

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { INTERESTS, type InterestId } from "@/lib/interests";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [picked, setPicked] = useState<InterestId[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Must be signed in to have a profile
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // Pre-select existing interests when editing
  useEffect(() => {
    if (profile) setPicked(profile.interests);
  }, [profile]);

  function toggle(id: InterestId) {
    setPicked((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, interests: picked, home_city: "Worcester, MA" });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
  }

  return (
    <div className="pt-24 px-4 pb-12 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-brand">What do you feel like doing?</h1>
      <p className="text-sm text-muted mt-1">
        Pick everything that sounds like you. You can change this any time.
      </p>

      <div className="grid sm:grid-cols-2 gap-3 mt-6">
        {INTERESTS.map((interest) => {
          const on = picked.includes(interest.id);
          return (
            <button
              key={interest.id}
              onClick={() => toggle(interest.id)}
              className={`text-left rounded-xl p-4 border transition-colors ${
                on ? "border-brand bg-sand shadow-md shadow-brand/20" : "border-line bg-surface hover:border-accent"
              }`}
            >
              <span className="text-2xl">{interest.emoji}</span>
              <p className="font-semibold mt-2">{interest.label}</p>
              <p className="text-xs text-muted">{interest.description}</p>
            </button>
          );
        })}
      </div>

      {error && <p className="text-sm text-alert mt-4">{error}</p>}

      <button
        onClick={save}
        disabled={!picked.length || saving}
        className="mt-6 w-full rounded-lg bg-brand py-3 font-semibold text-white shadow-md shadow-brand/20 disabled:opacity-40"
      >
        {saving ? "Saving…" : "Show me what's happening"}
      </button>
    </div>
  );
}
