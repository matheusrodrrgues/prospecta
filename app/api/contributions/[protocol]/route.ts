import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, context: { params: Promise<{ protocol: string }> }) {
  const { protocol } = await context.params;
  if (!/^PRSP-\d{8}-[A-F0-9]{8}$/.test(protocol)) return NextResponse.json({ error: "Protocolo inválido" }, { status: 400 });
  const db = createSupabaseAdminClient();
  if (!db) return NextResponse.json({ data: null });
  const { data, error } = await db.from("data_submissions").select("protocol,title,dataset_type,status,validation,rejection_reason,created_at,updated_at").eq("protocol", protocol).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Contribuição não encontrada" }, { status: 404 });
  return NextResponse.json({ data: { protocol: data.protocol, title: data.title, datasetType: data.dataset_type, status: data.status, validation: data.validation, rejectionReason: data.rejection_reason, createdAt: data.created_at, updatedAt: data.updated_at } });
}
