import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email().max(200), subject: z.string().trim().min(3).max(160), message: z.string().trim().min(10).max(5000), website: z.string().max(0).optional() });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true }, { status: 202 });
  const db = createSupabaseAdminClient();
  if (!db) { console.info("Contact received in setup mode", { subject: parsed.data.subject }); return NextResponse.json({ ok: true, setupMode: true }, { status: 202 }); }
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ipHash = forwarded ? await sha256(forwarded + (process.env.CRON_SECRET ?? "")) : null;
  if (ipHash) {
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await db.from("contact_messages").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", since);
    if ((count ?? 0) >= 5) return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
  }
  const message = { ...parsed.data };
  delete message.website;
  const { error } = await db.from("contact_messages").insert({ ...message, ip_hash: ipHash, user_agent: request.headers.get("user-agent")?.slice(0, 500) });
  if (error) return NextResponse.json({ error: "Falha ao registrar mensagem" }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

async function sha256(value: string) { const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return Array.from(new Uint8Array(bytes)).map((b) => b.toString(16).padStart(2, "0")).join(""); }
