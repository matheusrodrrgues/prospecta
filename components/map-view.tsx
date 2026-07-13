"use client";

import { useEffect, useRef } from "react";
import type { DashboardData, ImageryPeriod } from "@/lib/types";

export function MapView({ data, filteredIds, period }: { data: DashboardData; filteredIds: string[]; period: ImageryPeriod }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);

  useEffect(() => {
    let disposed = false;
    async function mount() {
      if (!container.current || mapRef.current) return;
      const maplibregl = (await import("maplibre-gl")).default;
      if (disposed || !container.current) return;
      const map = new maplibregl.Map({ container: container.current, center: [-41.8, -12.5], zoom: 5.8, style: { version: 8, sources: { carto: { type: "raster", tiles: ["https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap © CARTO" } }, layers: [{ id: "carto", type: "raster", source: "carto" }] } });
      map.addControl(new maplibregl.NavigationControl(), "bottom-right");
      map.on("load", () => {
        map.addSource("occurrences", { type: "geojson", data: { type: "FeatureCollection", features: data.occurrences.map((o) => ({ type: "Feature", geometry: { type: "Point", coordinates: o.coordinates }, properties: { ...o } })) } });
        map.addLayer({ id: "occurrence-glow", type: "circle", source: "occurrences", paint: { "circle-radius": 13, "circle-color": ["match", ["get", "category"], "critico", "#c7a46a", "estrategico", "#b7d36b", "#f4f0e5"], "circle-opacity": .15 } });
        map.addLayer({ id: "occurrences", type: "circle", source: "occurrences", paint: { "circle-radius": 6, "circle-stroke-width": 2, "circle-stroke-color": "#16231d", "circle-color": ["match", ["get", "category"], "critico", "#c7a46a", "estrategico", "#b7d36b", "#f4f0e5"] } });
        map.on("click", "occurrences", (event) => { const f = event.features?.[0]; if (!f) return; const coordinates = (f.geometry as GeoJSON.Point).coordinates as [number, number]; new maplibregl.Popup().setLngLat(coordinates).setHTML(`<strong>${f.properties?.name}</strong><br>${f.properties?.mineral}<br><small>${f.properties?.status}</small>`).addTo(map); });
        map.on("mouseenter", "occurrences", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "occurrences", () => { map.getCanvas().style.cursor = ""; });
      });
      mapRef.current = map;
    }
    void mount();
    return () => { disposed = true; mapRef.current?.remove(); mapRef.current = null; };
  }, [data]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer("occurrences")) return;
    const filter: import("maplibre-gl").FilterSpecification = ["in", ["get", "id"], ["literal", filteredIds]];
    map.setFilter("occurrences", filter); map.setFilter("occurrence-glow", filter);
  }, [filteredIds]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.loaded()) return;
    if (map.getLayer("imagery")) map.removeLayer("imagery");
    if (map.getSource("imagery")) map.removeSource("imagery");
    if (period.tileUrl) { map.addSource("imagery", { type: "raster", tiles: [period.tileUrl], tileSize: 256 }); map.addLayer({ id: "imagery", type: "raster", source: "imagery", paint: { "raster-opacity": .7 } }, "occurrence-glow"); }
  }, [period]);

  return <div className="map-container" ref={container} aria-label="Mapa de ocorrências minerais" />;
}
