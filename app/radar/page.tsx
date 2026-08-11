import type { Metadata } from "next";
import { NewsRadar } from "@/components/news-radar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublishedNews } from "@/lib/repository";

export const metadata: Metadata = { title: "Radar Mineral", description: "Notícias internacionais de mineração resumidas e traduzidas com inteligência artificial." };

export default async function RadarPage() {
  const news = await getPublishedNews();
  return <><SiteHeader/><main className="radar-shell"><header className="radar-hero"><div className="eyebrow">Inteligência mineral · atualização contínua</div><h1>Radar<br/><em>Prospecta.</em></h1><p>Notícias globais de mineração, traduzidas e condensadas em português. Uma leitura rápida hoje; uma base estratégica para pesquisa amanhã.</p><div className="radar-stats"><span><b>{news.length}</b> conteúdos recentes</span><span><b>{new Set(news.flatMap((item) => item.keywords)).size}</b> sinais monitorados</span><span><b>{new Set(news.map((item) => item.source)).size}</b> fontes especializadas</span></div></header><NewsRadar items={news}/></main><SiteFooter/></>;
}
