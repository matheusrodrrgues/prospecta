import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const db = createSupabaseAdminClient(); if (!db) return NextResponse.json({ error: "Banco não configurado" }, { status: 503 });
  const { data: run, error } = await db.from("processing_runs").insert({ kind: "imagery_sync", status: "queued", metadata: { trigger: "vercel-cron" } }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!process.env.PIPELINE_WEBHOOK_URL) return NextResponse.json({ queued: true, runId: run.id, warning: "PIPELINE_WEBHOOK_URL não configurada" }, { status: 202 });
  const response = await fetch(process.env.PIPELINE_WEBHOOK_URL, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${process.env.PIPELINE_WEBHOOK_SECRET}` }, body: JSON.stringify({ runId: run.id, mode: "incremental" }) });
  if (!response.ok) { await db.from("processing_runs").update({ status: "failed", finished_at: new Date().toISOString(), error_message: `Pipeline respondeu ${response.status}` }).eq("id", run.id); return NextResponse.json({ error: "Falha ao iniciar pipeline", runId: run.id }, { status: 502 }); }
  await db.from("processing_runs").update({ status: "running" }).eq("id", run.id);
  return NextResponse.json({ queued: true, runId: run.id }, { status: 202 });
}
