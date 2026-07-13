import { NextResponse } from "next/server";
import { getPublishedPosts } from "@/lib/repository";

export async function GET() {
  return NextResponse.json({ data: await getPublishedPosts() }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } });
}
