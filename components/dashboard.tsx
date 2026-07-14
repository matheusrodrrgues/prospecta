"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Braces,
  Check,
  Cloud,
  Database,
  Download,
  Eye,
  EyeOff,
  FileUp,
  Gem,
  Layers3,
  MapPinned,
  PanelLeftClose,
  PanelRightClose,
  Radar,
  RotateCcw,
  Satellite,
  Share2,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  UsersRound,
} from "lucide-react";
import { ContributionDialog } from "@/components/contribution-dialog";
import { MapView, type BaseMap, type CompositeMode, type ImportedPoint } from "@/components/map-view";
import type { CommunityLayer } from "@/lib/contributions";
import { filterOccurrences } from "@/lib/dashboard-utils";
import type { DashboardData } from "@/lib/types";
import "@/app/dashboard/dashboard.css";

const satellites = [
  { id: "aster", name: "ASTER", sensor: "VNIR/SWIR", resolution: "15–30 m", revisit: "16 dias", color: "#e2b56e" },
  { id: "sentinel-2", name: "Sentinel-2", sensor: "MSI", resolution: "10 m", revisit: "5 dias", color: "#b9dc6b" },
  { id: "sentinel-1", name: "Sentinel-1", sensor: "SAR · Banda C", resolution: "5×20 m", revisit: "6 dias", color: "#74b7a3" },
] as const;

const composites: Array<{ id: CompositeMode; label: string; bands: string; description: string }> = [
  { id: "natural", label: "Cor natural", bands: "RGB", description: "Leitura visual do terreno" },
  { id: "vegetation", label: "Vegetação", bands: "NDVI", description: "Resposta espectral da cobertura" },
  { id: "alteration", label: "Alteração", bands: "SWIR", description: "Realce de feições hidrotermais" },
  { id: "moisture", label: "Umidade", bands: "NDMI", description: "Contraste de umidade superficial" },
];

const mineralThemes = [
  { id: "potential", label: "Potencial mineral", detail: "Visão integrada", composite: "natural" as CompositeMode, threshold: 68, color: "#b9dc6b" },
  { id: "rare-earths", label: "Terras raras", detail: "ETR e alcalinas", composite: "alteration" as CompositeMode, threshold: 74, color: "#c8a6ff" },
  { id: "lithium", label: "Lítio e pegmatitos", detail: "Assinaturas SWIR", composite: "moisture" as CompositeMode, threshold: 71, color: "#65d7c0" },
  { id: "copper-gold", label: "Cobre e ouro", detail: "Alteração hidrotermal", composite: "alteration" as CompositeMode, threshold: 76, color: "#e2b56e" },
] as const;

function parseImportedData(value: string): ImportedPoint[] {
  const trimmed = value.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed);
    const features = parsed.type === "FeatureCollection" ? parsed.features : Array.isArray(parsed) ? parsed : [parsed];
    return features.slice(0, 500).flatMap((feature: Record<string, unknown>, index: number) => {
      const geometry = feature.geometry as { type?: string; coordinates?: number[] } | undefined;
      const properties = (feature.properties ?? {}) as Record<string, unknown>;
      if (geometry?.type !== "Point" || !Array.isArray(geometry.coordinates)) return [];
      const [longitude, latitude] = geometry.coordinates;
      const score = Number(properties.value ?? properties.valor ?? properties.score ?? 100);
      if (![longitude, latitude, score].every(Number.isFinite)) return [];
      return [{ id: `geojson-${index}`, longitude, latitude, score, label: String(properties.name ?? properties.nome ?? `Amostra ${index + 1}`) }];
    });
  }

  return trimmed.split(/\r?\n/).slice(0, 500).flatMap((line, index) => {
    if (!line.trim() || /lon|lng|latitude|valor|value/i.test(line)) return [];
    const [longitude, latitude, score, label] = line.split(/[;,\t]/).map((part) => part.trim());
    const point = { longitude: Number(longitude), latitude: Number(latitude), score: Number(score), label: label || `Amostra ${index + 1}` };
    return [point.longitude, point.latitude, point.score].every(Number.isFinite) ? [{ id: `csv-${index}`, ...point }] : [];
  });
}

export function Dashboard({ initialData }: { initialData: DashboardData }) {
  const [region, setRegion] = useState("all");
  const [category, setCategory] = useState<"all" | "critico" | "estrategico">("all");
  const [satellite, setSatellite] = useState<(typeof satellites)[number]["id"]>("sentinel-2");
  const [composite, setComposite] = useState<CompositeMode>("natural");
  const [baseMap, setBaseMap] = useState<BaseMap>("satellite");
  const [periodIndex, setPeriodIndex] = useState(initialData.periods.length - 1);
  const [imageryOpacity, setImageryOpacity] = useState(72);
  const [showOccurrences, setShowOccurrences] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [analysisThreshold, setAnalysisThreshold] = useState(68);
  const [analysisColor, setAnalysisColor] = useState("#b9dc6b");
  const [analysisRadius, setAnalysisRadius] = useState(24);
  const [dataText, setDataText] = useState("");
  const [importedPoints, setImportedPoints] = useState<ImportedPoint[]>([]);
  const [importError, setImportError] = useState("");
  const [activePanel, setActivePanel] = useState<"explore" | "analyze">("explore");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [contributionOpen, setContributionOpen] = useState(false);
  const [communityLayers, setCommunityLayers] = useState<CommunityLayer[]>([]);
  const [showCommunity, setShowCommunity] = useState(true);
  const [activeTheme, setActiveTheme] = useState<(typeof mineralThemes)[number]["id"]>("potential");
  const [shareState, setShareState] = useState("");

  const periods = initialData.periods;
  const period = periods[Math.min(periodIndex, Math.max(periods.length - 1, 0))] ?? initialData.periods.at(-1)!;
  const occurrences = useMemo(() => filterOccurrences(initialData.occurrences, region, category), [initialData.occurrences, region, category]);
  const selectedRegion = initialData.regions.find((item) => item.slug === region) ?? initialData.regions[0];
  const selectedSatellite = satellites.find((item) => item.id === satellite)!;
  const selectedComposite = composites.find((item) => item.id === composite)!;
  const selectedTheme = mineralThemes.find((item) => item.id === activeTheme)!;
  const minerals = new Set(occurrences.filter((item) => item.category !== "hub").map((item) => item.mineral)).size;
  const mineralBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    occurrences.filter((item) => item.category !== "hub").forEach((item) => counts.set(item.mineral, (counts.get(item.mineral) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [occurrences]);
  const maxMineralCount = Math.max(...mineralBreakdown.map(([, count]) => count), 1);
  const qualityPeriods = periods.slice(-12);
  const qualityStartIndex = periods.length - qualityPeriods.length;
  const activeLayers = 1 + Number(showOccurrences) + Number(showAnalysis) + Number(showCommunity);

  async function loadCommunityLayers() {
    const response = await fetch("/api/contributions", { cache: "no-store" });
    const body = await response.json() as { data?: CommunityLayer[] };
    setCommunityLayers(body.data ?? []);
  }

  useEffect(() => { void loadCommunityLayers(); }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedRegion = params.get("region"); const sharedTheme = params.get("theme");
    const sharedSensor = params.get("sensor"); const sharedPeriod = params.get("period");
    const sharedCategory = params.get("category");
    if (sharedRegion && initialData.regions.some((item) => item.slug === sharedRegion)) setRegion(sharedRegion);
    const theme = mineralThemes.find((item) => item.id === sharedTheme);
    if (theme) { setActiveTheme(theme.id); setComposite(theme.composite); setAnalysisThreshold(theme.threshold); setAnalysisColor(theme.color); }
    if (sharedSensor && satellites.some((item) => item.id === sharedSensor)) setSatellite(sharedSensor as (typeof satellites)[number]["id"]);
    const sharedPeriodIndex = periods.findIndex((item) => item.label === sharedPeriod);
    if (sharedPeriodIndex >= 0) setPeriodIndex(sharedPeriodIndex);
    if (sharedCategory === "all" || sharedCategory === "critico" || sharedCategory === "estrategico") setCategory(sharedCategory);
  }, [initialData.regions, periods]);

  function applyImportedData() {
    try {
      const points = parseImportedData(dataText);
      if (!points.length) throw new Error("Nenhum ponto válido encontrado.");
      setImportedPoints(points);
      setImportError("");
      setShowAnalysis(true);
    } catch {
      setImportError("Use CSV longitude,latitude,valor ou GeoJSON de pontos.");
    }
  }

  function resetWorkspace() {
    setRegion("all"); setCategory("all"); setSatellite("sentinel-2"); setComposite("natural");
    setBaseMap("satellite"); setPeriodIndex(initialData.periods.length - 1);
    setImageryOpacity(72); setShowOccurrences(true); setShowAnalysis(true); setAnalysisThreshold(68);
    setAnalysisColor("#b9dc6b"); setAnalysisRadius(24); setImportedPoints([]); setDataText(""); setImportError(""); setActiveTheme("potential");
  }

  function applyTheme(theme: (typeof mineralThemes)[number]) {
    setActiveTheme(theme.id); setComposite(theme.composite); setAnalysisThreshold(theme.threshold);
    setAnalysisColor(theme.color); setShowAnalysis(true);
  }

  async function shareCurrentView() {
    const url = new URL(window.location.href);
    url.searchParams.set("region", region); url.searchParams.set("theme", activeTheme);
    url.searchParams.set("sensor", satellite); url.searchParams.set("period", period.label);
    url.searchParams.set("category", category);
    try { await navigator.clipboard.writeText(url.toString()); setShareState("Link copiado"); }
    catch { setShareState("Copie o endereço do navegador"); }
    window.setTimeout(() => setShareState(""), 2200);
  }

  function downloadVisibleData() {
    const featureCollection = { type: "FeatureCollection", features: occurrences.map((item) => ({
      type: "Feature", geometry: { type: "Point", coordinates: item.coordinates },
      properties: { nome: item.name, mineral: item.mineral, categoria: item.category, status: item.status, descricao: item.description },
    })) };
    const blob = new Blob([JSON.stringify(featureCollection, null, 2)], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `prospecta-${region}-${period.label}.geojson`; anchor.click(); URL.revokeObjectURL(url);
  }

  return <main className={`geo-workspace ${leftOpen ? "left-open" : "left-closed"} ${rightOpen ? "right-open" : "right-closed"}`}>
    <header className="geo-header">
      <Link href="/" className="geo-back" aria-label="Voltar ao site"><ArrowLeft size={17}/></Link>
      <Link href="/" className="geo-brand"><span>PROSPECTA</span><b>4.0</b></Link>
      <div className="geo-product"><span>GeoLab</span><small>Exploração mineral</small></div>
      <div className="geo-status"><i />{initialData.source === "database" ? "PostGIS conectado" : "Dados de demonstração"}</div>
      <button className="contribute-button" onClick={() => setContributionOpen(true)}><UploadCloud size={15}/>Contribuir dados</button>
      <button className="header-action" onClick={resetWorkspace}><RotateCcw size={15}/>Redefinir</button>
      <div className="scene-chip"><Satellite size={14}/><span>{selectedSatellite.name}</span><b>{period.label}</b></div>
    </header>

    <aside className="geo-left-panel">
      <div className="panel-tabs">
        <button className={activePanel === "explore" ? "active" : ""} onClick={() => setActivePanel("explore")}><SlidersHorizontal size={15}/>Explorar</button>
        <button className={activePanel === "analyze" ? "active" : ""} onClick={() => setActivePanel("analyze")}><Sparkles size={15}/>Analisar</button>
      </div>

      {activePanel === "explore" ? <div className="panel-scroll">
        <section className="control-section theme-section">
          <div className="control-title"><span><Gem size={14}/></span><div><strong>Temas minerais</strong><small>Atalhos de interpretação exploratória</small></div></div>
          <div className="mineral-themes">{mineralThemes.map((theme) => <button key={theme.id} className={activeTheme === theme.id ? "active" : ""} onClick={() => applyTheme(theme)} style={{ "--theme-color": theme.color } as React.CSSProperties}><i/><div><strong>{theme.label}</strong><small>{theme.detail}</small></div>{activeTheme === theme.id && <Check size={14}/>}</button>)}</div>
        </section>
        <section className="control-section">
          <div className="control-title"><span>01</span><div><strong>Área de interesse</strong><small>Defina o recorte territorial</small></div></div>
          <label className="select-label">Região<select value={region} onChange={(event) => setRegion(event.target.value)}>{initialData.regions.map((item) => <option value={item.slug} key={item.id}>{item.name}</option>)}</select></label>
          <div className="segmented" aria-label="Categoria mineral">{(["all", "critico", "estrategico"] as const).map((value) => <button className={category === value ? "active" : ""} onClick={() => setCategory(value)} key={value}>{value === "all" ? "Todos" : value === "critico" ? "Críticos" : "Estratégicos"}</button>)}</div>
        </section>

        <section className="control-section">
          <div className="control-title"><span>02</span><div><strong>Catálogo orbital</strong><small>Escolha o sensor e a cena</small></div></div>
          <div className="satellite-list">{satellites.map((item) => <button key={item.id} className={satellite === item.id ? "active" : ""} onClick={() => setSatellite(item.id)}><i style={{ background: item.color }}/><div><strong>{item.name}</strong><small>{item.sensor} · {item.resolution}</small></div>{satellite === item.id && <Check size={15}/>}</button>)}</div>
        </section>

        <section className="control-section">
          <div className="control-title"><span>03</span><div><strong>Visualização</strong><small>Composição e mapa-base</small></div></div>
          <div className="composite-grid">{composites.map((item) => <button key={item.id} className={composite === item.id ? "active" : ""} onClick={() => setComposite(item.id)}><span>{item.bands}</span><strong>{item.label}</strong></button>)}</div>
          <label className="select-label">Mapa-base<select value={baseMap} onChange={(event) => setBaseMap(event.target.value as BaseMap)}><option value="satellite">Imagem orbital</option><option value="dark">Cartográfico escuro</option><option value="terrain">Relevo e terreno</option></select></label>
          <label className="range-label"><span>Opacidade <b>{imageryOpacity}%</b></span><input type="range" min="10" max="100" value={imageryOpacity} onChange={(event) => setImageryOpacity(Number(event.target.value))}/></label>
        </section>
      </div> : <div className="panel-scroll">
        <section className="control-section analysis-intro"><Radar/><div><strong>Classificação exploratória</strong><p>Defina um corte para realçar células com maior resposta espectral no recorte atual.</p></div></section>
        <section className="control-section">
          <label className="range-label prominent"><span>Índice mínimo <b>{analysisThreshold}</b></span><input type="range" min="0" max="100" value={analysisThreshold} onChange={(event) => setAnalysisThreshold(Number(event.target.value))}/></label>
          <div className="color-row"><label>Cor da classe<input type="color" value={analysisColor} onChange={(event) => setAnalysisColor(event.target.value)}/></label><label>Raio<input type="number" min="4" max="80" value={analysisRadius} onChange={(event) => setAnalysisRadius(Math.max(4, Math.min(80, Number(event.target.value))))}/><span>km</span></label></div>
          <button className={`layer-toggle ${showAnalysis ? "active" : ""}`} onClick={() => setShowAnalysis((value) => !value)}>{showAnalysis ? <Eye size={16}/> : <EyeOff size={16}/>}Superfície classificada<span>{showAnalysis ? "visível" : "oculta"}</span></button>
        </section>
        <section className="control-section data-import">
          <div className="control-title"><span><FileUp size={14}/></span><div><strong>Pintar seus dados</strong><small>CSV ou GeoJSON · até 500 pontos</small></div></div>
          <p>Cole longitude, latitude e valor. Valores acima do índice mínimo serão coloridos.</p>
          <textarea aria-label="Dados CSV ou GeoJSON" value={dataText} onChange={(event) => setDataText(event.target.value)} placeholder={"-41.930,-12.580,82,Alvo A\n-40.780,-11.320,64,Alvo B"}/>
          {importError && <div className="import-error">{importError}</div>}
          <button className="apply-data" onClick={applyImportedData}><Braces size={15}/>Colorir dados no mapa</button>
          {importedPoints.length > 0 && <div className="import-success"><Check size={14}/>{importedPoints.length} pontos carregados<button onClick={() => setImportedPoints([])}>remover</button></div>}
        </section>
      </div>}
    </aside>

    <section className="geo-map-stage">
      <MapView data={initialData} filteredIds={showOccurrences ? occurrences.map((item) => item.id) : []} period={period} region={selectedRegion} baseMap={baseMap} composite={composite} imageryOpacity={imageryOpacity / 100} showAnalysis={showAnalysis} analysisThreshold={analysisThreshold} analysisColor={analysisColor} analysisRadiusKm={analysisRadius} importedPoints={importedPoints} communityLayers={communityLayers} showCommunity={showCommunity}/>
      <button className="panel-peek left" onClick={() => setLeftOpen((value) => !value)} aria-label="Alternar filtros"><PanelLeftClose size={17}/></button>
      <button className="panel-peek right" onClick={() => setRightOpen((value) => !value)} aria-label="Alternar informações"><PanelRightClose size={17}/></button>
      <div className="map-topbar">
        <div><Radar size={15}/><span>{selectedTheme.label}</span><small>{selectedComposite.bands}</small></div>
        <div><Cloud size={14}/><span>{period.cloudCoverage}% nuvens</span></div>
        <div><Activity size={14}/><span>{period.quality}% qualidade</span></div>
      </div>
      <div className="map-legend-new"><strong>Legenda</strong><span><i className="critical"/>Crítico</span><span><i className="strategic"/>Estratégico</span><span><i className="analysis" style={{ background: analysisColor }}/>Índice ≥ {analysisThreshold}</span></div>
      <div className="map-coordinate">SIRGAS 2000 · EPSG:4674</div>
    </section>

    <aside className="geo-right-panel">
      <div className="insight-hero"><small>{selectedTheme.label} · recorte ativo</small><h1>{selectedRegion.name}</h1><p>{selectedRegion.description}</p><div><MapPinned size={14}/>{selectedRegion.areaKm2.toLocaleString("pt-BR")} km²</div></div>
      <div className="metric-grid"><article><span>Alvos</span><strong>{occurrences.length}</strong><small>ocorrências visíveis</small></article><article><span>Minerais</span><strong>{minerals}</strong><small>classes no recorte</small></article><article><span>Resolução</span><strong>{selectedSatellite.resolution}</strong><small>{selectedSatellite.sensor}</small></article><article><span>Revisita</span><strong>{selectedSatellite.revisit}</strong><small>frequência nominal</small></article></div>
      <div className="view-actions"><button onClick={() => void shareCurrentView()}><Share2 size={14}/>{shareState || "Compartilhar vista"}</button><button onClick={downloadVisibleData}><Download size={14}/>Baixar GeoJSON</button></div>
      <section className="layer-stack"><div className="right-title"><div><Layers3 size={15}/><strong>Camadas</strong></div><span>{activeLayers} ativas</span></div>
        <button className="layer-row active" onClick={() => setShowOccurrences((value) => !value)}><i className="layer-symbol points"/><div><strong>Ocorrências minerais</strong><small>{occurrences.length} feições</small></div>{showOccurrences ? <Eye size={15}/> : <EyeOff size={15}/>}</button>
        <button className="layer-row active"><i className="layer-symbol raster"/><div><strong>{selectedSatellite.name}</strong><small>{period.label} · {selectedComposite.bands}</small></div><Eye size={15}/></button>
        <button className={`layer-row ${showAnalysis ? "active" : ""}`} onClick={() => setShowAnalysis((value) => !value)}><i className="layer-symbol surface" style={{ background: analysisColor }}/><div><strong>Superfície analítica</strong><small>corte ≥ {analysisThreshold}</small></div>{showAnalysis ? <Eye size={15}/> : <EyeOff size={15}/>}</button>
        <button className={`layer-row ${showCommunity ? "active" : ""}`} onClick={() => setShowCommunity((value) => !value)}><i className="layer-symbol community"><UsersRound size={14}/></i><div><strong>Dados da comunidade</strong><small>{communityLayers.length} contribuições públicas</small></div>{showCommunity ? <Eye size={15}/> : <EyeOff size={15}/>}</button>
      </section>
      <section className="mineral-summary"><div className="right-title"><div><Gem size={15}/><strong>Ocorrências por substância</strong></div><span>recorte atual</span></div>
        {mineralBreakdown.length ? <div className="mineral-bars">{mineralBreakdown.map(([mineral, count]) => <div key={mineral}><span>{mineral}</span><i><b style={{ width: `${(count / maxMineralCount) * 100}%` }}/></i><strong>{count}</strong></div>)}</div> : <p className="empty-analysis">Nenhuma ocorrência no recorte selecionado.</p>}
      </section>
      <section className="quality-history"><div className="right-title"><div><Activity size={15}/><strong>Série dos mosaicos</strong></div><span>qualidade</span></div>
        <div className="quality-chart" aria-label="Qualidade dos mosaicos ao longo do tempo">{qualityPeriods.map((item, index) => <button key={item.id} className={item.id === period.id ? "active" : ""} onClick={() => setPeriodIndex(qualityStartIndex + index)} title={`${item.label}: ${item.quality}%`}><i style={{ height: `${Math.max(item.quality, 8)}%` }}/><span>{item.label.slice(2)}</span></button>)}</div>
      </section>
      <section className="scene-detail"><div className="right-title"><div><Satellite size={15}/><strong>Cena selecionada</strong></div><span className={`scene-status ${period.status}`}>{period.status === "ready" ? "pronta" : period.status}</span></div><dl><div><dt>Sensor</dt><dd>{selectedSatellite.sensor}</dd></div><div><dt>Período</dt><dd>{period.label}</dd></div><div><dt>Cenas</dt><dd>{period.sceneCount}</dd></div><div><dt>Nuvens</dt><dd>{period.cloudCoverage}%</dd></div></dl></section>
      <section className="period-control"><div><span>Linha do tempo</span><b>{period.label}</b></div><input aria-label="Período da imagem" type="range" min="0" max={Math.max(periods.length - 1, 0)} value={Math.min(periodIndex, Math.max(periods.length - 1, 0))} onChange={(event) => setPeriodIndex(Number(event.target.value))}/><div><small>{periods[0]?.label ?? "—"}</small><small>{periods.at(-1)?.label ?? "—"}</small></div></section>
      <footer className="data-provenance"><Database size={14}/><div><small>Fonte da sessão</small><strong>{initialData.source === "database" ? "PostgreSQL · PostGIS" : "Conjunto demonstrativo"}</strong><span>Atualizado em {new Date(initialData.generatedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</span></div></footer>
    </aside>
    <ContributionDialog open={contributionOpen} onClose={() => setContributionOpen(false)} onCreated={() => { window.setTimeout(() => void loadCommunityLayers(), 800); }}/>
  </main>;
}
