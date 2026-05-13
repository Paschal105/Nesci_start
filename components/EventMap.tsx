"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import type { Event } from "@/lib/types";

const MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#0a0a0f" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a0a0f" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1f1f2e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#14141f" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#1f1f2e" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#05050a" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#10101a" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#10101a" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#1f1f2e" }] },
];

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 }; // NYC fallback

export default function EventMap() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  });

  const [events, setEvents] = useState<Event[]>([]);
  const [selected, setSelected] = useState<Event | null>(null);
  const [center, setCenter] = useState(DEFAULT_CENTER);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }, []);

  useEffect(() => {
    fetch(`/api/events?lat=${center.lat}&lng=${center.lng}`)
      .then((r) => r.json())
      .then((data) => setEvents(data.events ?? []))
      .catch(() => {});
  }, [center]);

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-bg-primary">
        <span className="neon-text-purple text-sm animate-pulse">Loading map…</span>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      center={center}
      zoom={12}
      options={{ styles: MAP_STYLES, disableDefaultUI: true, zoomControl: true }}
    >
      {events.map((event) => (
        <Marker
          key={event.id}
          position={{ lat: event.lat, lng: event.lng }}
          onClick={() => setSelected(event)}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#a855f7",
            fillOpacity: 1,
            strokeColor: "#06b6d4",
            strokeWeight: 2,
          }}
        />
      ))}

      {selected && (
        <InfoWindow
          position={{ lat: selected.lat, lng: selected.lng }}
          onCloseClick={() => setSelected(null)}
        >
          <div className="text-black max-w-[200px]">
            <p className="font-semibold text-sm">{selected.name}</p>
            <p className="text-xs text-gray-600 mt-1">{selected.venue}</p>
            <p className="text-xs text-gray-500">{selected.date}</p>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
