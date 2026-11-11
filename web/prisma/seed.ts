// Datos de ejemplo para desarrollo: npm run db:seed (se puede ejecutar varias veces).
import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { hashPassword } from "../src/lib/password";
import { CITIES, categoryName } from "../src/lib/config";

const db = new PrismaClient();
const PASSWORD = "alquilaap123";

const USERS = [
  { email: "laura@demo.alquilaap.es", name: "Laura Gómez", pro: false },
  { email: "bicis@demo.alquilaap.es", name: "BiciRent Valencia", pro: true },
  { email: "marc@demo.alquilaap.es", name: "Marc Puig", pro: false },
];

const LISTINGS = [
  { owner: 1, title: "Bici eléctrica de paseo, talla M", category: "bicis", city: "valencia", price: 2500, deposit: 15000, color: "#0f6b5c", pack: "premium" },
  { owner: 1, title: "Bici de carretera de carbono 56", category: "bicis", city: "valencia", price: 3500, deposit: 30000, color: "#2f6fb0" },
  { owner: 0, title: "Taladro percutor Bosch con maletín", category: "herramientas", city: "barcelona", price: 800, deposit: 5000, color: "#b2582b", pack: "pro" },
  { owner: 0, title: "Tienda de campaña 4 personas", category: "camping", city: "barcelona", price: 1200, deposit: 6000, color: "#4f7a2a" },
  { owner: 2, title: "Cámara Sony A7 III con objetivo 28-70", category: "foto", city: "girona", price: 4000, deposit: 40000, color: "#2b2f3a" },
  { owner: 2, title: "Altavoz para fiestas con micrófono", category: "fiestas", city: "barcelona", price: 3000, deposit: 10000, color: "#b23a6a" },
  { owner: 0, title: "Patinete eléctrico Xiaomi", category: "movilidad", city: "barcelona", price: 1500, deposit: 8000, color: "#1f7f9a" },
  { owner: 2, title: "Kayak hinchable doble con remos", category: "deportes", city: "girona", price: 2000, deposit: 10000, color: "#7a4bb0" },
];

function placeholder(i: number, title: string, color: string) {
  const dir = path.join(process.cwd(), "public", "seed");
  mkdirSync(dir, { recursive: true });
  const safe = title.replace(/[<&>]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="${color}"/><circle cx="640" cy="140" r="90" fill="#ffffff22"/><text x="48" y="520" font-family="Arial,sans-serif" font-size="40" font-weight="700" fill="#fff">${safe}</text></svg>`;
  writeFileSync(path.join(dir, `${i}.svg`), svg);
  return `/seed/${i}.svg`;
}

async function main() {
  const pw = await hashPassword(PASSWORD);
  const now = new Date();
  const users = [];
  for (const u of USERS) {
    const user = await db.user.upsert({
      where: { email: u.email },
      update: {},
      create: { email: u.email, name: u.name, passwordHash: pw, kycStatus: "verified", kycVerifiedAt: now, legalName: u.name, phone: "+34600000000", idNumberLast4: "000Z" },
    });
    if (u.pro)
      await db.subscription.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, status: "active", currentPeriodEnd: new Date(now.getTime() + 30 * 86_400_000) },
      });
    users.push(user);
  }
  for (const [i, l] of LISTINGS.entries()) {
    const owner = users[l.owner];
    if (await db.listing.findFirst({ where: { ownerId: owner.id, title: l.title } })) continue;
    const c = CITIES[l.city];
    const listing = await db.listing.create({
      data: {
        ownerId: owner.id,
        title: l.title,
        description: `${l.title}. En muy buen estado, revisado antes de cada alquiler. Recogida en ${c.name}. Categoría: ${categoryName(l.category)}.`,
        category: l.category,
        city: c.name,
        citySlug: l.city,
        lat: c.lat,
        lng: c.lng,
        pricePerDayCents: l.price,
        depositCents: l.deposit,
        photos: { create: [{ url: placeholder(i, l.title, l.color), position: 0 }] },
      },
    });
    if (l.pack)
      await db.packPurchase.create({
        data: {
          listingId: listing.id,
          userId: owner.id,
          packCode: l.pack,
          amountCents: 0,
          status: "paid",
          idempotencyKey: `seed-${listing.id}`,
          startsAt: now,
          endsAt: new Date(now.getTime() + 30 * 86_400_000),
        },
      });
  }
  console.log(`Listo. Usuarios de prueba (contraseña ${PASSWORD}):`, USERS.map((u) => u.email).join(", "));
}

main().finally(() => db.$disconnect());
