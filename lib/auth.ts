import { redirect } from "next/navigation";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireEditor() {
  if (!isSupabaseConfigured()) redirect("/admin/login?setup=1");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase!.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase!.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "editor", "reviewer"].includes(profile.role)) redirect("/admin/login?forbidden=1");
  return { user, role: profile.role as "admin" | "editor" | "reviewer" };
}
