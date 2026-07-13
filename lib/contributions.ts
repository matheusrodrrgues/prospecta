import { z } from "zod";

export const contributionSchema = z.object({
  title: z.string().trim().min(3).max(160),
  contributorName: z.string().trim().min(2).max(120),
  contributorEmail: z.string().trim().email().max(200),
  organization: z.string().trim().max(160).optional().default(""),
  datasetType: z.enum(["inline", "cog", "remote_cog", "earth_engine"]),
  periodLabel: z.string().trim().max(40).optional().default(""),
  satellite: z.string().trim().max(80).optional().default(""),
  methodology: z.string().trim().min(20).max(5000),
  license: z.enum(["CC-BY-4.0", "CC-BY-SA-4.0", "CC0-1.0", "restrita"]),
  reviewUrl: z.string().trim().url().max(1000).optional().or(z.literal("")),
  externalUrl: z.string().trim().url().max(2000).optional().or(z.literal("")),
  inlineData: z.string().max(1_000_000).optional().default(""),
  fileName: z.string().trim().max(240).optional().default(""),
  fileSize: z.number().int().min(0).max(500 * 1024 * 1024).optional(),
  contentType: z.string().trim().max(120).optional().default(""),
  termsAccepted: z.literal(true),
  website: z.string().max(0).optional(),
  turnstileToken: z.string().max(2048).optional().default(""),
}).superRefine((value, context) => {
  if (value.datasetType === "inline" && !value.inlineData.trim()) context.addIssue({ code: "custom", path: ["inlineData"], message: "Informe os dados CSV ou GeoJSON." });
  if (value.datasetType === "cog" && !value.fileName) context.addIssue({ code: "custom", path: ["fileName"], message: "Selecione um GeoTIFF/COG." });
  if (value.datasetType === "remote_cog" && !value.externalUrl) context.addIssue({ code: "custom", path: ["externalUrl"], message: "Informe a URL HTTPS do COG." });
  if (value.datasetType === "earth_engine" && !value.reviewUrl) context.addIssue({ code: "custom", path: ["reviewUrl"], message: "Informe o link compartilhado do Earth Engine." });
});

export type ContributionInput = z.infer<typeof contributionSchema>;

export interface CommunityLayer {
  id: string;
  protocol: string;
  title: string;
  contributorName: string;
  organization: string | null;
  datasetType: ContributionInput["datasetType"];
  periodLabel: string | null;
  satellite: string | null;
  methodology: string;
  license: string;
  reviewUrl: string | null;
  externalUrl: string | null;
  geojson: GeoJSON.FeatureCollection | null;
  tileUrl: string | null;
  status: "community" | "verified" | "official";
  createdAt: string;
}

export function parseGeoData(value: string): GeoJSON.FeatureCollection {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Dados vazios");

  let features: GeoJSON.Feature<GeoJSON.Point>[] = [];
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed);
    const candidates = parsed.type === "FeatureCollection" ? parsed.features : Array.isArray(parsed) ? parsed : [parsed];
    features = candidates.slice(0, 5000).flatMap((feature: GeoJSON.Feature, index: number) => {
      if (feature?.geometry?.type !== "Point") return [];
      const [longitude, latitude] = feature.geometry.coordinates as number[];
      if (!validCoordinate(longitude, latitude)) return [];
      const properties = (feature.properties ?? {}) as Record<string, unknown>;
      const value = finiteValue(properties.value ?? properties.valor ?? properties.score ?? 100);
      return [{ type: "Feature", geometry: { type: "Point", coordinates: [longitude, latitude] }, properties: { ...properties, value, label: String(properties.label ?? properties.name ?? properties.nome ?? `Amostra ${index + 1}`) } }];
    });
  } else {
    features = trimmed.split(/\r?\n/).slice(0, 5001).flatMap((line, index) => {
      if (!line.trim() || /lon|lng|latitude|valor|value/i.test(line)) return [];
      const [rawLongitude, rawLatitude, rawValue, rawLabel] = line.split(/[;,\t]/).map((part) => part.trim());
      const longitude = Number(rawLongitude), latitude = Number(rawLatitude);
      if (!validCoordinate(longitude, latitude)) return [];
      return [{ type: "Feature", geometry: { type: "Point", coordinates: [longitude, latitude] }, properties: { value: finiteValue(rawValue), label: rawLabel || `Amostra ${index + 1}` } }];
    });
  }
  if (!features.length) throw new Error("Nenhum ponto válido encontrado");
  return { type: "FeatureCollection", features };
}

function validCoordinate(longitude: number, latitude: number) { return Number.isFinite(longitude) && Number.isFinite(latitude) && longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90; }
function finiteValue(value: unknown) { const result = Number(value); return Number.isFinite(result) ? result : 100; }

export function createProtocol() {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `PRSP-${stamp}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export function safeFilename(name: string) { return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(-180); }

export async function hashVisitor(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value + (process.env.CRON_SECRET ?? "prospecta")));
  return Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function verifyTurnstile(token: string, ip?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ secret, response: token, remoteip: ip, idempotency_key: crypto.randomUUID() }), cache: "no-store" });
  const result = await response.json() as { success?: boolean };
  return result.success === true;
}
