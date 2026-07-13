"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireEditor } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const postSchema = z.object({
  id: z.string().uuid().optional(), slug: z.string().min(3).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  type: z.enum(["noticia", "publicacao"]), status: z.enum(["draft", "review", "scheduled", "published", "archived"]),
  title: z.string().min(8).max(240), excerpt: z.string().min(20).max(600), body: z.string().min(30).max(100000),
  source: z.string().min(2).max(160), reference: z.string().max(160).optional(), authors: z.string().max(1000).optional(),
  tags: z.string().max(1000), cover_url: z.string().url().optional().or(z.literal("")), published_at: z.string().optional()
});

export async function login(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/admin/login?setup=1");
  const email = String(formData.get("email") ?? ""); const password = String(formData.get("password") ?? "");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/admin/login?error=1");
  redirect("/admin");
}

export async function logout() { const supabase = await createSupabaseServerClient(); await supabase?.auth.signOut(); redirect("/"); }

export async function savePost(formData: FormData) {
  const actor = await requireEditor();
  const parsed = postSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues.map((issue) => issue.message).join("; "));
  const db = createSupabaseAdminClient(); if (!db) throw new Error("Supabase service role não configurada.");
  const { id, tags, published_at, cover_url, ...values } = parsed.data;
  const payload = { ...values, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean), cover_url: cover_url || null, reference: values.reference || null, authors: values.authors || null, published_at: published_at ? new Date(published_at).toISOString() : values.status === "published" ? new Date().toISOString() : null, updated_by: actor.user.id };
  const result = id ? await db.from("posts").update(payload).eq("id", id).select("id").single() : await db.from("posts").insert({ ...payload, created_by: actor.user.id }).select("id").single();
  if (result.error) throw new Error(result.error.message);
  revalidateTag("posts", "max"); revalidatePath("/blog"); redirect("/admin?success=post");
}

export async function deletePost(formData: FormData) {
  const actor = await requireEditor(); if (actor.role !== "admin") throw new Error("Apenas administradores podem excluir conteúdo.");
  const id = z.string().uuid().parse(formData.get("id")); const db = createSupabaseAdminClient();
  const { error } = await db!.from("posts").delete().eq("id", id); if (error) throw new Error(error.message);
  revalidateTag("posts", "max"); revalidatePath("/blog"); redirect("/admin?success=deleted");
}
