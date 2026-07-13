import fs from "node:fs";
import path from "node:path";
import { LegacyHomeScripts } from "@/components/legacy-home-scripts";

function getLegacyHomepageMarkup() {
  const source = fs.readFileSync(
    path.join(process.cwd(), "prospecta", "index.html"),
    "utf8",
  );
  const body = source.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1];

  if (!body) {
    throw new Error("Não foi possível carregar o frontend original do Prospecta.");
  }

  return body
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replaceAll('href="blog.html?f=publicacao"', 'href="/blog?f=publicacao"')
    .replaceAll('href="blog.html"', 'href="/blog"')
    .replaceAll('href="dashboard.html"', 'href="/dashboard"')
    .replaceAll('src="assets/img/', 'src="/legacy/img/')
    .replaceAll("url('assets/img/", "url('/legacy/img/");
}

export default function HomePage() {
  const markup = getLegacyHomepageMarkup();

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin="anonymous"
      />
      <link rel="stylesheet" href="/legacy/css/index.css" />
      <div
        className="legacy-home"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: markup }}
      />
      <LegacyHomeScripts />
    </>
  );
}
