"use client";

import { useState } from "react";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const form = event.currentTarget;
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    });
    if (response.ok) { form.reset(); setStatus("sent"); } else setStatus("error");
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <label>Nome<input name="name" required minLength={2} maxLength={100} /></label>
      <label>E-mail<input name="email" type="email" required maxLength={200} /></label>
      <label className="full">Assunto<input name="subject" required minLength={3} maxLength={160} /></label>
      <label className="full">Mensagem<textarea name="message" rows={5} required minLength={10} maxLength={5000} /></label>
      <div className="full form-actions"><button className="button" disabled={status === "sending"}>{status === "sending" ? "Enviando…" : "Enviar mensagem"}</button><span role="status">{status === "sent" ? "Mensagem recebida. Obrigado!" : status === "error" ? "Não foi possível enviar. Tente novamente." : ""}</span></div>
    </form>
  );
}
