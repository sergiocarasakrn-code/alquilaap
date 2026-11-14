"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { PlaceHit } from "@/lib/places";

interface Props {
  /** Nombre del campo oculto que se envía con el formulario. */
  name: string;
  /** Valor inicial, p. ej. «l:chilches-xilxes» (o solo el slug si `bare`). */
  defaultValue?: string;
  defaultLabel?: string;
  /** Incluye comunidades y provincias en las sugerencias (buscador de anuncios). */
  withZones?: boolean;
  /** Envía solo el slug de la localidad («chilches-xilxes») en vez de «l:chilches-xilxes». */
  bare?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  /** Lugar elegido desde fuera (p. ej. «Usar mi ubicación»). */
  picked?: PlaceHit | null;
  onPick?: (hit: PlaceHit | null) => void;
}

/** Campo con sugerencias para elegir cualquier pueblo o ciudad de España (y, si se pide, comunidad o provincia). */
export function PlaceSearch({ name, defaultValue = "", defaultLabel = "", withZones, bare, required, placeholder = "Escribe tu pueblo o ciudad", className = "", picked, onPick }: Props) {
  const [text, setText] = useState(defaultLabel);
  const [value, setValue] = useState(defaultValue);
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const typed = useRef(false);
  const hitsFor = useRef(""); // texto al que corresponden las sugerencias
  const valueRef = useRef(value);
  valueRef.current = value;

  const select = (h: PlaceHit) => {
    setText(h.name);
    setValue(bare ? h.value.slice(2) : h.value);
    setOpen(false);
    typed.current = false;
    onPick?.(h);
  };

  useEffect(() => {
    if (picked) select(picked);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked]);

  // Sugerencias mientras escribe (con una pequeña pausa para no pedir en cada tecla).
  useEffect(() => {
    if (!typed.current) return;
    if (text.trim().length < 2) {
      setHits([]);
      return;
    }
    const ctrl = new AbortController();
    setSearching(true);
    const t = setTimeout(() => {
      fetch(`/api/v1/lugares?q=${encodeURIComponent(text)}${withZones ? "&zonas=1" : ""}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d: { hits: PlaceHit[] }) => {
          hitsFor.current = text;
          setHits(d.hits);
          setActive(0);
          setOpen(true);
          setSearching(false);
        })
        .catch(() => {});
    }, 150);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [text, withZones]);

  // Si es obligatorio, no deja enviar el formulario hasta elegir un lugar de la lista.
  useEffect(() => {
    inputRef.current?.setCustomValidity(required && !value ? "Elige tu pueblo o ciudad de la lista" : "");
  }, [required, value]);

  return (
    <div className={`relative ${className}`}>
      <input type="hidden" name={name} value={value} />
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open && hits.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        required={required}
        value={text}
        placeholder={placeholder}
        className="input w-full"
        onChange={(e) => {
          typed.current = true;
          setText(e.target.value);
          setValue("");
          onPick?.(null);
        }}
        onFocus={() => hits.length && setOpen(true)}
        onBlur={() =>
          setTimeout(() => {
            setOpen(false);
            // Escribió el nombre pero no lo eligió de la lista: nos quedamos con la primera sugerencia.
            if (!valueRef.current && hitsFor.current === text && text.trim().length >= 2 && hits.length) select(hits[0]);
          }, 150)
        }
        onKeyDown={(e) => {
          if (e.key === "Enter" && !value && hitsFor.current === text && hits.length) {
            e.preventDefault();
            return select(hits[open ? active : 0]);
          }
          if (!open || !hits.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, hits.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            select(hits[active]);
          } else if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && text.trim().length >= 2 && (
        <ul id={listId} role="listbox" className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-line bg-surface py-1 shadow-lg">
          {hits.length === 0 && !searching && <li className="px-3 py-2 text-sm text-ink-3">No encontramos ese lugar. Prueba con otro nombre.</li>}
          {hits.map((h, i) => (
            <li
              key={h.value}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                select(h);
              }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-3 py-2 ${i === active ? "bg-surface-2" : ""}`}
            >
              <span className="font-semibold">{h.name}</span>
              <span className="ml-2 text-sm text-ink-3">{h.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
