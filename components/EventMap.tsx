"use client";

import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { formatEventDate, type Event } from "@/lib/types";

// A soft, warm map: muted colours, no business clutter, so event pins stand out
const MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#f7f1ea" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#7a6b5d" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#fff8f0" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#fbe3d3" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#cfe8e4" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#dcebd5" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#efe6dc" }] },
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
      <div className="w-full h-full flex items-center justify-center bg-cream">
        <span className="text-brand text-sm animate-pulse">Loading map…</span>
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
            // Restaurants are teal, events are terracotta
            fillColor: event.source === "google" ? "#0E8A7E" : "#D9532C",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          }}
        />
      ))}

      {selected && (
        <InfoWindow
          position={{ lat: selected.lat, lng: selected.lng }}
          onCloseClick={() => onSelect(null)}
        >
          <div className="text-ink max-w-[220px]">
            <p className="font-semibold text-sm">{selected.name}</p>
            <p className="text-xs text-muted mt-1">{selected.venue}</p>
            <p className="text-xs text-muted">{formatEventDate(selected.date)}</p>
            {selected.description && <p className="text-xs text-ink mt-1">{selected.description}</p>}
            {selected.url && (
              <a href={selected.url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand underline mt-1 inline-block">
                {selected.source === "google" ? "View on Google Maps" : "Get tickets / sign up"}
              </a>
            )}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
