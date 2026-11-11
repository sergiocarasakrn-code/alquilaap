"use client";
import { useState } from "react";
import { fuzz, groupedPlaces, inSpain, nearestPlace, PLACES } from "@/lib/places";

const GROUPS = groupedPlaces();

/** Dónde está el objeto: localidad de la lista o la ubicación del móvil (redondeada a ~1 km, nunca la exacta). */
export function LocationField({ defaultCity, defaultLat, defaultLng }: { defaultCity?: string; defaultLat?: number | null; defaultLng?: number | null }) {
  const [city, setCity] = useState(defaultCity ?? "");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const custom = defaultCity && defaultLat != null && PLACES[defaultCity] && (PLACES[defaultCity].lat !== defaultLat || PLACES[defaultCity].lng !== defaultLng);

  const locate = () => {
    if (!navigator.geolocation) return setStatus("Tu navegador no permite compartir la ubicación.");
    setStatus("Buscando tu ubicación…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = fuzz(pos.coords.latitude);
        const lng = fuzz(pos.coords.longitude);
        if (!inSpain(lat, lng)) return setStatus("Parece que no estás en España. Elige la localidad en la lista.");
        setCoords({ lat, lng });
        setCity(nearestPlace(lat, lng));
        setStatus(null);
      },
      () => setStatus("No hemos podido saber dónde estás. Elige la localidad en la lista."),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          name="city"
          required
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setCoords(null);
          }}
          className="input"
        >
          <option value="" disabled>
            Elige la localidad más cercana…
          </option>
          {GROUPS.map((g) => (
            <optgroup key={g.slug} label={g.name}>
              {g.places.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
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
      {custom && !coords && city === defaultCity && (
        <>
          <input type="hidden" name="lat" value={defaultLat!} />
          <input type="hidden" name="lng" value={defaultLng!} />
        </>
      )}
      <p className="text-xs text-ink-3">
        {status ??
          (coords || custom
            ? "Usaremos tu zona aproximada (a unos 1 km) para calcular distancias. Nunca mostramos tu dirección."
            : "Si usas tu ubicación, la distancia que ven los demás será más precisa. Nunca mostramos tu dirección.")}
      </p>
    </div>
  );
}
