import { NextRequest, NextResponse } from "next/server";
import { fetchNearbyEvents } from "@/lib/ticketmaster";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get("lat") ?? "40.7128");
  const lng = parseFloat(searchParams.get("lng") ?? "-74.006");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const events = await fetchNearbyEvents(lat, lng);
  return NextResponse.json({ events });
}
