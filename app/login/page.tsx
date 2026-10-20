// ─── PAGE: Login / Sign up (/login) ─────────────────────────────────────────
//
// One form that does both. After signing in, users without any interests yet
// go to /onboarding (the taste quiz); everyone else goes home.
// ────────────────────────────────────────────────────────────────────────────

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);

    const { data, error } =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    // If email confirmation is on in Supabase, sign-up returns no session yet
    if (!data.session) {
      setMessage("Check your email to confirm your account, then sign in.");
      setMode("signin");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("interests")
      .eq("id", data.session.user.id)
      .maybeSingle();
    router.push(profile?.interests?.length ? "/" : "/onboarding");
  }

  return (
    <div className="pt-28 px-4 flex justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm glass rounded-xl p-6 space-y-4">
        <h1 className="text-2xl font-bold neon-text-purple">
          {mode === "signup" ? "Join Nesci" : "Welcome back"}
        </h1>
        <p className="text-sm text-gray-400">
          {mode === "signup"
            ? "Find something to do today, not months from now."
            : "Sign in to see what's happening near you."}
        </p>

        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg bg-bg-card border border-border px-3 py-2 text-sm outline-none focus:border-neon-purple"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Password (6+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg bg-bg-card border border-border px-3 py-2 text-sm outline-none focus:border-neon-purple"
        />

        {message && <p className="text-sm text-neon-pink">{message}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-neon-purple py-2 text-sm font-semibold text-white neon-glow-purple disabled:opacity-50"
        >
          {busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="w-full text-xs text-gray-400 hover:text-neon-cyan"
        >
          {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </form>
    </div>
  );
}
