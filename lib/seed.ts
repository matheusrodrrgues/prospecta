import type { DashboardData, ImageryPeriod, Occurrence, Post, Region } from "@/lib/types";

export const seedPosts: Post[] = [
  {
    id: "lula-trump-minerais-2026",
    slug: "lula-trump-minerais-2026",
    type: "noticia",
    status: "published",
    publishedAt: "2026-05-07T12:00:00.000Z",
    source: "G1 · Globo",
    reference: "07 Mai 2026",
    title: "Lula e Trump discutem potencial brasileiro em terras raras e minerais críticos",
    excerpt: "O potencial brasileiro em minerais críticos entrou no centro da agenda econômica e geopolítica global.",
    body: "O Brasil pretende ampliar o conhecimento sobre o próprio território e avançar na exploração de minerais críticos de forma planejada. O Prospecta 4.0 contribui para esse objetivo ao integrar ciência de dados, sensoriamento remoto e conhecimento geológico.",
    tags: ["Terras-raras", "Política mineral", "Brasil"],
    featured: true
  },
  {
    id: "prospecta-antecipa-demanda",
    slug: "prospecta-antecipa-demanda",
    type: "noticia",
    status: "published",
    publishedAt: "2026-04-20T12:00:00.000Z",
    source: "Prospecta 4.0",
    title: "A pesquisa que antecipa o que o mundo vai precisar",
    excerpt: "IA e geotecnologias ajudam a mapear o potencial mineral da Bahia antes que a demanda chegue.",
    body: "Enquanto governos negociam acesso a minerais críticos e estratégicos, o Prospecta 4.0 mapeia e modela o potencial mineral da Bahia com inteligência artificial e geotecnologias.",
    tags: ["Prospecta 4.0", "Bahia", "IA & Geotecnologias"],
    featured: true
  },
  {
    id: "fosfogenese-proterozoica-2025",
    slug: "fosfogenese-proterozoica-2025",
    type: "publicacao",
    status: "published",
    publishedAt: "2025-11-15T12:00:00.000Z",
    source: "XII SimeXmin · 2025",
    reference: "AT1-01-189",
    title: "Fosfogênese Proterozoica do Cráton do São Francisco",
    excerpt: "Conexões com eventos globais e implicações exploratórias para depósitos fosforíticos na Bahia.",
    body: "A pesquisa revisa as condições paleoambientais das mineralizações de fosfato no Cráton do São Francisco e conecta eventos glaciais e biogeoquímicos a janelas de formação de depósitos fosforíticos.",
    authors: "Ribeiro, T.S. · Franca-Rocha, W.S. · Oliveira, L.R. · Santana, A.V.A. · Misi, A.",
    tags: ["Fosfato", "Cráton do São Francisco", "Bahia"]
  }
];

export const seedRegions: Region[] = [
  { id: "bahia", slug: "all", name: "Bahia", center: [-41.8, -12.5], zoom: 6, areaKm2: 4842, description: "Área integrada de pesquisa do Prospecta 4.0." },
  { id: "irece", slug: "irece", name: "Bacia de Irecê", center: [-41.85, -11.3], zoom: 8, areaKm2: 1240, description: "Formação carbonática com potencial para fosfato sedimentar." },
  { id: "chapada", slug: "chapada", name: "Chapada Diamantina", center: [-41.5, -12.5], zoom: 8, areaKm2: 1580, description: "Ocorrências de ETR associadas a carbonatitos e rochas alcalinas." },
  { id: "caetite", slug: "caetite", name: "Caetité", center: [-42.48, -14.07], zoom: 9, areaKm2: 680, description: "Formação Lagoa Real com mineralização uranífera." },
  { id: "brumado", slug: "brumado", name: "Brumado", center: [-41.66, -14.2], zoom: 9, areaKm2: 520, description: "Depósito de magnesita metamórfica de classe mundial." },
  { id: "jacobina", slug: "jacobina", name: "Jacobina", center: [-40.52, -11.18], zoom: 9, areaKm2: 440, description: "Complexo máfico-ultramáfico com potencial para cromo e platinoides." },
  { id: "serrinha", slug: "serrinha", name: "Serrinha", center: [-39.0, -11.66], zoom: 9, areaKm2: 382, description: "Granitoides e ortognaisses com anomalias de ETR." }
];

export const seedOccurrences: Occurrence[] = [
  { id: "irece", regionSlug: "irece", name: "Bacia de Irecê", coordinates: [-41.85, -11.3], category: "estrategico", mineral: "Fosfato", status: "Em estudo", description: "Principal alvo de fosfato sedimentar." },
  { id: "chapada", regionSlug: "chapada", name: "Chapada Diamantina", coordinates: [-41.5, -12.5], category: "critico", mineral: "Terras-raras", status: "Identificado", description: "ETR associadas a carbonatitos e rochas alcalinas." },
  { id: "caetite", regionSlug: "caetite", name: "Caetité", coordinates: [-42.48, -14.07], category: "estrategico", mineral: "Urânio", status: "Mapeado", description: "Mineralização uranífera de expressão regional." },
  { id: "brumado", regionSlug: "brumado", name: "Brumado", coordinates: [-41.66, -14.2], category: "critico", mineral: "Magnesita", status: "Mapeado", description: "Depósito de magnesita metamórfica." },
  { id: "jacobina", regionSlug: "jacobina", name: "Jacobina", coordinates: [-40.52, -11.18], category: "estrategico", mineral: "Cromo", status: "Identificado", description: "Potencial para cromo e platinoides." },
  { id: "serrinha", regionSlug: "serrinha", name: "Serrinha", coordinates: [-39, -11.66], category: "critico", mineral: "Terras-raras", status: "Em estudo", description: "Anomalias de elementos terras-raras." },
  { id: "hub", regionSlug: null, name: "LAPIG · UEFS", coordinates: [-38.96, -12.26], category: "hub", mineral: "Hub", status: "Ativo", description: "Base de pesquisa do Prospecta 4.0." }
];

const qualities = [84, 57, 79, 52, 76, 61, 83, 74, 49, 80, 55, 77, 63, 85, 48, 78, 60, 82, 64, 87, 59, 84, 62, 81];
const labels = ["2000-2008", "2009_1", "2009_2", "2010_1", "2010_2", "2011_1", "2011_2", "2012_2", "2013_1", "2013_2", "2014_1", "2014_2", "2015_1", "2015_2", "2016_1", "2016_2", "2017_1", "2017_2", "2018_1", "2018_2", "2019_1", "2019_2", "2020_1", "2020_2"];

export const seedPeriods: ImageryPeriod[] = labels.map((label, index) => ({
  id: label,
  label,
  startsAt: label === "2000-2008" ? "2000-01-01" : `${label.slice(0, 4)}-${label.endsWith("_1") ? "01" : "07"}-01`,
  endsAt: label === "2000-2008" ? "2008-12-31" : `${label.slice(0, 4)}-${label.endsWith("_1") ? "06-30" : "12-31"}`,
  quality: qualities[index],
  cloudCoverage: Math.max(2, 35 - Math.round(qualities[index] / 3)),
  sceneCount: Math.max(6, Math.round(qualities[index] / 7)),
  tileUrl: `${process.env.NEXT_PUBLIC_GEO_TILES_URL ?? "https://storage.googleapis.com/prospecta40-tiles"}/${label}/{z}/{x}/{y}.png`,
  status: "ready"
}));

export const seedDashboard: DashboardData = {
  regions: seedRegions,
  occurrences: seedOccurrences,
  periods: seedPeriods,
  generatedAt: new Date().toISOString(),
  source: "seed"
};
