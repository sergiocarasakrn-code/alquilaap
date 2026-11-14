"use client";
import { useState } from "react";

/** Botones para compartir el enlace de invitación: WhatsApp, compartir del móvil y copiar. */
export function InviteShare({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const full = `${text} ${url}`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copia tu enlace:", url);
    }
  }
  async function share() {
    if (navigator.share) await navigator.share({ title: "Alquilaap", text, url }).catch(() => {});
    else await copy();
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input readOnly value={url} className="input flex-1 font-mono text-sm" onFocus={(e) => e.currentTarget.select()} aria-label="Tu enlace de invitación" />
        <button type="button" onClick={copy} className="btn-ghost shrink-0">
          {copied ? "¡Copiado!" : "Copiar"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={`https://wa.me/?text=${encodeURIComponent(full)}`} target="_blank" rel="noreferrer" className="btn bg-[#25D366] text-white">
          Enviar por WhatsApp
        </a>
        <button type="button" onClick={share} className="btn-ghost">
          Compartir…
        </button>
      </div>
    </div>
  );
}
