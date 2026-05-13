"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[#1f1f2e]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold neon-text-purple tracking-tight">
          NESCI
        </Link>
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <Link href="/" className="hover:text-neon-cyan transition-colors">
            Explore
          </Link>
          <Link href="/events" className="hover:text-neon-cyan transition-colors">
            Events
          </Link>
        </div>
      </div>
    </nav>
  );
}
