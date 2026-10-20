// ─── HOOK: useAuth ──────────────────────────────────────────────────────────
//
// Gives any client component the signed-in user and their profile.
// Supabase keeps the session in the browser's localStorage, so this works
// across page reloads. onAuthStateChange fires on sign-in and sign-out.
// ────────────────────────────────────────────────────────────────────────────

"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { Profile } from "./types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (u: User | null) => {
    if (!u) {
      setProfile(null);
      return;
    }
    const { data } = await supabase.from("profiles").select("*").eq("id", u.id).maybeSingle();
    setProfile(data);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      await loadProfile(u);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      // Supabase advises against calling it from inside this callback directly
      setTimeout(() => loadProfile(u), 0);
    });
    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  return { user, profile, loading };
}
