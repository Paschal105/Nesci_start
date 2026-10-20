"use client";

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

interface Props {
  center: { lat: number; lng: number };
  events: Event[];
  selected: Event | null;
  onSelect: (event: Event | null) => void;
}

export default function EventMap({ center, events, selected, onSelect }: Props) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  });

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
      center={selected ? { lat: selected.lat, lng: selected.lng } : center}
      zoom={12}
      options={{ styles: MAP_STYLES, disableDefaultUI: true, zoomControl: true }}
    >
      {events.map((event) => (
        <Marker
          key={event.id}
          position={{ lat: event.lat, lng: event.lng }}
          onClick={() => onSelect(event)}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: selected?.id === event.id ? 11 : 8,
            // Restaurants are cyan, events are purple
            fillColor: event.source === "google" ? "#06b6d4" : "#a855f7",
            fillOpacity: 1,
            strokeColor: event.source === "google" ? "#a855f7" : "#06b6d4",
            strokeWeight: 2,
          }}
        />
      ))}

      {selected && (
        <InfoWindow
          position={{ lat: selected.lat, lng: selected.lng }}
          onCloseClick={() => onSelect(null)}
        >
          <div className="text-black max-w-[220px]">
            <p className="font-semibold text-sm">{selected.name}</p>
            <p className="text-xs text-gray-600 mt-1">{selected.venue}</p>
            <p className="text-xs text-gray-500">{selected.date}</p>
            {selected.description && <p className="text-xs text-gray-700 mt-1">{selected.description}</p>}
            {selected.url && (
              <a href={selected.url} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-600 underline mt-1 inline-block">
                {selected.source === "google" ? "View on Google Maps" : "Get tickets / sign up"}
              </a>
            )}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
