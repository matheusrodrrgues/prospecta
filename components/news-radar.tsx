"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, Search, Sparkles, TrendingUp } from "lucide-react";
import type { NewsCategory, NewsItem } from "@/lib/types";

const categoryLabels: Record<NewsCategory, string> = {
  mercado: "Mercado",
  tecnologia: "Tecnologia",
  sustentabilidade: "Sustentabilidade",
  politica: "Política mineral",
  exploracao: "Exploração"
};

export function NewsRadar({ items }: { items: NewsItem[] }) {
  const [category, setCategory] = useState<NewsCategory | "todas">("todas");
  const [query, setQuery] = useState("");
  const [start, setStart] = useState(0);
  const filtered = useMemo(() => items.filter((item) => {
    const categoryMatch = category === "todas" || item.category === category;
    const haystack = [item.title, item.summary, ...item.minerals, ...item.keywords].join(" ").toLocaleLowerCase("pt-BR");
    return categoryMatch && haystack.includes(query.trim().toLocaleLowerCase("pt-BR"));
  }), [category, items, query]);
  const visible = Array.from({ length: Math.min(3, filtered.length) }, (_, offset) => filtered[(start + offset) % filtered.length]);
  const terms = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((item) => item.keywords.forEach((term) => counts.set(term, (counts.get(term) ?? 0) + 1)));
    return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [items]);
  const move = (delta: number) => setStart((current) => filtered.length ? (current + delta + filtered.length) % filtered.length : 0);

  return <>
    <section className="radar-controls" aria-label="Filtros do radar">
      <label className="radar-search"><Search size={17}/><span className="sr-only">Buscar notícias</span><input value={query} onChange={(event) => { setQuery(event.target.value); setStart(0); }} placeholder="Busque mineral, tema ou tecnologia"/></label>
      <div className="radar-filters">
        <button className={category === "todas" ? "active" : ""} onClick={() => { setCategory("todas"); setStart(0); }}>Tudo</button>
        {(Object.keys(categoryLabels) as NewsCategory[]).map((key) => <button className={category === key ? "active" : ""} onClick={() => { setCategory(key); setStart(0); }} key={key}>{categoryLabels[key]}</button>)}
      </div>
    </section>

    <section className="radar-section" aria-live="polite">
      <div className="radar-section-heading"><div><span className="eyebrow"><Sparkles size={13}/> Curadoria por IA</span><h2>Leitura essencial</h2></div><div className="carousel-actions"><button onClick={() => move(-1)} aria-label="Notícias anteriores" disabled={filtered.length < 2}><ArrowLeft/></button><button onClick={() => move(1)} aria-label="Próximas notícias" disabled={filtered.length < 2}><ArrowRight/></button></div></div>
      {visible.length ? <div className="news-carousel">{visible.map((item, index) => <article className={`news-card ${index === 0 ? "primary" : ""}`} key={`${item.id}-${index}`}>
        <div className="news-card-top"><span>{categoryLabels[item.category]}</span><b>{item.relevance}% relevante</b></div>
        <div className="news-source">{item.source} · {new Date(item.publishedAt).toLocaleDateString("pt-BR")}</div>
        <h3>{item.title}</h3><p>{item.summary}</p>
        <div className="news-tags">{item.minerals.map((mineral) => <span key={mineral}>{mineral}</span>)}</div>
        <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">Ler na fonte <ExternalLink size={14}/></a>
      </article>)}</div> : <div className="radar-empty">Nenhuma notícia corresponde aos filtros.</div>}
    </section>

    <section className="signals-panel"><div><span className="eyebrow"><TrendingUp size={13}/> Base de conhecimento</span><h2>Sinais em movimento</h2><p>Os termos recorrentes formam uma memória temática do setor e ajudam a revelar assuntos que ganham tração ao longo do tempo.</p></div><div className="term-cloud">{terms.map(([term, count], index) => <button key={term} style={{ fontSize: `${Math.max(0.82, 1.45 - index * .07)}rem` }} onClick={() => setQuery(term)}>{term}<sup>{count}</sup></button>)}</div></section>
  </>;
}
