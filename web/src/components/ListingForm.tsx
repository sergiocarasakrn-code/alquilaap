import { LocationField } from "./LocationField";
import { PhotoPicker } from "./PhotoPicker";
import { SubmitButton } from "./SubmitButton";
import { PLACES } from "@/lib/localidades";
import { CategoryPicker } from "./CategoryPicker";

interface Defaults {
  title?: string;
  description?: string;
  category?: string;
  subcategory?: string | null;
  citySlug?: string;
  city?: string;
  lat?: number | null;
  lng?: number | null;
  pricePerDayCents?: number;
  depositCents?: number;
  verifiedOnly?: boolean;
  photos?: { id: string; url: string }[];
}

const euros = (c?: number) => (c === undefined ? "" : (c / 100).toFixed(2).replace(".", ",").replace(",00", ""));

export function ListingForm({ action, d = {}, submit, photosRequired }: { action: (fd: FormData) => void; d?: Defaults; submit: string; photosRequired: boolean }) {
  return (
    <form action={action} className="card grid gap-4 p-5 sm:grid-cols-2">
      <label className="sm:col-span-2">
        <span className="label">Título</span>
        <input name="title" required minLength={4} maxLength={80} defaultValue={d.title} className="input" placeholder="Ej.: Bici eléctrica de paseo talla M" />
      </label>
      <div className="sm:col-span-2">
        <span className="label">Categoría</span>
        <CategoryPicker mode="form" defaultCategory={d.category} defaultSubcategory={d.subcategory} />
      </div>
      <div className="sm:col-span-2">
        <span className="label">¿Dónde está?</span>
        <LocationField
          defaultCity={d.citySlug}
          defaultCityName={d.city ?? (d.citySlug ? PLACES[d.citySlug]?.name : undefined)}
          defaultLat={d.lat}
          defaultLng={d.lng}
          defaultCustom={!!d.citySlug && d.lat != null && !!PLACES[d.citySlug] && (PLACES[d.citySlug].lat !== d.lat || PLACES[d.citySlug].lng !== d.lng)}
        />
      </div>
      <label>
        <span className="label">Precio por día (€)</span>
        <input name="price" required inputMode="decimal" defaultValue={euros(d.pricePerDayCents)} className="input" placeholder="15" />
      </label>
      <label>
        <span className="label">Fianza (€, opcional)</span>
        <input name="deposit" inputMode="decimal" defaultValue={euros(d.depositCents)} className="input" placeholder="100" />
      </label>
      <label className="sm:col-span-2">
        <span className="label">Descripción</span>
        <textarea name="description" required minLength={20} rows={5} defaultValue={d.description} className="input" placeholder="Estado, qué incluye, horario de recogida…" />
      </label>
      <div className="sm:col-span-2">
        <span className="label">Fotos {photosRequired ? "(al menos una)" : ""}</span>
        <PhotoPicker required={photosRequired} existing={d.photos?.map((p) => ({ id: p.id, url: p.url }))} />
      </div>
      <label className="flex items-start gap-2 rounded-xl bg-surface-2 p-3 text-sm sm:col-span-2">
        <input type="checkbox" name="verifiedOnly" defaultChecked={d.verifiedOnly} className="mt-0.5" />
        <span>
          <span className="font-semibold">Solo aceptar reservas de usuarios verificados</span>
          <span className="block text-ink-3">Más seguridad: solo podrán reservar quienes hayan verificado su identidad con DNI o NIE. Cualquiera podrá seguir escribiéndote.</span>
        </span>
      </label>
      <div className="sm:col-span-2">
        <SubmitButton pending="Subiendo fotos, no cierres la página…">{submit}</SubmitButton>
        <p className="mt-2 text-xs text-ink-3">Publicar es gratis.</p>
      </div>
    </form>
  );
}
