"use client";
import { useState } from "react";
import { fuzz, inSpain, type PlaceHit } from "@/lib/places";
import { PlaceSearch } from "./PlaceSearch";

interface Props {
  defaultCity?: string;
  defaultCityName?: string;
  defaultLat?: number | null;
  defaultLng?: number | null;
  /** El anuncio guardó la ubicación del móvil (no el centro del pueblo). */
  defaultCustom?: boolean;
}

/** Dónde está el objeto: cualquier pueblo o ciudad de España, o la ubicación del móvil (redondeada a ~1 km, nunca la exacta). */
export function LocationField({ defaultCity, defaultCityName, defaultLat, defaultLng, defaultCustom }: Props) {
  const [city, setCity] = useState(defaultCity ?? "");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [picked, setPicked] = useState<PlaceHit | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const custom = !!defaultCustom && city === defaultCity && !coords;

  const locate = () => {
    if (!navigator.geolocation) return setStatus("Tu navegador no permite compartir la ubicación.");
    setStatus("Buscando tu ubicación…");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = fuzz(pos.coords.latitude);
        const lng = fuzz(pos.coords.longitude);
        if (!inSpain(lat, lng)) return setStatus("Parece que no estás en España. Escribe tu pueblo o ciudad.");
        try {
          const { place } = (await fetch(`/api/v1/lugares?lat=${lat}&lng=${lng}`).then((r) => r.json())) as { place: PlaceHit | null };
          if (!place) throw new Error();
          setPicked(place);
          setCoords({ lat, lng });
          setStatus(null);
        } catch {
          setStatus("No hemos podido saber dónde estás. Escribe tu pueblo o ciudad.");
        }
      },
      () => setStatus("No hemos podido saber dónde estás. Escribe tu pueblo o ciudad."),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <PlaceSearch
          name="city"
          bare
          required
          defaultValue={defaultCity}
          defaultLabel={defaultCityName}
          picked={picked}
          className="flex-1"
          onPick={(h) => {
            setCity(h ? h.value.slice(2) : "");
            // Si cambia el pueblo a mano, se usa el centro del pueblo y no la ubicación del móvil.
            if (h?.value !== picked?.value) setCoords(null);
          }}
        />
        <button type="button" onClick={locate} className="btn-ghost whitespace-nowrap">
          📍 Usar mi ubicación
        </button>
      </div>
      {coords && (
        <>
          <input type="hidden" name="lat" value={coords.lat} />
          <input type="hidden" name="lng" value={coords.lng} />
        </>
      )}
      {custom && defaultLat != null && defaultLng != null && (
        <>
          <input type="hidden" name="lat" value={defaultLat} />
          <input type="hidden" name="lng" value={defaultLng} />
        </>
      )}
      <p className="text-xs text-ink-3">
        {status ??
          (coords || custom
            ? "Usaremos tu zona aproximada (a unos 1 km) para calcular distancias. Nunca mostramos tu dirección."
            : "Escribe el nombre de tu pueblo o ciudad y elígelo de la lista. Nunca mostramos tu dirección.")}
      </p>
    </div>
  );
}
