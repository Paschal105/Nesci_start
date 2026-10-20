"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";

export default function Navbar() {
  const router = useRouter();
  const { user } = useAuth();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-line">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-brand tracking-tight">
          NESCI
        </Link>
        <div className="flex items-center gap-6 text-sm text-muted">
          <Link href="/" className="hover:text-accent transition-colors">
            Explore
          </Link>
          {user ? (
            <>
              <Link href="/submit" className="hover:text-accent transition-colors">
                Share an event
              </Link>
              <Link href="/onboarding" className="hover:text-accent transition-colors">
                My interests
              </Link>
              <button onClick={signOut} className="hover:text-alert transition-colors">
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className="hover:text-accent transition-colors">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
