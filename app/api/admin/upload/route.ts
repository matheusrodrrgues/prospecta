import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function POST(request: Request) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const db = createSupabaseAdminClient(); const { data: profile } = await db!.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "editor"].includes(profile.role)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const formData = await request.formData(); const file = formData.get("file");
  if (!(file instanceof File) || !allowed.has(file.type) || file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "Arquivo inválido ou maior que 20 MB" }, { status: 400 });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-"); const blob = await put(`content/${crypto.randomUUID()}-${safeName}`, file, { access: "public", addRandomSuffix: false });
  return NextResponse.json({ url: blob.url, pathname: blob.pathname }, { status: 201 });
}
