import { del } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const MAX_COG_BYTES = 500 * 1024 * 1024;
const allowedTypes = ["image/tiff", "image/geotiff", "application/geotiff", "application/octet-stream"];

export async function POST(request: Request) {
  const body = await request.json() as HandleUploadBody;
  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = parsePayload(clientPayload);
        if (!payload || pathname !== `community/${payload.submissionId}/${payload.filename}`) throw new Error("Destino de upload inválido");
        const db = createSupabaseAdminClient();
        if (!db) throw new Error("Banco não configurado");
        const { data } = await db.from("data_submissions").select("id,status,protocol").eq("id", payload.submissionId).eq("protocol", payload.protocol).maybeSingle();
        if (!data || data.status !== "uploading") throw new Error("Contribuição não autorizada para upload");
        return { allowedContentTypes: allowedTypes, maximumSizeInBytes: MAX_COG_BYTES, addRandomSuffix: false, allowOverwrite: false, tokenPayload: clientPayload };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = parsePayload(tokenPayload ?? null);
        if (!payload) { await del(blob.url); return; }
        const db = createSupabaseAdminClient();
        if (!db) return;
        let validTiff = false;
        try {
          const response = await fetch(blob.url, { headers: { Range: "bytes=0-3" }, cache: "no-store" });
          const bytes = new Uint8Array(await response.arrayBuffer());
          validTiff = (bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00) || (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a);
        } catch { validTiff = false; }
        if (!validTiff) {
          await del(blob.url);
          await db.from("data_submissions").update({ status: "rejected", rejection_reason: "O arquivo não possui assinatura TIFF válida.", validation: { fileSignature: "failed" } }).eq("id", payload.submissionId);
          return;
        }
        const titiler = process.env.TITILER_BASE_URL?.replace(/\/$/, "");
        const tileUrl = titiler ? `${titiler}/cog/tiles/WebMercatorQuad/{z}/{x}/{y}.png?url=${encodeURIComponent(blob.url)}` : null;
        await db.from("data_submissions").update({ blob_url: blob.url, blob_pathname: blob.pathname, tile_url: tileUrl, status: "community", validation: { fileSignature: "tiff", cogValidation: "pending", scientificReview: "pending" } }).eq("id", payload.submissionId);
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload recusado" }, { status: 400 });
  }
}

function parsePayload(value: string | null) {
  try {
    const parsed = JSON.parse(value ?? "") as { submissionId?: string; protocol?: string; filename?: string };
    if (!parsed.submissionId || !parsed.protocol || !parsed.filename) return null;
    if (!/^[a-f0-9-]{36}$/i.test(parsed.submissionId) || !/^PRSP-\d{8}-[A-F0-9]{8}$/.test(parsed.protocol) || !/^[a-zA-Z0-9._-]+\.(tif|tiff)$/i.test(parsed.filename)) return null;
    return parsed as { submissionId: string; protocol: string; filename: string };
  } catch { return null; }
}
