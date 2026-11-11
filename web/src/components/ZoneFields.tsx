"use client";
import { useRef, useState } from "react";
import { DISTANCES, groupedPlaces } from "@/lib/places";

const GROUPS = groupedPlaces();

interface Props {
  zone?: string;
  km?: number;
  mine?: { lat: number; lng: number };
  /** Muestra el selector de distancia (en la portada solo se elige la zona). */
  withDistance?: boolean;
}

/**
 * Campos de ubicación para un formulario GET de búsqueda: zona (comunidad, provincia o localidad),
 * distancia y «Cerca de mí» (usa la ubicación del navegador, redondeada a ~1 km).
 */
export function ZoneFields({ zone = "", km, mine, withDistance = true }: Props) {
  const latRef = useRef<HTMLInputElement>(null);
  const lngRef = useRef<HTMLInputElement>(null);
  const [usingMine, setUsingMine] = useState(!!mine);
  const [status, setStatus] = useState<string | null>(null);

  const locate = (e: React.MouseEvent<HTMLButtonElement>) => {
    const form = e.currentTarget.form;
    if (!navigator.geolocation) return setStatus("Tu navegador no permite compartir la ubicación.");
    setStatus("Buscando tu ubicación…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        latRef.current!.value = pos.coords.latitude.toFixed(2);
        lngRef.current!.value = pos.coords.longitude.toFixed(2);
        setUsingMine(true);
        setStatus(null);
        form?.requestSubmit();
      },
      () => setStatus("No hemos podido saber dónde estás. Elige tu ciudad en la lista."),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  };

  const clearMine = () => {
    latRef.current!.value = "";
    lngRef.current!.value = "";
    setUsingMine(false);
  };

  return (
    <>
      <input ref={latRef} type="hidden" name="lat" defaultValue={mine?.lat ?? ""} />
      <input ref={lngRef} type="hidden" name="lng" defaultValue={mine?.lng ?? ""} />
      {usingMine ? (
        <span className="input flex items-center justify-between gap-2 sm:w-56">
          <span>📍 Cerca de ti</span>
          <button type="button" onClick={clearMine} className="text-sm font-semibold text-brand">
            Quitar
          </button>
        </span>
      ) : (
        <select name="zona" defaultValue={zone} className="input sm:w-56" aria-label="Zona">
          <option value="">Toda España</option>
          {GROUPS.map((g) => (
            <optgroup key={g.slug} label={g.name}>
              <option value={`c:${g.slug}`}>{g.name}: todas las zonas</option>
              {g.provinces.length > 1 &&
                g.provinces.map((p) => (
                  <option key={p.slug} value={`p:${p.slug}`}>
                    Provincia de {p.name}
                  </option>
                ))}
              {g.places.map((p) => (
                <option key={p.slug} value={`l:${p.slug}`}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      )}
      {withDistance && (
        <select name="km" defaultValue={km ? String(km) : ""} className="input sm:w-36" aria-label="Distancia">
          <option value="">Cualquier distancia</option>
          {DISTANCES.map((d) => (
            <option key={d} value={d}>
              Hasta {d} km
            </option>
          ))}
        </select>
      )}
      {!usingMine && (
        <button type="button" onClick={locate} className="btn-ghost whitespace-nowrap">
          📍 Cerca de mí
        </button>
      )}
      {status && <p className="w-full text-sm text-ink-2 sm:order-last">{status}</p>}
    </>
  );
}
