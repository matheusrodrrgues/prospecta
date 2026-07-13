"use client";

import { useEffect } from "react";

const LEAFLET_SCRIPT = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

function loadScript(src: string, id: string) {
  return new Promise<HTMLScriptElement>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;

    if (existing) {
      if (existing.dataset.loaded === "true") resolve(existing);
      else existing.addEventListener("load", () => resolve(existing), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = false;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve(script);
    });
    script.addEventListener("error", () => reject(new Error(`Falha ao carregar ${src}`)));
    document.body.appendChild(script);
  });
}

export function LegacyHomeScripts() {
  useEffect(() => {
    let active = true;

    async function initialize() {
      const leaflet = await loadScript(LEAFLET_SCRIPT, "prospecta-leaflet");
      if (!active || !leaflet) return;
      await loadScript("/legacy/js/index.js", "prospecta-home-script");
    }

    initialize().catch((error) => console.error(error));

    return () => {
      active = false;
      document.getElementById("prospecta-home-script")?.remove();
    };
  }, []);

  return null;
}
