"use client";
import { useEffect, useRef, useState } from "react";

export const MAX_PHOTOS = 8;

interface Existing {
  id: string;
  url: string;
}

const isHeic = (f: File) => /hei[cf]/i.test(f.type) || /\.hei[cf]$/i.test(f.name);
const key = (f: File) => `${f.name}-${f.size}-${f.lastModified}`;

/**
 * Fotos del anuncio: se pueden añadir de una en una o varias a la vez (en el móvil, cada vez que se abre la galería
 * se suman a las anteriores), ver la vista previa y quitar las que sobren. Al editar, también se pueden quitar las ya subidas.
 */
export function PhotoPicker({ required, existing = [] }: { required: boolean; existing?: Existing[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const kept = existing.filter((p) => !removed.includes(p.id));
  const total = kept.length + files.length;

  // El campo de fichero del formulario siempre lleva todas las fotos elegidas.
  useEffect(() => {
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    if (inputRef.current) inputRef.current.files = dt.files;
    const urls = files.map((f) => (isHeic(f) ? "" : URL.createObjectURL(f)));
    setPreviews(urls);
    return () => urls.forEach((u) => u && URL.revokeObjectURL(u));
  }, [files]);

  useEffect(() => {
    inputRef.current?.setCustomValidity(required && total === 0 ? "Añade al menos una foto" : existing.length > 0 && total === 0 ? "El anuncio necesita al menos una foto" : "");
  }, [required, total, existing.length]);

  const add = (list: FileList | null) => {
    const picked = Array.from(list ?? []);
    setFiles((prev) => {
      const seen = new Set(prev.map(key));
      const next = [...prev, ...picked.filter((f) => !seen.has(key(f)))];
      const room = MAX_PHOTOS - kept.length;
      setNote(next.length > room ? `Como máximo ${MAX_PHOTOS} fotos por anuncio: hemos dejado las ${room} primeras.` : null);
      return next.slice(0, Math.max(room, 0));
    });
  };

  return (
    <div className="space-y-2">
      {removed.map((id) => (
        <input key={id} type="hidden" name="removePhoto" value={id} />
      ))}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {kept.map((p, i) => (
          <Thumb key={p.id} src={p.url} cover={i === 0} onRemove={() => setRemoved((r) => [...r, p.id])} />
        ))}
        {files.map((f, i) => (
          <Thumb key={key(f)} src={previews[i]} label={isHeic(f) ? "HEIC" : undefined} cover={kept.length === 0 && i === 0} onRemove={() => setFiles((fs) => fs.filter((x) => x !== f))} />
        ))}
        {total < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line text-center text-sm font-semibold text-brand hover:bg-surface-2"
          >
            <span className="text-3xl leading-none">＋</span>
            {total === 0 ? "Añadir fotos" : "Añadir más"}
          </button>
        )}
      </div>
      {/* Siempre en el formulario; oculto a la vista pero no al navegador (para avisar si falta la foto). */}
      <input
        ref={inputRef}
        name="photos"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => add(e.target.files)}
      />
      <p className="text-xs text-ink-3">
        {note ?? `${total} de ${MAX_PHOTOS} fotos. La primera es la portada del anuncio. Puedes añadirlas de una en una o varias a la vez.`}
      </p>
    </div>
  );
}

function Thumb({ src, label, cover, onRemove }: { src?: string; label?: string; cover?: boolean; onRemove: () => void }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-xl bg-surface-2">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full items-center justify-center text-sm font-semibold text-ink-3">📷 {label ?? "Foto"}</span>
      )}
      {cover && <span className="absolute left-1 top-1 rounded-md bg-brand px-1.5 py-0.5 text-xs font-semibold text-white">Portada</span>}
      <button type="button" onClick={onRemove} aria-label="Quitar foto" className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white">
        ✕
      </button>
    </div>
  );
}
