import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div><span className="brand"><span>PROSPECTA</span><b>4.0</b></span><p>Ciência pública brasileira construindo inteligência territorial.</p></div>
      <div><strong>Explorar</strong><Link href="/dashboard">Dashboard mineral</Link><Link href="/blog">Publicações e notícias</Link><Link href="/admin">Área administrativa</Link></div>
      <div><strong>Instituição</strong><span>Universidade Estadual de Feira de Santana</span><span>Bahia · Brasil</span></div>
    </footer>
  );
}
