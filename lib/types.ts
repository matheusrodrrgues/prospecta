export type PostType = "noticia" | "publicacao";

export interface Post {
  id: string;
  slug: string;
  type: PostType;
  status: "draft" | "review" | "scheduled" | "published" | "archived";
  publishedAt: string;
  source: string;
  reference?: string | null;
  title: string;
  excerpt: string;
  body: string;
  tags: string[];
  authors?: string | null;
  coverUrl?: string | null;
  featured?: boolean;
}

export type NewsCategory = "mercado" | "tecnologia" | "sustentabilidade" | "politica" | "exploracao";

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  imageUrl?: string | null;
  publishedAt: string;
  category: NewsCategory;
  minerals: string[];
  keywords: string[];
  relevance: number;
}

export interface Region {
  id: string;
  slug: string;
  name: string;
  center: [number, number];
  zoom: number;
  areaKm2: number;
  description: string;
}

export interface Occurrence {
  id: string;
  regionSlug: string | null;
  name: string;
  coordinates: [number, number];
  category: "critico" | "estrategico" | "hub";
  mineral: string;
  status: string;
  description: string;
}

export interface ImageryPeriod {
  id: string;
  label: string;
  startsAt: string;
  endsAt: string;
  quality: number;
  cloudCoverage: number;
  sceneCount: number;
  tileUrl: string | null;
  status: "pending" | "processing" | "ready" | "failed";
}

export interface DashboardData {
  regions: Region[];
  occurrences: Occurrence[];
  periods: ImageryPeriod[];
  generatedAt: string;
  source: "database" | "seed";
}
