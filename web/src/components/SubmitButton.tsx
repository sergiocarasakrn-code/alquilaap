"use client";
import { useFormStatus } from "react-dom";

/** Botón de envío que se bloquea mientras se envía (evita publicar el mismo anuncio varias veces). */
export function SubmitButton({ children, pending: pendingText, className = "btn-primary w-full sm:w-auto" }: { children: React.ReactNode; pending: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={`${className} disabled:cursor-wait disabled:opacity-70`} disabled={pending} aria-busy={pending}>
      {pending ? `⏳ ${pendingText}` : children}
    </button>
  );
}
