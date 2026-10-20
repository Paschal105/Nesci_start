// ─── COMPONENT: EventMap ────────────────────────────────────────────────────
//
// The map, drawn with MapLibre (free, open-source) using OpenFreeMap's
// "positron" style — free OpenStreetMap tiles with no API key or card needed.
// MapLibre only works in the browser, so Discover loads this component with
// next/dynamic and ssr: false.
// ────────────────────────────────────────────────────────────────────────────

"use client";

import { useEffect, useRef } from "react";
import Map, { Marker, NavigationControl, Popup, type MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { formatEventDate, type Event } from "@/lib/types";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

interface Props {
  center: { lat: number; lng: number };
  events: Event[];
  selected: Event | null;
  onSelect: (event: Event | null) => void;
}

export default function EventMap({ center, events, selected, onSelect }: Props) {
  const mapRef = useRef<MapRef>(null);

  // Glide to a new city when the user searches, or to an event when picked
  useEffect(() => {
    const target = selected ?? center;
    mapRef.current?.flyTo({ center: [target.lng, target.lat], zoom: selected ? 14 : 12 });
  }, [center, selected]);

  return (
    <Map
      ref={mapRef}
      initialViewState={{ longitude: center.lng, latitude: center.lat, zoom: 12 }}
      style={{ width: "100%", height: "100%" }}
      mapStyle={MAP_STYLE}
    >
      <NavigationControl position="top-left" showCompass={false} />

      {events.map((event) => {
        const isSelected = selected?.id === event.id;
        return (
          <Marker
            key={event.id}
            longitude={event.lng}
            latitude={event.lat}
            onClick={(e) => {
              // Stop the click reaching the map, which would close the popup
              e.originalEvent.stopPropagation();
              onSelect(event);
            }}
          >
            {/* Restaurants are teal, events are terracotta */}
            <div
              className={`rounded-full border-2 border-white shadow cursor-pointer transition-transform ${
                event.source === "osm" ? "bg-accent" : "bg-brand"
              } ${isSelected ? "w-6 h-6" : "w-4 h-4"}`}
            />
          </Marker>
        );
      })}

      {selected && (
        <Popup
          longitude={selected.lng}
          latitude={selected.lat}
          anchor="bottom"
          offset={14}
          onClose={() => onSelect(null)}
          closeOnClick={false}
        >
          <div className="text-ink max-w-[220px]">
            <p className="font-semibold text-sm">{selected.name}</p>
            <p className="text-xs text-muted mt-1">{selected.venue}</p>
            <p className="text-xs text-muted">{formatEventDate(selected.date)}</p>
            {selected.description && <p className="text-xs text-ink mt-1">{selected.description}</p>}
            {selected.url && (
              <a href={selected.url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand underline mt-1 inline-block">
                {selected.source === "osm" ? "More info" : "Get tickets / sign up"}
              </a>
            )}
          </div>
        </Popup>
      )}
    </Map>
  );
}
