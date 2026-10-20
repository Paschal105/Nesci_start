import { NextRequest, NextResponse } from "next/server";
import { geocodeCity } from "@/lib/places";

// GET /api/geocode?q=Boston, MA → { lat, lng, label }
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing q" }, { status: 400 });
  }

  const place = await geocodeCity(q);
  if (!place) {
    return NextResponse.json({ error: "Place not found" }, { status: 404 });
  }
  return NextResponse.json(place);
}
