"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, isProUser } from "@/lib/auth";
import { CITIES, FREE_LISTING_LIMIT, isCategory, isCity, isSubcategory } from "@/lib/config";
import { parseEuros } from "@/lib/format";
import { saveImage } from "@/lib/storage";
import { fuzz, inSpain } from "@/lib/places";
import { runOrBack, str, UserError } from "./util";

const MAX_PHOTOS = 8;

function readForm(fd: FormData) {
  const title = str(fd, "title");
  const description = str(fd, "description");
  const category = str(fd, "category");
  const subcategory = str(fd, "subcategory") || null;
  const citySlug = str(fd, "city");
  const price = parseEuros(str(fd, "price"));
  const deposit = str(fd, "deposit") ? parseEuros(str(fd, "deposit")) : 0;
  if (title.length < 4 || title.length > 80) throw new UserError("El título debe tener entre 4 y 80 caracteres");
  if (description.length < 20) throw new UserError("Describe el objeto con al menos 20 caracteres");
  if (!isCategory(category)) throw new UserError("Elige una categoría");
  if (subcategory && !isSubcategory(category, subcategory)) throw new UserError("Subcategoría no válida");
  if (!isCity(citySlug)) throw new UserError("Elige una ciudad");
  if (!price || price < 100 || price > 100_000) throw new UserError("El precio por día debe estar entre 1 € y 1.000 €");
  if (deposit === null || deposit > 500_000) throw new UserError("Fianza no válida");
  const c = CITIES[citySlug];
  // Ubicación aproximada del móvil (si la compartió); si no, el centro de la localidad.
  const lat = Number(str(fd, "lat"));
  const lng = Number(str(fd, "lng"));
  const own = str(fd, "lat") !== "" && Number.isFinite(lat) && Number.isFinite(lng) && inSpain(lat, lng);
  return { title, description: description.slice(0, 4000), category, subcategory, citySlug, city: c.name, lat: own ? fuzz(lat) : c.lat, lng: own ? fuzz(lng) : c.lng, pricePerDayCents: price, depositCents: deposit, verifiedOnly: fd.get("verifiedOnly") === "on" };
}

const photosOf = (fd: FormData) => fd.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

export async function createListing(fd: FormData) {
  const user = await requireUser("/publicar");
  const id = await runOrBack("/publicar", async () => {
    const data = readForm(fd);
    const photos = photosOf(fd);
    if (photos.length === 0) throw new UserError("Añade al menos una foto");
    if (photos.length > MAX_PHOTOS) throw new UserError(`Máximo ${MAX_PHOTOS} fotos`);
    if (!isProUser(user)) {
      const active = await db.listing.count({ where: { ownerId: user.id, status: "active" } });
      if (active >= FREE_LISTING_LIMIT) throw new UserError(`Con la cuenta gratuita puedes tener ${FREE_LISTING_LIMIT} anuncios activos. Pasa a Pro para tener ilimitados.`);
    }
    const urls = [];
    for (const f of photos) urls.push(await saveImage(f, "listings"));
    const l = await db.listing.create({ data: { ...data, ownerId: user.id, photos: { create: urls.map((url, position) => ({ url, position })) } } });
    return l.id;
  });
  revalidatePath("/");
  redirect(`/anuncio/${id}?publicado=1`);
}

export async function updateListing(id: string, fd: FormData) {
  const user = await requireUser(`/anuncio/${id}/editar`);
  await runOrBack(`/anuncio/${id}/editar`, async () => {
    const l = await db.listing.findUnique({ where: { id }, include: { photos: true } });
    if (!l || l.ownerId !== user.id || l.status === "deleted") throw new UserError("Anuncio no encontrado");
    const data = readForm(fd);
    const photos = photosOf(fd);
    if (l.photos.length + photos.length > MAX_PHOTOS) throw new UserError(`Máximo ${MAX_PHOTOS} fotos`);
    const urls = [];
    for (const f of photos) urls.push(await saveImage(f, "listings"));
    await db.listing.update({
      where: { id },
      data: { ...data, photos: { create: urls.map((url, i) => ({ url, position: l.photos.length + i })) } },
    });
  });
  revalidatePath(`/anuncio/${id}`);
  redirect(`/anuncio/${id}`);
}

export async function setListingStatus(id: string, status: "active" | "paused" | "deleted") {
  const user = await requireUser("/mis-anuncios");
  await runOrBack("/mis-anuncios", async () => {
    const l = await db.listing.findUnique({ where: { id } });
    if (!l || l.ownerId !== user.id) throw new UserError("Anuncio no encontrado");
    if (status === "deleted") {
      const open = await db.booking.count({ where: { listingId: id, status: { in: ["requested", "accepted", "in_progress", "incident"] } } });
      if (open) throw new UserError("Tiene reservas abiertas: termínalas o cancélalas antes de borrarlo");
    }
    await db.listing.update({ where: { id }, data: { status } });
  });
  revalidatePath("/mis-anuncios");
  redirect("/mis-anuncios");
}
