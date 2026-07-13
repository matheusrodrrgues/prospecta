"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Activity, Cloud, Layers3, MapPinned, Satellite } from "lucide-react";
import { MapView } from "@/components/map-view";
import { filterOccurrences } from "@/lib/dashboard-utils";
import type { DashboardData } from "@/lib/types";
import "@/app/dashboard/dashboard.css";

export function Dashboard({ initialData }: { initialData: DashboardData }) {
  const [region, setRegion] = useState("all");
  const [category, setCategory] = useState<"all" | "critico" | "estrategico">("all");
  const [periodIndex, setPeriodIndex] = useState(initialData.periods.length - 1);
  const period = initialData.periods[periodIndex];
  const occurrences = useMemo(() => filterOccurrences(initialData.occurrences, region, category), [initialData.occurrences, region, category]);
  const selectedRegion = initialData.regions.find((r) => r.slug === region) ?? initialData.regions[0];
  const minerals = new Set(occurrences.filter((o) => o.category !== "hub").map((o) => o.mineral)).size;

  return <main className="dashboard-shell">
    <header className="dashboard-header"><Link href="/" className="brand"><span>PROSPECTA</span><b>4.0</b></Link><span className="dashboard-title">Dashboard Mineral</span><span className="live-pill"><i /> {initialData.source === "database" ? "Dados ativos" : "Modo demonstração"}</span><span className="period-pill">{period.label}</span></header>
    <aside className="dashboard-sidebar">
      <label>Região<select value={region} onChange={(e) => setRegion(e.target.value)}>{initialData.regions.map((r) => <option value={r.slug} key={r.id}>{r.name}</option>)}</select></label>
      <fieldset><legend>Categoria</legend>{(["all", "critico", "estrategico"] as const).map((value) => <button className={category === value ? "active" : ""} onClick={() => setCategory(value)} key={value}>{value === "all" ? "Todas" : value === "critico" ? "Críticos" : "Estratégicos"}</button>)}</fieldset>
      <div className="sidebar-meta"><Layers3 size={17}/><div><strong>{occurrences.length}</strong><small>pontos visíveis</small></div></div>
      <div className="sidebar-meta"><MapPinned size={17}/><div><strong>{selectedRegion.name}</strong><small>{selectedRegion.areaKm2.toLocaleString("pt-BR")} km² analisados</small></div></div>
      <div className="sidebar-source"><small>Fonte da sessão</small><strong>{initialData.source === "database" ? "PostgreSQL · PostGIS" : "Conjunto inicial validável"}</strong><span>Atualizado em {new Date(initialData.generatedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</span></div>
    </aside>
    <section className="dashboard-map"><MapView data={initialData} filteredIds={occurrences.map((o) => o.id)} period={period}/><div className="map-legend"><span><i className="critical"/>Crítico</span><span><i className="strategic"/>Estratégico</span><span><i className="hub"/>Base de pesquisa</span></div></section>
    <section className="dashboard-data">
      <div className="data-heading"><div><small>Recorte atual</small><h2>{selectedRegion.name}</h2><p>{selectedRegion.description}</p></div><Satellite /></div>
      <div className="stats"><article><Activity/><div><strong>{period.quality}%</strong><small>Qualidade do mosaico</small></div></article><article><Cloud/><div><strong>{period.cloudCoverage}%</strong><small>Cobertura de nuvens</small></div></article><article><Layers3/><div><strong>{period.sceneCount}</strong><small>Cenas processadas</small></div></article><article><MapPinned/><div><strong>{minerals}</strong><small>Minerais visíveis</small></div></article></div>
      <div className="timeline"><div><span>Período da imagem</span><b>{period.label.replace("_1", " · 1º semestre").replace("_2", " · 2º semestre")}</b></div><input aria-label="Período" type="range" min="0" max={initialData.periods.length - 1} value={periodIndex} onChange={(e) => setPeriodIndex(Number(e.target.value))}/><div className="timeline-labels"><span>{initialData.periods[0].label}</span><span>{initialData.periods.at(-1)?.label}</span></div></div>
    </section>
  </main>;
}
