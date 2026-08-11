import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type FeedEntry = { title: string; url: string; description: string; publishedAt: string; imageUrl: string | null };

const allowedFeedHosts = new Set(["www.mining.com", "mining.com", "im-mining.com", "www.im-mining.com", "www.mining-technology.com", "mining-technology.com"]);
const miningTerms = /\b(mining|mineral|mineralization|ore|geology|exploration|critical minerals?|rare earth|copper|nickel|lithium|phosphate|uranium|gold|iron ore|mine)\b/i;

function decodeXml(value: string) {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
}

function plainText(value: string) {
  return decodeXml(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function field(xml: string, names: string[]) {
  for (const name of names) {
    const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
    if (match) return plainText(match[1]);
  }
  return "";
}

function parseFeed(xml: string): FeedEntry[] {
  const blocks = xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) ?? xml.match(/<entry(?:\s[^>]*)?>[\s\S]*?<\/entry>/gi) ?? [];
  return blocks.map((block) => {
    const atomLink = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1];
    const enclosure = block.match(/<(?:media:content|enclosure)[^>]+url=["']([^"']+)["'][^>]*>/i)?.[1] ?? null;
    const published = field(block, ["pubDate", "published", "updated"]);
    return {
      title: field(block, ["title"]),
      url: atomLink ?? field(block, ["link", "guid"]),
      description: field(block, ["description", "content:encoded", "summary", "content"]).slice(0, 4000),
      publishedAt: Number.isNaN(Date.parse(published)) ? new Date().toISOString() : new Date(published).toISOString(),
      imageUrl: enclosure
    };
  }).filter((entry) => entry.title && /^https?:\/\//.test(entry.url) && miningTerms.test(`${entry.title} ${entry.description}`));
}

async function curateWithAi(entry: FeedEntry, source: string) {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY não configurada");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_NEWS_MODEL ?? "gpt-5.6-luna",
      reasoning: { effort: "low" },
      instructions: "Você é o editor científico do Prospecta 4.0. Traduza e resuma notícias de mineração para português brasileiro. Preserve fatos e incertezas, não invente dados e não copie frases longas. Produza um título claro e um resumo independente de 45 a 75 palavras. Classifique apenas conteúdos realmente ligados a mineração, geologia, exploração, minerais críticos, tecnologia mineral, políticas do setor ou sustentabilidade. Use nomes de minerais em português.",
      input: JSON.stringify({ source, title: entry.title, excerpt: entry.description, published_at: entry.publishedAt }),
      text: { format: { type: "json_schema", name: "mining_news_card", strict: true, schema: {
        type: "object", additionalProperties: false,
        properties: {
          relevant: { type: "boolean" }, title_pt: { type: "string" }, summary_pt: { type: "string" },
          category: { type: "string", enum: ["mercado", "tecnologia", "sustentabilidade", "politica", "exploracao"] },
          minerals: { type: "array", items: { type: "string" }, maxItems: 6 },
          keywords: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 8 },
          relevance: { type: "integer", minimum: 0, maximum: 100 }
        }, required: ["relevant", "title_pt", "summary_pt", "category", "minerals", "keywords", "relevance"]
      } } }
    })
  });
  if (!response.ok) throw new Error(`OpenAI respondeu ${response.status}: ${(await response.text()).slice(0, 300)}`);
  const payload = await response.json() as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  const outputText = payload.output?.flatMap((item) => item.content ?? []).find((content) => content.type === "output_text")?.text;
  if (!outputText) throw new Error("A IA não retornou conteúdo estruturado");
  return JSON.parse(outputText) as { relevant: boolean; title_pt: string; summary_pt: string; category: string; minerals: string[]; keywords: string[]; relevance: number };
}

export async function ingestMiningNews(trigger: "cron" | "manual") {
  const db = createSupabaseAdminClient();
  if (!db) throw new Error("Banco não configurado");
  const { data: run, error: runError } = await db.from("processing_runs").insert({ kind: "news_ingestion", status: "running", metadata: { trigger } }).select("id").single();
  if (runError) throw new Error(runError.message);
  let collected = 0; let published = 0; const failures: string[] = [];
  try {
    const { data: sources, error } = await db.from("news_sources").select("id,name,feed_url").eq("active", true);
    if (error) throw new Error(error.message);
    for (const source of sources ?? []) {
      try {
        const feedUrl = new URL(source.feed_url);
        if (feedUrl.protocol !== "https:" || !allowedFeedHosts.has(feedUrl.hostname)) throw new Error("domínio de feed não autorizado");
        const feedResponse = await fetch(feedUrl, { headers: { "user-agent": "Prospecta4.0-NewsRadar/1.0" }, signal: AbortSignal.timeout(15000) });
        if (!feedResponse.ok) throw new Error(`feed respondeu ${feedResponse.status}`);
        const entries = parseFeed(await feedResponse.text()).slice(0, 8);
        for (const entry of entries) {
          const { data: existing } = await db.from("news_items").select("id").eq("source_url", entry.url).maybeSingle();
          if (existing) continue;
          collected++;
          try {
            const card = await curateWithAi(entry, source.name);
            const status = card.relevant && card.relevance >= 55 ? "published" : "rejected";
            const { error: insertError } = await db.from("news_items").insert({ source_id: source.id, source_url: entry.url, title_original: entry.title, snippet_original: entry.description, title_pt: card.title_pt, summary_pt: card.summary_pt, category: card.category, minerals: card.minerals, keywords: card.keywords, relevance: card.relevance, image_url: entry.imageUrl, published_at: entry.publishedAt, status });
            if (insertError) throw new Error(insertError.message);
            if (status === "published") published++;
          } catch (itemError) { failures.push(`${source.name}: ${itemError instanceof Error ? itemError.message : "falha no item"}`); }
        }
        await db.from("news_sources").update({ last_polled_at: new Date().toISOString() }).eq("id", source.id);
      } catch (sourceError) { failures.push(`${source.name}: ${sourceError instanceof Error ? sourceError.message : "falha na fonte"}`); }
    }
    await db.from("processing_runs").update({ status: failures.length && !published ? "failed" : "completed", finished_at: new Date().toISOString(), error_message: failures.length ? failures.slice(0, 5).join(" | ") : null, metadata: { trigger, collected, published, failures: failures.length } }).eq("id", run.id);
    return { runId: run.id, collected, published, failures: failures.length };
  } catch (error) {
    await db.from("processing_runs").update({ status: "failed", finished_at: new Date().toISOString(), error_message: error instanceof Error ? error.message : "Falha inesperada" }).eq("id", run.id);
    throw error;
  }
}
