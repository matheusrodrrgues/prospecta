import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPostBySlug, getPublishedPosts } from "@/lib/repository";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() { return (await getPublishedPosts()).map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const post = await getPostBySlug((await params).slug); return post ? { title: post.title, description: post.excerpt } : {}; }

export default async function PostPage({ params }: Props) {
  const post = await getPostBySlug((await params).slug);
  if (!post) notFound();
  return <><SiteHeader /><main className="article-shell"><Link className="text-link" href="/blog">← Voltar</Link><div className="article-meta" style={{marginTop:55}}>{post.type} · {new Date(post.publishedAt).toLocaleDateString("pt-BR")} · {post.source}</div><h1>{post.title}</h1><p className="lead">{post.excerpt}</p>{post.authors && <p><strong>Autores:</strong> {post.authors}</p>}<div className="article-body">{post.body.split("\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div><div className="article-tags">{post.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div></main><SiteFooter /></>;
}
