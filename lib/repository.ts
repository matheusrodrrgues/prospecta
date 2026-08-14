import { unstable_cache } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { seedDashboard, seedNews, seedPosts } from "@/lib/seed";
import type { DashboardData, NewsItem, Post } from "@/lib/types";

async function queryPublishedPosts(): Promise<Post[]> {
  const db = createSupabaseAdminClient();
  if (!db) return seedPosts;
  try {
    const { data, error } = await db
      .from("posts_public")
      .select("*")
      .order("published_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      slug: row.slug,
      type: row.type,
      status: "published",
      publishedAt: row.published_at,
      source: row.source,
      reference: row.reference,
      title: row.title,
      excerpt: row.excerpt,
      body: row.body,
      tags: row.tags ?? [],
      authors: row.authors,
      coverUrl: row.cover_url,
      featured: row.featured
    }));
  } catch (error) {
    console.warn("Could not load posts from Supabase; using seed data.", error);
    return seedPosts;
  }
}

export const getPublishedPosts = unstable_cache(queryPublishedPosts, ["posts-v2"], { revalidate: 300, tags: ["posts"] });

export async function getPostBySlug(slug: string) {
  const posts = await getPublishedPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

async function queryPublishedNews(): Promise<NewsItem[]> {
  const db = createSupabaseAdminClient();
  if (!db) return seedNews;
  try {
    const { data, error } = await db.from("news_items_public").select("*").order("published_at", { ascending: false }).limit(60);
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      title: row.title_pt,
      summary: row.summary_pt,
      source: row.source_name,
      sourceUrl: row.source_url,
      imageUrl: row.image_url,
      publishedAt: row.published_at,
      category: row.category,
      minerals: row.minerals ?? [],
      keywords: row.keywords ?? [],
      relevance: row.relevance
    }));
  } catch (error) {
    console.warn("Could not load news radar from Supabase; using seed data.", error);
    return seedNews;
  }
}

export const getPublishedNews = unstable_cache(queryPublishedNews, ["news-radar-v1"], { revalidate: 600, tags: ["news-radar"] });

async function queryDashboard(): Promise<DashboardData> {
  const db = createSupabaseAdminClient();
  if (!db) return { ...seedDashboard, generatedAt: new Date().toISOString() };
  try {
    const [regionsResult, occurrencesResult, periodsResult] = await Promise.all([
      db.from("regions_public").select("*").order("name"),
      db.from("occurrences_public").select("*").order("name"),
      db.from("imagery_periods_public").select("*").order("starts_at")
    ]);
    const error = regionsResult.error ?? occurrencesResult.error ?? periodsResult.error;
    if (error) throw error;

    return {
      regions: (regionsResult.data ?? []).map((r) => ({ id: r.id, slug: r.slug, name: r.name, center: [r.center_lng, r.center_lat], zoom: r.zoom, areaKm2: r.area_km2, description: r.description })),
      occurrences: (occurrencesResult.data ?? []).map((o) => ({ id: o.id, regionSlug: o.region_slug, name: o.name, coordinates: [o.longitude, o.latitude], category: o.category, mineral: o.mineral, status: o.status, description: o.description })),
      periods: (periodsResult.data ?? []).map((p) => ({ id: p.id, label: p.label, startsAt: p.starts_at, endsAt: p.ends_at, quality: p.quality, cloudCoverage: p.cloud_coverage, sceneCount: p.scene_count, tileUrl: p.tile_url, status: p.status })),
      generatedAt: new Date().toISOString(),
      source: "database"
    };
  } catch (error) {
    console.warn("Could not load dashboard from Supabase; using seed data.", error);
    return { ...seedDashboard, generatedAt: new Date().toISOString() };
  }
}

export const getDashboardData = unstable_cache(queryDashboard, ["dashboard-v2"], { revalidate: 900, tags: ["dashboard"] });
