import { LocationField } from "./LocationField";
import { CategoryPicker } from "./CategoryPicker";

interface Defaults {
  title?: string;
  description?: string;
  category?: string;
  subcategory?: string | null;
  citySlug?: string;
  lat?: number | null;
  lng?: number | null;
  pricePerDayCents?: number;
  depositCents?: number;
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
        <LocationField defaultCity={d.citySlug} defaultLat={d.lat} defaultLng={d.lng} />
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
      <label className="sm:col-span-2">
        <span className="label">Fotos {photosRequired ? "(al menos una, máx. 8)" : "(añadir más)"}</span>
        <input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple required={photosRequired} className="input" />
      </label>
      <div className="sm:col-span-2">
        <button className="btn-primary w-full sm:w-auto">{submit}</button>
        <p className="mt-2 text-xs text-ink-3">Publicar es gratis. Puedes destacarlo después para que lo vean más personas.</p>
      </div>
    </form>
  );
}
