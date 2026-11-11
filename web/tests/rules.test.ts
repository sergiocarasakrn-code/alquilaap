import { describe, expect, it } from "vitest";
import { transition, availableActions, BookingRuleError, type BookingState } from "@/lib/booking-rules";
import { quote, insuranceCents } from "@/lib/pricing";
import { normalizeIdNumber, ageOn } from "@/lib/dni";
import { boostRank, sortListings } from "@/lib/ranking";
import { parseDay, parseEuros } from "@/lib/format";

const base = (over: Partial<BookingState> = {}): BookingState => ({
  status: "requested",
  ownerPickedUpAt: null,
  renterPickedUpAt: null,
  ownerReturnedOkAt: null,
  renterReturnedOkAt: null,
  ...over,
});
const now = new Date("2026-11-11T10:00:00Z");
const apply = (b: BookingState, t: ReturnType<typeof transition>) => ({ ...b, ...t.patch }) as BookingState;

describe("doble confirmación", () => {
  it("solo pasa a «en curso» cuando los dos marcan «alquilado», y a «finalizada» cuando los dos marcan «finalizado»", () => {
    let b = apply(base(), transition(base(), "owner", "accept", now));
    expect(b.status).toBe("accepted");
    b = apply(b, transition(b, "owner", "pickup", now));
    expect(b.status).toBe("accepted");
    expect(b.ownerPickedUpAt).toEqual(now);
    b = apply(b, transition(b, "renter", "pickup", now));
    expect(b.status).toBe("in_progress");
    b = apply(b, transition(b, "renter", "return_ok", now));
    expect(b.status).toBe("in_progress");
    const last = transition(b, "owner", "return_ok", now);
    expect(last.event).toBe("completed");
    expect(apply(b, last).status).toBe("completed");
  });

  it("repetir una confirmación no cambia nada (idempotente)", () => {
    const b = base({ status: "accepted", ownerPickedUpAt: now });
    const t = transition(b, "owner", "pickup", new Date());
    expect(t.changed).toBe(false);
    expect(t.patch).toEqual({});
  });

  it("no deja finalizar antes de entregar ni marcar alquilado sin aceptar", () => {
    expect(() => transition(base({ status: "accepted" }), "owner", "return_ok", now)).toThrow(BookingRuleError);
    expect(() => transition(base(), "renter", "pickup", now)).toThrow(BookingRuleError);
  });

  it("solo el propietario acepta o rechaza", () => {
    expect(() => transition(base(), "renter", "accept", now)).toThrow(/propietario/);
  });

  it("cancelar: el cliente mientras está pendiente; nadie una vez entregado", () => {
    expect(transition(base(), "renter", "cancel", now).patch.status).toBe("cancelled");
    expect(() => transition(base(), "owner", "cancel", now)).toThrow();
    expect(() => transition(base({ status: "accepted", renterPickedUpAt: now }), "owner", "cancel", now)).toThrow();
  });

  it("una incidencia congela la reserva y exige descripción", () => {
    const b = base({ status: "in_progress", ownerPickedUpAt: now, renterPickedUpAt: now });
    expect(() => transition(b, "owner", "incident", now, "")).toThrow(/Describe/);
    const t = transition(b, "owner", "incident", now, "Rueda pinchada y rayada");
    expect(t.patch.status).toBe("incident");
    expect(availableActions(apply(b, t), "renter")).toEqual([]);
  });

  it("ofrece las acciones correctas a cada parte", () => {
    expect(availableActions(base(), "owner")).toEqual(["accept", "decline"]);
    expect(availableActions(base(), "renter")).toEqual(["cancel"]);
    expect(availableActions(base({ status: "accepted", ownerPickedUpAt: now }), "owner")).toEqual(["incident"]);
    expect(availableActions(base({ status: "accepted", ownerPickedUpAt: now }), "renter")).toEqual(["pickup", "incident"]);
  });
});

describe("precio", () => {
  it("cuenta los dos días incluidos y no añade comisión", () => {
    const q = quote(1500, 5000, new Date("2026-11-12"), new Date("2026-11-14"), false);
    expect(q).toEqual({ days: 3, rentCents: 4500, depositCents: 5000, insuranceCents: 0, payInPersonCents: 9500 });
  });
  it("seguro: 7 % con mínimo de 3 €", () => {
    expect(insuranceCents(1000)).toBe(300);
    expect(insuranceCents(10000)).toBe(700);
  });
});

describe("DNI / NIE", () => {
  it("valida la letra", () => {
    expect(normalizeIdNumber("12345678z")).toBe("12345678Z");
    expect(normalizeIdNumber("12345678A")).toBeNull();
    expect(normalizeIdNumber("X1234567L")).toBe("X1234567L");
    expect(normalizeIdNumber("Y-1234567-X")).toBe("Y1234567X");
    expect(normalizeIdNumber("X12345678L")).toBeNull();
  });
  it("calcula la edad", () => {
    expect(ageOn(new Date("2008-11-12"), new Date("2026-11-11"))).toBe(17);
    expect(ageOn(new Date("2008-11-11"), new Date("2026-11-11"))).toBe(18);
  });
});

describe("visibilidad", () => {
  it("Premium > Pro 7 días > Alquilaap Pro > Básico 24 h > gratuito", () => {
    expect(boostRank(["premium"], false)).toBe(3);
    expect(boostRank(["pro"], true)).toBe(2);
    expect(boostRank([], true)).toBe(1.5);
    expect(boostRank(["basico"], false)).toBe(1);
    expect(boostRank([], false)).toBe(0);
  });
  it("ordena por prioridad y luego por fecha", () => {
    const d = (s: string) => new Date(s);
    const out = sortListings([
      { id: "a", rank: 0, createdAt: d("2026-11-10") },
      { id: "b", rank: 2, createdAt: d("2026-11-01") },
      { id: "c", rank: 0, createdAt: d("2026-11-11") },
    ]);
    expect(out.map((x) => x.id)).toEqual(["b", "c", "a"]);
  });
});

describe("formularios", () => {
  it("lee euros escritos a la española", () => {
    expect(parseEuros("12,50")).toBe(1250);
    expect(parseEuros("12 €")).toBe(1200);
    expect(parseEuros("abc")).toBeNull();
    expect(parseEuros("1.234,5")).toBeNull();
  });
  it("rechaza fechas imposibles", () => {
    expect(parseDay("2026-02-30")).toBeNull();
    expect(parseDay("2026-02-28")?.toISOString()).toBe("2026-02-28T00:00:00.000Z");
  });
});

import { distanceKm, nearestPlace, placesInRegion, PLACES, PROVINCES } from "@/lib/places";
import { parseZone } from "@/lib/zone";
import { CATEGORIES, isSubcategory } from "@/lib/config";

describe("ubicación", () => {
  it("mide distancias reales", () => {
    const d = distanceKm(PLACES.barcelona.lat, PLACES.barcelona.lng, PLACES.castelldefels.lat, PLACES.castelldefels.lng);
    expect(d).toBeGreaterThan(17);
    expect(d).toBeLessThan(22);
  });
  it("todas las localidades tienen provincia y comunidad", () => {
    for (const p of Object.values(PLACES)) expect(PROVINCES[p.province]).toBeDefined();
    expect(placesInRegion("cataluna")).toContain("sant-cugat");
  });
  it("encuentra la localidad más cercana", () => {
    expect(nearestPlace(41.29, 1.98)).toBe("castelldefels");
  });
  it("interpreta la zona de la URL", () => {
    expect(parseZone({ ciudad: "valencia" }).placeSlugs).toEqual(["valencia"]);
    expect(parseZone({ zona: "p:barcelona" }).placeSlugs).toContain("badalona");
    const near = parseZone({ zona: "l:valencia", km: "10" });
    expect(near.km).toBe(10);
    expect(near.placeSlugs).toBeUndefined();
    const mine = parseZone({ lat: "41.3912", lng: "2.1549" });
    expect(mine).toMatchObject({ mine: true, km: 25, center: { lat: 41.39, lng: 2.15 } });
    expect(parseZone({ lat: "48.85", lng: "2.35" }).mine).toBe(false); // París: fuera de España
    expect(parseZone({ km: "7" }).km).toBeUndefined();
  });
});

describe("categorías", () => {
  it("los slugs antiguos siguen existiendo", () => {
    for (const s of ["bicis", "movilidad", "herramientas", "deportes", "camping", "foto", "electronica", "fiestas", "hogar"])
      expect(CATEGORIES.some((c) => c.slug === s)).toBe(true);
  });
  it("valida subcategorías dentro de su categoría", () => {
    expect(isSubcategory("bicis", "gravel")).toBe(true);
    expect(isSubcategory("motor", "gravel")).toBe(false);
  });
});
