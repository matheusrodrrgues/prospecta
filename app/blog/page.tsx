import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublishedPosts } from "@/lib/repository";

export const metadata: Metadata = { title: "Publicações e notícias", description: "Produção científica e notícias do Prospecta 4.0." };

export default async function BlogPage() {
  const posts = await getPublishedPosts();
  return <><SiteHeader /><main className="page-shell"><div className="page-intro"><div className="eyebrow">Conhecimento aberto</div><h1>Publicações & notícias.</h1><p>Acompanhe resultados científicos, apresentações, notícias e atualizações do projeto.</p></div><div className="post-grid">{posts.map((post) => <Link className="post-card" href={`/blog/${post.slug}`} key={post.id}><small>{post.type} · {new Date(post.publishedAt).toLocaleDateString("pt-BR")}</small><h3>{post.title}</h3><p>{post.excerpt}</p><span>Ler conteúdo <ArrowRight size={15} /></span></Link>)}</div></main><SiteFooter /></>;
}
