import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Prospecta 4.0 — início">
        <span>PROSPECTA</span><b>4.0</b>
      </Link>
      <nav aria-label="Navegação principal">
        <Link href="/#sobre">Sobre</Link>
        <Link href="/#minerais">Minerais</Link>
        <Link href="/blog">Publicações</Link>
        <Link href="/dashboard">Dashboard</Link>
      </nav>
      <Link className="button button-small" href="/#contato">Fale conosco</Link>
    </header>
  );
}
