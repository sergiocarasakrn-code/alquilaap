import { describe, expect, it } from "vitest";
import { rentability } from "../src/lib/rentabilidad";

describe("calculadora de rentabilidad", () => {
  it("calcula lo que se gana y en cuántos meses se amortiza", () => {
    const r = rentability({ costEuros: 1200, pricePerDay: 25, daysPerMonth: 8, upkeepPct: 10 });
    expect(r.monthlyNet).toBe(180);
    expect(r.paybackMonths).toBe(7);
    expect(r.yearAfter).toBe(2160);
    expect(r.firstYear).toBe(960);
  });
  it("no rompe con valores vacíos o absurdos", () => {
    expect(rentability({ costEuros: 500, pricePerDay: 0, daysPerMonth: 10, upkeepPct: 0 }).paybackMonths).toBeNull();
    expect(rentability({ costEuros: -5, pricePerDay: 10, daysPerMonth: 99, upkeepPct: 150 }).monthlyNet).toBe(0);
    expect(rentability({ costEuros: 100, pricePerDay: 10, daysPerMonth: 40, upkeepPct: 0 }).monthlyNet).toBe(310);
  });
});
