import { NextResponse } from "next/server";
import { contributionSchema, createProtocol, hashVisitor, parseGeoData, verifyTurnstile } from "@/lib/contributions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const db = createSupabaseAdminClient();
  if (!db) return NextResponse.json({ data: [] });
  const { data, error } = await db.from("community_layers_public").select("*").order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ data: [], error: "Camadas comunitárias ainda não estão configuradas." });
  return NextResponse.json({ data: (data ?? []).map((row) => ({
    id: row.id, protocol: row.protocol, title: row.title, contributorName: row.contributor_name, organization: row.organization,
    datasetType: row.dataset_type, periodLabel: row.period_label, satellite: row.satellite, methodology: row.methodology,
    license: row.license, reviewUrl: row.review_url, externalUrl: row.external_url, geojson: row.geojson, tileUrl: row.tile_url,
    status: row.status, createdAt: row.created_at,
  })) }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}

export async function POST(request: Request) {
  const parsed = contributionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revise os campos obrigatórios.", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true }, { status: 202 });

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!await verifyTurnstile(parsed.data.turnstileToken, forwarded)) return NextResponse.json({ error: "Não foi possível validar que o envio é legítimo." }, { status: 403 });
  const ipHash = await hashVisitor(forwarded);
  const db = createSupabaseAdminClient();
  const protocol = createProtocol();
  const id = crypto.randomUUID();

  if (db) {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await db.from("data_submissions").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", since);
    if ((count ?? 0) >= 6) return NextResponse.json({ error: "Limite de seis contribuições por hora atingido." }, { status: 429 });
  }

  let geojson: GeoJSON.FeatureCollection | null = null;
  if (parsed.data.datasetType === "inline") {
    try { geojson = parseGeoData(parsed.data.inlineData); }
    catch { return NextResponse.json({ error: "CSV ou GeoJSON sem pontos válidos." }, { status: 400 }); }
  }

  if (parsed.data.reviewUrl && new URL(parsed.data.reviewUrl).protocol !== "https:") return NextResponse.json({ error: "O link de revisão precisa usar HTTPS." }, { status: 400 });
  if (parsed.data.externalUrl && (!isPublicHttps(parsed.data.externalUrl))) return NextResponse.json({ error: "Informe uma URL HTTPS pública para o COG." }, { status: 400 });

  const titiler = process.env.TITILER_BASE_URL?.replace(/\/$/, "");
  const tileUrl = parsed.data.datasetType === "remote_cog" && parsed.data.externalUrl && titiler
    ? `${titiler}/cog/tiles/WebMercatorQuad/{z}/{x}/{y}.png?url=${encodeURIComponent(parsed.data.externalUrl)}` : null;
  const status = parsed.data.datasetType === "inline" ? "community" : parsed.data.datasetType === "cog" ? "uploading" : parsed.data.datasetType === "remote_cog" ? "community" : "received";
  const validation = parsed.data.datasetType === "inline" ? { basic: "passed", featureCount: geojson?.features.length, scientificReview: "pending" }
    : parsed.data.datasetType === "remote_cog" ? { url: "accepted", cogValidation: "pending", scientificReview: "pending" } : { scientificReview: "pending" };

  if (!db) return NextResponse.json({ ok: true, id, protocol, status, setupMode: true }, { status: 201 });
  const { error } = await db.from("data_submissions").insert({
    id, protocol, title: parsed.data.title, contributor_name: parsed.data.contributorName, contributor_email: parsed.data.contributorEmail,
    organization: parsed.data.organization || null, dataset_type: parsed.data.datasetType, period_label: parsed.data.periodLabel || null,
    satellite: parsed.data.satellite || null, methodology: parsed.data.methodology, license: parsed.data.license,
    review_url: parsed.data.reviewUrl || null, external_url: parsed.data.externalUrl || null, original_filename: parsed.data.fileName || null,
    content_type: parsed.data.contentType || null, file_size: parsed.data.fileSize ?? null, geojson, tile_url: tileUrl, status, validation,
    ip_hash: ipHash, user_agent: request.headers.get("user-agent")?.slice(0, 500), terms_accepted: true,
  });
  if (error) return NextResponse.json({ error: "Não foi possível registrar a contribuição." }, { status: 500 });
  return NextResponse.json({ ok: true, id, protocol, status }, { status: 201 });
}

function isPublicHttps(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    return !/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(url.hostname);
  } catch { return false; }
}
