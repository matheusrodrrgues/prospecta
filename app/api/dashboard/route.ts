import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/repository";

export async function GET() {
  return NextResponse.json({ data: await getDashboardData() }, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=86400" } });
}
