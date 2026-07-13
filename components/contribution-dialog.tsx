"use client";

import { upload } from "@vercel/blob/client";
import { Check, ChevronLeft, ChevronRight, CloudUpload, Database, FileCode2, FileUp, Globe2, LoaderCircle, Search, ShieldCheck, X } from "lucide-react";
import Script from "next/script";
import { FormEvent, useEffect, useState } from "react";

type DatasetType = "inline" | "cog" | "remote_cog" | "earth_engine";
type SubmissionResult = { id: string; protocol: string; status: string; setupMode?: boolean };

const initialForm = {
  title: "", contributorName: "", contributorEmail: "", organization: "", datasetType: "inline" as DatasetType,
  periodLabel: "", satellite: "Landsat 8/9", methodology: "", license: "CC-BY-4.0", reviewUrl: "", externalUrl: "",
  inlineData: "", website: "", termsAccepted: false,
};

export function ContributionDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [trackingProtocol, setTrackingProtocol] = useState("");
  const [tracking, setTracking] = useState<Record<string, unknown> | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !siteKey) return;
    window.onContributionTurnstile = (token: string) => setTurnstileToken(token);
    return () => { delete window.onContributionTurnstile; };
  }, [open, siteKey]);

  if (!open) return null;

  function update(name: string, value: string | boolean) { setForm((current) => ({ ...current, [name]: value })); setError(""); }
  function next() {
    if (step === 1 && !form.datasetType) return;
    if (step === 2 && (!form.title.trim() || !form.contributorName.trim() || !form.contributorEmail.includes("@") || form.methodology.trim().length < 20)) { setError("Preencha título, autoria, e-mail e uma metodologia com pelo menos 20 caracteres."); return; }
    setStep((current) => Math.min(3, current + 1)); setError("");
  }

  async function submitContribution(event: FormEvent) {
    event.preventDefault();
    if (!form.termsAccepted) { setError("Você precisa aceitar os termos de contribuição."); return; }
    if (siteKey && !turnstileToken) { setError("Conclua a verificação de segurança."); return; }
    if (form.datasetType === "inline" && !form.inlineData.trim()) { setError("Cole um CSV ou GeoJSON válido."); return; }
    if (form.datasetType === "cog" && !file) { setError("Selecione um arquivo .tif ou .tiff."); return; }
    if (form.datasetType === "remote_cog" && !form.externalUrl) { setError("Informe o endereço HTTPS do COG."); return; }
    if (form.datasetType === "earth_engine" && !form.reviewUrl) { setError("Informe o link compartilhado do Earth Engine."); return; }

    setSubmitting(true); setError(""); setProgress(0);
    try {
      const response = await fetch("/api/contributions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, fileName: file?.name ?? "", fileSize: file?.size, contentType: file?.type ?? "", turnstileToken }) });
      const created = await response.json() as SubmissionResult & { error?: string };
      if (!response.ok) throw new Error(created.error || "Não foi possível registrar a contribuição.");

      if (form.datasetType === "cog" && file && !created.setupMode) {
        const filename = safeName(file.name);
        await upload(`community/${created.id}/${filename}`, file, {
          access: "public", handleUploadUrl: "/api/contributions/upload", multipart: file.size > 100 * 1024 * 1024,
          clientPayload: JSON.stringify({ submissionId: created.id, protocol: created.protocol, filename }),
          onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
        });
        created.status = "validating";
      }
      setResult(created); setStep(4); localStorage.setItem("prospecta:last-contribution", created.protocol); onCreated();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Falha no envio."); }
    finally { setSubmitting(false); }
  }

  async function trackProtocol() {
    setError(""); setTracking(null);
    const response = await fetch(`/api/contributions/${encodeURIComponent(trackingProtocol.trim().toUpperCase())}`, { cache: "no-store" });
    const body = await response.json() as { data?: Record<string, unknown>; error?: string };
    if (!response.ok) { setError(body.error || "Protocolo não encontrado."); return; }
    setTracking(body.data ?? null);
  }

  function resetAndClose() { setStep(1); setForm(initialForm); setFile(null); setProgress(0); setResult(null); setError(""); onClose(); }

  return <div className="contribution-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    {siteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive"/>}
    <section className="contribution-dialog" role="dialog" aria-modal="true" aria-labelledby="contribution-title">
      <header><div><small>Prospecta GeoLab</small><h2 id="contribution-title">Contribuir com dados</h2></div><button onClick={onClose} aria-label="Fechar"><X/></button></header>
      <div className="contribution-steps" aria-label="Etapas"><span className={step >= 1 ? "active" : ""}>1 <b>Formato</b></span><i/><span className={step >= 2 ? "active" : ""}>2 <b>Metadados</b></span><i/><span className={step >= 3 ? "active" : ""}>3 <b>Enviar</b></span></div>

      <div className="contribution-body">
        {step === 1 && <><div className="contribution-intro"><Globe2/><div><strong>Qualquer pessoa pode contribuir.</strong><p>Dados aprovados automaticamente aparecem como camada comunitária e continuam identificados como não verificados.</p></div></div><div className="dataset-types">
          <button className={form.datasetType === "inline" ? "active" : ""} onClick={() => update("datasetType", "inline")}><FileCode2/><strong>CSV ou GeoJSON</strong><span>Pontos e valores · até 1 MB</span><small>Publicação imediata</small></button>
          <button className={form.datasetType === "cog" ? "active" : ""} onClick={() => update("datasetType", "cog")}><CloudUpload/><strong>GeoTIFF / COG</strong><span>Upload multipart · até 500 MB</span><small>Validação automática</small></button>
          <button className={form.datasetType === "remote_cog" ? "active" : ""} onClick={() => update("datasetType", "remote_cog")}><Globe2/><strong>COG por URL</strong><span>Arquivo já hospedado</span><small>HTTPS público</small></button>
          <button className={form.datasetType === "earth_engine" ? "active" : ""} onClick={() => update("datasetType", "earth_engine")}><Database/><strong>Earth Engine</strong><span>Código e metodologia</span><small>Revisão científica</small></button>
        </div><div className="track-box"><Search/><input aria-label="Acompanhar protocolo" placeholder="PRSP-20260713-XXXXXXXX" value={trackingProtocol} onChange={(event) => setTrackingProtocol(event.target.value)}/><button onClick={trackProtocol}>Acompanhar</button></div>{tracking && <div className="tracking-result"><strong>{String(tracking.title)}</strong><span className={`status-${tracking.status}`}>{statusLabel(String(tracking.status))}</span><small>{String(tracking.protocol)}</small></div>}</>}

        {step === 2 && <div className="contribution-form-grid">
          <label className="wide">Título do conjunto<input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Ex.: Mosaico Landsat · 2020/2"/></label>
          <label>Responsável<input value={form.contributorName} onChange={(event) => update("contributorName", event.target.value)} placeholder="Nome completo"/></label>
          <label>E-mail<input type="email" value={form.contributorEmail} onChange={(event) => update("contributorEmail", event.target.value)} placeholder="contato@instituicao.br"/></label>
          <label>Instituição<input value={form.organization} onChange={(event) => update("organization", event.target.value)} placeholder="Opcional"/></label>
          <label>Período<input value={form.periodLabel} onChange={(event) => update("periodLabel", event.target.value)} placeholder="2020_2"/></label>
          <label>Satélite<select value={form.satellite} onChange={(event) => update("satellite", event.target.value)}><option>Landsat 8/9</option><option>Sentinel-2</option><option>CBERS-4A</option><option>Outro</option></select></label>
          <label>Licença<select value={form.license} onChange={(event) => update("license", event.target.value)}><option value="CC-BY-4.0">CC BY 4.0</option><option value="CC-BY-SA-4.0">CC BY-SA 4.0</option><option value="CC0-1.0">CC0</option><option value="restrita">Uso restrito</option></select></label>
          <label className="wide">Como o dado foi produzido?<textarea value={form.methodology} onChange={(event) => update("methodology", event.target.value)} placeholder="Descreva fonte, processamento, bandas, resolução, correções e limitações..."/></label>
          <label className="wide">Link para código ou documentação<input type="url" value={form.reviewUrl} onChange={(event) => update("reviewUrl", event.target.value)} placeholder="https://code.earthengine.google.com/..."/></label>
        </div>}

        {step === 3 && <form id="contribution-submit" onSubmit={submitContribution} className="contribution-upload-step">
          {form.datasetType === "inline" && <label>Dados CSV ou GeoJSON<textarea value={form.inlineData} onChange={(event) => update("inlineData", event.target.value)} placeholder={"longitude,latitude,valor,nome\n-41.930,-12.580,82,Alvo A"}/><small>Até 5.000 pontos. Coordenadas devem estar em longitude/latitude.</small></label>}
          {form.datasetType === "cog" && <label className="file-drop"><FileUp/><strong>{file ? file.name : "Selecionar GeoTIFF/COG"}</strong><span>{file ? formatBytes(file.size) : "Arquivo .tif ou .tiff · máximo 500 MB"}</span><input type="file" accept=".tif,.tiff,image/tiff,image/geotiff" onChange={(event) => setFile(event.target.files?.[0] ?? null)}/></label>}
          {form.datasetType === "remote_cog" && <label>URL pública do COG<input type="url" value={form.externalUrl} onChange={(event) => update("externalUrl", event.target.value)} placeholder="https://storage.googleapis.com/.../mosaico.tif"/><small>O servidor precisa aceitar leitura pública e requisições por intervalo.</small></label>}
          {form.datasetType === "earth_engine" && <label>Link compartilhado do Earth Engine<input type="url" value={form.reviewUrl} onChange={(event) => update("reviewUrl", event.target.value)} placeholder="https://code.earthengine.google.com/..."/><small>Esse envio registra código e metodologia; ele não substitui o arquivo do mosaico.</small></label>}
          <div className="submission-summary"><ShieldCheck/><div><strong>Publicação responsável</strong><p>Seu nome, instituição, metodologia e licença poderão ficar públicos. Seu e-mail será usado apenas para contato e não aparecerá no mapa.</p></div></div>
          <label className="terms-check"><input type="checkbox" checked={form.termsAccepted} onChange={(event) => update("termsAccepted", event.target.checked)}/><span>Confirmo que posso compartilhar estes dados e aceito a identificação como contribuição comunitária não verificada.</span></label>
          <input className="contribution-honeypot" tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => update("website", event.target.value)}/>
          {siteKey && <div className="cf-turnstile" data-sitekey={siteKey} data-callback="onContributionTurnstile" data-theme="dark"/>}
          {submitting && form.datasetType === "cog" && <div className="upload-progress"><i style={{ width: `${progress}%` }}/><span>{progress}% enviado</span></div>}
        </form>}

        {step === 4 && result && <div className="submission-complete"><div><Check/></div><small>Contribuição recebida</small><h3>{form.title}</h3><p>{result.status === "community" ? "A camada comunitária já pode ser consultada no dashboard." : "O arquivo foi recebido e está passando pelas validações automáticas."}</p><code>{result.protocol}</code><span>Guarde esse protocolo para acompanhar o processamento.</span><button onClick={resetAndClose}>Voltar ao mapa</button></div>}
        {error && <div className="contribution-error" role="alert">{error}</div>}
      </div>

      {step < 4 && <footer><button className="secondary" onClick={step === 1 ? onClose : () => setStep((current) => current - 1)}>{step > 1 && <ChevronLeft/>}{step === 1 ? "Cancelar" : "Voltar"}</button>{step < 3 ? <button className="primary" onClick={next}>Continuar<ChevronRight/></button> : <button className="primary" type="submit" form="contribution-submit" disabled={submitting}>{submitting ? <LoaderCircle className="spin"/> : <CloudUpload/>}{submitting ? "Enviando" : "Enviar contribuição"}</button>}</footer>}
    </section>
  </div>;
}

function safeName(value: string) { return value.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(-180); }
function formatBytes(value: number) { return value >= 1024 * 1024 ? `${(value / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(value / 1024)} KB`; }
function statusLabel(value: string) { return ({ received: "Recebido", uploading: "Aguardando arquivo", validating: "Em validação", community: "Camada comunitária", verified: "Verificado", official: "Oficial", rejected: "Rejeitado" } as Record<string, string>)[value] ?? value; }

declare global { interface Window { onContributionTurnstile?: (token: string) => void } }
