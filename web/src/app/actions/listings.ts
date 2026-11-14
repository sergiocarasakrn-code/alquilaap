"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, isProUser } from "@/lib/auth";
import { FREE_LISTING_LIMIT, PAID_FEATURES, isCategory, isSubcategory } from "@/lib/config";
import { PLACES, isPlace } from "@/lib/localidades";
import { parseEuros } from "@/lib/format";
import { deleteStored, saveImage } from "@/lib/storage";
import { fuzz, inSpain } from "@/lib/places";
import { grantPendingRewards, onListingPublished } from "@/lib/referrals";
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
  if (!isPlace(citySlug)) throw new UserError("Elige una ciudad");
  if (!price || price < 100 || price > 100_000) throw new UserError("El precio por día debe estar entre 1 € y 1.000 €");
  if (deposit === null || deposit > 500_000) throw new UserError("Fianza no válida");
  const c = PLACES[citySlug];
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
    if (PAID_FEATURES && !isProUser(user)) {
      const active = await db.listing.count({ where: { ownerId: user.id, status: "active" } });
      if (active >= FREE_LISTING_LIMIT) throw new UserError(`Con la cuenta gratuita puedes tener ${FREE_LISTING_LIMIT} anuncios activos. Pasa a Pro para tener ilimitados.`);
    }
    // Mismo anuncio enviado otra vez (doble clic, conexión lenta, «reenviar formulario»): no se duplica.
    const twin = await db.listing.findFirst({
      where: { ownerId: user.id, title: data.title, description: data.description, status: { not: "deleted" }, createdAt: { gte: new Date(Date.now() - 30 * 60_000) } },
      select: { id: true },
    });
    if (twin) return twin.id;
    const urls = [];
    for (const f of photos) urls.push(await saveImage(f, "listings"));
    const l = await db.listing.create({ data: { ...data, ownerId: user.id, photos: { create: urls.map((url, position) => ({ url, position })) } } });
    // Invitaciones: premia automáticamente a quien le invitó (y a él mismo si tenía destacados esperando).
    await onListingPublished(user.id, l.id).catch((e) => console.error("Error al dar el destacado por invitación", e));
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
    const removeIds = new Set(fd.getAll("removePhoto").map(String));
    const kept = l.photos.sort((a, b) => a.position - b.position).filter((p) => !removeIds.has(p.id));
    const removed = l.photos.filter((p) => removeIds.has(p.id));
    if (kept.length + photos.length === 0) throw new UserError("El anuncio necesita al menos una foto");
    if (kept.length + photos.length > MAX_PHOTOS) throw new UserError(`Máximo ${MAX_PHOTOS} fotos`);
    const urls = [];
    for (const f of photos) urls.push(await saveImage(f, "listings"));
    await db.$transaction([
      db.listingPhoto.deleteMany({ where: { listingId: id, id: { in: removed.map((p) => p.id) } } }),
      // Las que quedan, en orden y sin huecos; las nuevas, detrás.
      ...kept.map((p, position) => db.listingPhoto.update({ where: { id: p.id }, data: { position } })),
      db.listing.update({
        where: { id },
        data: { ...data, photos: { create: urls.map((url, i) => ({ url, position: kept.length + i })) } },
      }),
    ]);
    for (const p of removed) await deleteStored(p.url).catch((e) => console.error("[fotos] No se pudo borrar", e));
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
    if (status === "active") await grantPendingRewards(user.id).catch((e) => console.error("Error al dar el destacado por invitación", e));
  });
  revalidatePath("/mis-anuncios");
  redirect("/mis-anuncios");
}
