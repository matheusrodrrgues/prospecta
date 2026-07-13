"use client";

import { useEffect, useRef, useState } from "react";
import type { CommunityLayer } from "@/lib/contributions";
import type { DashboardData, ImageryPeriod, Region } from "@/lib/types";

export type BaseMap = "satellite" | "dark" | "terrain";
export type CompositeMode = "natural" | "vegetation" | "alteration" | "moisture";
export interface ImportedPoint { id: string; longitude: number; latitude: number; score: number; label: string }

interface MapViewProps {
  data: DashboardData;
  filteredIds: string[];
  period: ImageryPeriod;
  region: Region;
  baseMap: BaseMap;
  composite: CompositeMode;
  imageryOpacity: number;
  showAnalysis: boolean;
  analysisThreshold: number;
  analysisColor: string;
  analysisRadiusKm: number;
  importedPoints: ImportedPoint[];
  communityLayers: CommunityLayer[];
  showCommunity: boolean;
}

const baseLayers: BaseMap[] = ["satellite", "dark", "terrain"];

function createAnalysisGrid(region: Region, seed: string) {
  const radius = Math.max(0.35, Math.sqrt(Math.max(region.areaKm2, 500) / Math.PI) / 111);
  const columns = 12;
  const rows = 10;
  const width = radius * 2 / columns;
  const height = radius * 1.6 / rows;
  const seedValue = [...seed].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const features: GeoJSON.Feature<GeoJSON.Polygon>[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = region.center[0] - radius + column * width;
      const y = region.center[1] - radius * .8 + row * height;
      const dx = (column - columns / 2) / (columns / 2);
      const dy = (row - rows / 2) / (rows / 2);
      if (dx * dx + dy * dy > 1.12) continue;
      const wave = Math.sin((column + seedValue * .01) * 1.31) + Math.cos((row - seedValue * .02) * 1.73);
      const hotspot = Math.max(0, 1 - Math.hypot(dx - .18, dy + .15));
      const value = Math.max(0, Math.min(100, Math.round(48 + wave * 15 + hotspot * 31)));
      features.push({ type: "Feature", properties: { value }, geometry: { type: "Polygon", coordinates: [[[x, y], [x + width * .92, y], [x + width * .92, y + height * .9], [x, y + height * .9], [x, y]]] } });
    }
  }
  return { type: "FeatureCollection" as const, features };
}

function pointsGeoJson(points: ImportedPoint[]) {
  return { type: "FeatureCollection" as const, features: points.map((point) => ({ type: "Feature" as const, properties: { id: point.id, value: point.score, label: point.label }, geometry: { type: "Point" as const, coordinates: [point.longitude, point.latitude] } })) };
}

export function MapView({ data, filteredIds, period, region, baseMap, composite, imageryOpacity, showAnalysis, analysisThreshold, analysisColor, analysisRadiusKm, importedPoints, communityLayers, showCommunity }: MapViewProps) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    async function mount() {
      if (!container.current || mapRef.current) return;
      const maplibregl = (await import("maplibre-gl")).default;
      if (disposed || !container.current) return;
      const map = new maplibregl.Map({
        container: container.current,
        center: [-41.8, -12.5],
        zoom: 5.8,
        minZoom: 4,
        maxZoom: 16,
        attributionControl: false,
        style: {
          version: 8,
          sources: {
            satellite: { type: "raster", tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, attribution: "Esri World Imagery" },
            dark: { type: "raster", tiles: ["https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"], tileSize: 256, attribution: "OpenStreetMap · CARTO" },
            terrain: { type: "raster", tiles: ["https://a.tile.opentopomap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "OpenTopoMap" },
          },
          layers: [
            { id: "base-satellite", type: "raster", source: "satellite" },
            { id: "base-dark", type: "raster", source: "dark", layout: { visibility: "none" } },
            { id: "base-terrain", type: "raster", source: "terrain", layout: { visibility: "none" } },
          ],
        },
      });
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");
      map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");
      map.on("load", () => {
        map.addSource("analysis", { type: "geojson", data: createAnalysisGrid(region, `${period.id}-${composite}`) });
        map.addLayer({ id: "analysis-fill", type: "fill", source: "analysis", paint: { "fill-color": analysisColor, "fill-opacity": ["interpolate", ["linear"], ["get", "value"], analysisThreshold, .12, 100, .72], "fill-outline-color": "rgba(255,255,255,.08)" }, filter: [">=", ["get", "value"], analysisThreshold] });
        map.addSource("imported-data", { type: "geojson", data: pointsGeoJson([]) });
        map.addLayer({ id: "imported-glow", type: "circle", source: "imported-data", paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 8, 10, analysisRadiusKm], "circle-color": analysisColor, "circle-opacity": .22, "circle-blur": .35 }, filter: [">=", ["get", "value"], analysisThreshold] });
        map.addLayer({ id: "imported-data", type: "circle", source: "imported-data", paint: { "circle-radius": 5, "circle-color": analysisColor, "circle-stroke-color": "#fff", "circle-stroke-width": 1, "circle-opacity": .95 }, filter: [">=", ["get", "value"], analysisThreshold] });
        map.addSource("community-data", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({ id: "community-glow", type: "circle", source: "community-data", paint: { "circle-radius": 15, "circle-color": "#65d7c0", "circle-opacity": .18, "circle-blur": .25 } });
        map.addLayer({ id: "community-data", type: "circle", source: "community-data", paint: { "circle-radius": 6, "circle-color": "#65d7c0", "circle-stroke-color": "#f3fff9", "circle-stroke-width": 1.5 } });
        map.addSource("occurrences", { type: "geojson", data: { type: "FeatureCollection", features: data.occurrences.map((item) => ({ type: "Feature", geometry: { type: "Point", coordinates: item.coordinates }, properties: { ...item } })) } });
        map.addLayer({ id: "occurrence-glow", type: "circle", source: "occurrences", paint: { "circle-radius": 16, "circle-color": ["match", ["get", "category"], "critico", "#e2b56e", "estrategico", "#b9dc6b", "#f4f0e5"], "circle-opacity": .16, "circle-blur": .2 } });
        map.addLayer({ id: "occurrences", type: "circle", source: "occurrences", paint: { "circle-radius": 6, "circle-stroke-width": 2, "circle-stroke-color": "#111914", "circle-color": ["match", ["get", "category"], "critico", "#e2b56e", "estrategico", "#b9dc6b", "#f4f0e5"] } });
        map.on("click", "occurrences", (event) => { const feature = event.features?.[0]; if (!feature) return; const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [number, number]; new maplibregl.Popup({ offset: 12 }).setLngLat(coordinates).setHTML(`<div class="geo-popup"><small>${feature.properties?.category}</small><strong>${feature.properties?.name}</strong><span>${feature.properties?.mineral}</span><p>${feature.properties?.description ?? feature.properties?.status}</p></div>`).addTo(map); });
        map.on("click", "imported-data", (event) => { const feature = event.features?.[0]; if (!feature) return; const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [number, number]; new maplibregl.Popup({ offset: 10 }).setLngLat(coordinates).setHTML(`<div class="geo-popup"><small>Dado importado</small><strong>${feature.properties?.label}</strong><span>Valor ${feature.properties?.value}</span></div>`).addTo(map); });
        map.on("click", "community-data", (event) => { const feature = event.features?.[0]; if (!feature) return; const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [number, number]; new maplibregl.Popup({ offset: 10 }).setLngLat(coordinates).setHTML(`<div class="geo-popup community"><small>Contribuição comunitária</small><strong>${feature.properties?.title}</strong><span>${feature.properties?.contributor}</span><p>Não verificado · ${feature.properties?.license}</p></div>`).addTo(map); });
        ["occurrences", "imported-data", "community-data"].forEach((layer) => { map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer"; }); map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; }); });
        setReady(true);
      });
      mapRef.current = map;
    }
    void mount();
    return () => { disposed = true; mapRef.current?.remove(); mapRef.current = null; };
  }, [data]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    baseLayers.forEach((layer) => map.setLayoutProperty(`base-${layer}`, "visibility", layer === baseMap ? "visible" : "none"));
  }, [baseMap, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const settings = { natural: [0, .1, 0], vegetation: [55, .35, .55], alteration: [-28, .42, .38], moisture: [145, .3, .45] }[composite];
    map.setPaintProperty("base-satellite", "raster-hue-rotate", settings[0]);
    map.setPaintProperty("base-satellite", "raster-contrast", settings[1]);
    map.setPaintProperty("base-satellite", "raster-saturation", settings[2]);
    map.setPaintProperty("base-satellite", "raster-opacity", imageryOpacity);
  }, [composite, imageryOpacity, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const filter: import("maplibre-gl").FilterSpecification = ["in", ["get", "id"], ["literal", filteredIds]];
    map.setFilter("occurrences", filter); map.setFilter("occurrence-glow", filter);
  }, [filteredIds, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.flyTo({ center: region.center, zoom: region.zoom, duration: 900, essential: true });
    const source = map.getSource("analysis") as import("maplibre-gl").GeoJSONSource;
    source.setData(createAnalysisGrid(region, `${period.id}-${composite}`));
  }, [region, period, composite, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const filter: import("maplibre-gl").FilterSpecification = [">=", ["get", "value"], analysisThreshold];
    map.setFilter("analysis-fill", filter); map.setFilter("imported-glow", filter); map.setFilter("imported-data", filter);
    map.setLayoutProperty("analysis-fill", "visibility", showAnalysis ? "visible" : "none");
    map.setLayoutProperty("imported-glow", "visibility", showAnalysis ? "visible" : "none");
    map.setLayoutProperty("imported-data", "visibility", showAnalysis ? "visible" : "none");
    map.setPaintProperty("analysis-fill", "fill-color", analysisColor);
    map.setPaintProperty("analysis-fill", "fill-opacity", ["interpolate", ["linear"], ["get", "value"], analysisThreshold, .12, 100, .72]);
    map.setPaintProperty("imported-glow", "circle-color", analysisColor);
    map.setPaintProperty("imported-glow", "circle-radius", ["interpolate", ["linear"], ["zoom"], 4, Math.max(5, analysisRadiusKm / 3), 10, analysisRadiusKm]);
    map.setPaintProperty("imported-data", "circle-color", analysisColor);
  }, [analysisThreshold, analysisColor, analysisRadiusKm, showAnalysis, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    (map.getSource("imported-data") as import("maplibre-gl").GeoJSONSource).setData(pointsGeoJson(importedPoints));
  }, [importedPoints, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const features = communityLayers.flatMap((layer) => (layer.geojson?.features ?? []).filter((feature) => feature.geometry?.type === "Point").map((feature) => ({ ...feature, properties: { ...(feature.properties ?? {}), submissionId: layer.id, title: layer.title, contributor: layer.organization || layer.contributorName, license: layer.license, status: layer.status } })));
    (map.getSource("community-data") as import("maplibre-gl").GeoJSONSource).setData({ type: "FeatureCollection", features } as GeoJSON.FeatureCollection);
    map.setLayoutProperty("community-data", "visibility", showCommunity ? "visible" : "none");
    map.setLayoutProperty("community-glow", "visibility", showCommunity ? "visible" : "none");
    for (let index = 0; index < 5; index += 1) {
      const layerId = `community-raster-${index}`, sourceId = `community-raster-source-${index}`;
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    }
    if (showCommunity) communityLayers.filter((layer) => layer.tileUrl).slice(0, 5).forEach((layer, index) => {
      const sourceId = `community-raster-source-${index}`, layerId = `community-raster-${index}`;
      map.addSource(sourceId, { type: "raster", tiles: [layer.tileUrl!], tileSize: 256 });
      map.addLayer({ id: layerId, type: "raster", source: sourceId, paint: { "raster-opacity": .62 } }, "community-glow");
    });
  }, [communityLayers, showCommunity, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    if (map.getLayer("imagery-mosaic")) map.removeLayer("imagery-mosaic");
    if (map.getSource("imagery-mosaic")) map.removeSource("imagery-mosaic");
    const usableTileUrl = period.tileUrl && !period.tileUrl.includes("prospecta40-tiles") ? period.tileUrl : null;
    if (usableTileUrl) { map.addSource("imagery-mosaic", { type: "raster", tiles: [usableTileUrl], tileSize: 256 }); map.addLayer({ id: "imagery-mosaic", type: "raster", source: "imagery-mosaic", paint: { "raster-opacity": imageryOpacity } }, "analysis-fill"); }
  }, [period, imageryOpacity, ready]);

  return <div className="map-container" ref={container} aria-label="Mapa interativo de exploração mineral"/>;
}
