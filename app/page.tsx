import Link from "next/link";
import { ArrowRight, Atom, BrainCircuit, Database, Map, Satellite, ScanSearch } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublishedPosts } from "@/lib/repository";

export default async function HomePage() {
  const posts = (await getPublishedPosts()).slice(0, 3);
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          <div className="eyebrow">Pesquisa aplicada · Bahia · Brasil</div>
          <h1>O futuro mineral começa com <em>inteligência territorial.</em></h1>
          <p>Integramos geologia, sensoriamento remoto, inteligência artificial e ciência de dados para revelar o potencial de minerais críticos e estratégicos da Bahia.</p>
          <div className="hero-actions"><Link className="button" href="/dashboard">Explorar o dashboard <ArrowRight size={17} /></Link><Link className="text-link" href="#sobre">Conheça o projeto</Link></div>
          <div className="hero-grid"><span>Terras-raras</span><span>Fosfato</span><span>Urânio</span><span>Magnesita</span><span>Cromo</span></div>
        </section>

        <section className="section two-col" id="sobre">
          <div><div className="eyebrow">Prospecta 4.0</div><h2>Ciência que enxerga além da superfície.</h2></div>
          <div><p className="lead">O projeto desenvolve métodos avançados para identificar áreas de interesse mineral, apoiar pesquisa científica e orientar decisões com dados rastreáveis.</p><p>Cada camada publicada mantém sua fonte, data de processamento e indicadores de qualidade.</p></div>
        </section>

        <section className="section" id="minerais">
          <div className="section-heading"><div><div className="eyebrow">Foco de pesquisa</div><h2>Minerais que movem o mundo.</h2></div><p>Recursos fundamentais para agricultura, energia, indústria, semicondutores e transição energética.</p></div>
          <div className="mineral-grid">
            {["Terras-raras", "Magnesita", "Urânio", "Fosfato", "Cromo"].map((name, index) => <article key={name}><span>0{index + 1}</span><h3>{name}</h3><p>{["Tecnologia e energia limpa", "Indústria refratária", "Energia de baixo carbono", "Segurança alimentar", "Ligas de alto desempenho"][index]}</p></article>)}
          </div>
        </section>

        <section className="section tech-section">
          <div className="section-heading"><div><div className="eyebrow">Plataforma integrada</div><h2>Da imagem orbital à decisão.</h2></div></div>
          <div className="feature-grid">
            <article><Satellite /><h3>Sensoriamento remoto</h3><p>Séries temporais Landsat e Sentinel processadas continuamente.</p></article>
            <article><BrainCircuit /><h3>Inteligência artificial</h3><p>Modelos para classificação, detecção de padrões e priorização.</p></article>
            <article><Map /><h3>Geotecnologias</h3><p>PostGIS, mapas WebGL, COGs e tiles vetoriais escaláveis.</p></article>
            <article><Database /><h3>Dados rastreáveis</h3><p>Metadados, linhagem, qualidade e histórico de processamento.</p></article>
            <article><ScanSearch /><h3>Exploração interativa</h3><p>Filtros espaciais e temporais compartilháveis.</p></article>
            <article><Atom /><h3>Ciência aberta</h3><p>Resultados preparados para consulta e reutilização responsável.</p></article>
          </div>
        </section>

        <section className="section">
          <div className="section-heading"><div><div className="eyebrow">Conhecimento</div><h2>Publicações e notícias.</h2></div><Link className="text-link" href="/blog">Ver todas <ArrowRight size={16} /></Link></div>
          <div className="post-grid">{posts.map((post) => <Link className="post-card" href={`/blog/${post.slug}`} key={post.id}><small>{post.type} · {new Date(post.publishedAt).toLocaleDateString("pt-BR")}</small><h3>{post.title}</h3><p>{post.excerpt}</p><span>Ler conteúdo <ArrowRight size={15} /></span></Link>)}</div>
        </section>

        <section className="dashboard-cta"><div><div className="eyebrow">Dashboard mineral</div><h2>Explore mais de duas décadas de observação territorial.</h2><p>Compare períodos, regiões, ocorrências e indicadores de qualidade em um mapa vivo.</p><Link className="button" href="/dashboard">Abrir dashboard <ArrowRight size={17} /></Link></div><div className="radar" aria-hidden="true"><i /><i /><i /><b /></div></section>

        <section className="section contact" id="contato"><div><div className="eyebrow">Contato</div><h2>Vamos construir conhecimento juntos.</h2><p>Fale com a equipe sobre pesquisa, colaboração institucional, acesso a dados ou imprensa.</p></div><ContactForm /></section>
      </main>
      <SiteFooter />
    </>
  );
}
