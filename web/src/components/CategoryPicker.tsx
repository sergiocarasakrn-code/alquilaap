"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/config";
import { CategoryIcon } from "./CategoryIcon";

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

type Cat = (typeof CATEGORIES)[number];

interface Props {
  /** "links": navega a la búsqueda. "form": rellena los campos category y subcategory de un formulario. */
  mode: "links" | "form";
  defaultCategory?: string;
  defaultSubcategory?: string | null;
  city?: string;
}

const Chevron = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-ink-2" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path d="m9 6 6 6-6 6" />
  </svg>
);
const Check = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-brand" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
    <path d="m5 12 5 5 9-10" />
  </svg>
);

export function CategoryPicker({ mode, defaultCategory, defaultSubcategory, city }: Props) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [cat, setCat] = useState(defaultCategory ?? "");
  const [sub, setSub] = useState(defaultSubcategory ?? "");
  const [editing, setEditing] = useState(mode === "links" || !defaultCategory);

  const href = (c?: string, s?: string) => {
    // Categoría entera: página de alquiler propia (la que Google indexa).
    if (c && !s) return city ? `/alquilar/${c}/${city}` : `/alquilar/${c}`;
    const p = new URLSearchParams();
    if (c) p.set("cat", c);
    if (s) p.set("sub", s);
    if (city) p.set("ciudad", city);
    return `/buscar${p.size ? "?" + p : ""}`;
  };

  // Búsqueda: encuentra categorías por su nombre o por el de cualquiera de sus subcategorías.
  const results = useMemo(() => {
    const t = norm(q.trim());
    if (!t) return null;
    const out: { cat: Cat; sub?: { slug: string; name: string } }[] = [];
    for (const c of CATEGORIES) {
      if (norm(c.name).includes(t)) out.push({ cat: c });
      for (const s of c.subs) if (norm(s.name).includes(t)) out.push({ cat: c, sub: s });
    }
    return out;
  }, [q]);

  const choose = (c: string, s = "") => {
    setCat(c);
    setSub(s);
    setOpen(null);
    setQ("");
    setEditing(false);
  };

  const row = "flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left hover:bg-surface-2";
  const current = CATEGORIES.find((c) => c.slug === cat);
  const opened = CATEGORIES.find((c) => c.slug === open);

  const Item = ({ c, s, children }: { c: Cat; s?: { slug: string; name: string }; children: React.ReactNode }) =>
    mode === "links" ? (
      <Link href={href(c.slug, s?.slug)} className={row}>
        {children}
      </Link>
    ) : (
      <button type="button" className={row} onClick={() => choose(c.slug, s?.slug)}>
        {children}
      </button>
    );

  return (
    <div>
      {mode === "form" && (
        <>
          <input type="hidden" name="category" value={cat} />
          <input type="hidden" name="subcategory" value={sub} />
        </>
      )}
      {mode === "form" && !editing && current ? (
        <button type="button" onClick={() => setEditing(true)} className={`${row} border border-line bg-surface`}>
          <CategoryIcon slug={current.slug} />
          <span className="flex-1">
            <span className="block font-medium">{current.name}</span>
            <span className="block text-sm text-ink-3">{current.subs.find((s) => s.slug === sub)?.name ?? "Sin subcategoría"}</span>
          </span>
          <span className="text-sm font-semibold text-brand">Cambiar</span>
        </button>
      ) : (
        <div className="space-y-2">
          <label className="relative block">
            <span className="sr-only">Buscar una categoría</span>
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-3" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setOpen(null);
              }}
              placeholder="Buscar una categoría"
              className="w-full rounded-full border border-line bg-surface py-3 pl-12 pr-4 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>

          {results ? (
            <ul>
              {results.length === 0 && <li className="px-3 py-3 text-sm text-ink-3">No hay ninguna categoría con ese nombre.</li>}
              {results.map((r) => (
                <li key={r.cat.slug + (r.sub?.slug ?? "")}>
                  <Item c={r.cat} s={r.sub}>
                    <CategoryIcon slug={r.cat.slug} />
                    <span className="flex-1">
                      {r.sub ? (
                        <>
                          <span className="block">{r.sub.name}</span>
                          <span className="block text-sm text-ink-3">en {r.cat.name}</span>
                        </>
                      ) : (
                        r.cat.name
                      )}
                    </span>
                    <Chevron />
                  </Item>
                </li>
              ))}
            </ul>
          ) : opened ? (
            <div>
              <button type="button" onClick={() => setOpen(null)} className="mb-1 flex items-center gap-2 px-3 py-2 text-sm font-semibold text-brand">
                ← Todas las categorías
              </button>
              <div className="flex items-center gap-4 px-3 pb-2">
                <CategoryIcon slug={opened.slug} className="h-8 w-8" />
                <span className="font-display text-lg font-bold">{opened.name}</span>
              </div>
              <ul>
                <li>
                  <Item c={opened}>
                    <span className="flex-1 font-medium">{mode === "links" ? `Todo en ${opened.name}` : "Sin subcategoría"}</span>
                    {mode === "form" && cat === opened.slug && !sub ? <Check /> : <Chevron />}
                  </Item>
                </li>
                {opened.subs.map((s) => (
                  <li key={s.slug}>
                    <Item c={opened} s={s}>
                      <span className="flex-1">{s.name}</span>
                      {mode === "form" && cat === opened.slug && sub === s.slug ? <Check /> : <Chevron />}
                    </Item>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <ul>
              {mode === "links" && (
                <li>
                  <Link href={href()} className={row}>
                    <CategoryIcon slug="todas" />
                    <span className="flex-1">Todas las categorías</span>
                    <Chevron />
                  </Link>
                </li>
              )}
              {CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <button type="button" className={row} onClick={() => setOpen(c.slug)}>
                    <CategoryIcon slug={c.slug} />
                    <span className="flex-1">{c.name}</span>
                    {mode === "form" && cat === c.slug ? <Check /> : <Chevron />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
