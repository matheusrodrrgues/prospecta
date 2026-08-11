import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { ingestMiningNews } from "@/lib/news-ingestion";

export const maxDuration = 300;

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  try {
    const result = await ingestMiningNews("cron");
    revalidateTag("news-radar", "max");
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha na sincronização" }, { status: 500 });
  }
}
