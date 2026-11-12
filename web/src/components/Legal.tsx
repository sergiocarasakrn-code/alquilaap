// Formato común de las páginas legales.
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-2xl space-y-4 text-ink-2 [&_a]:font-semibold [&_a]:text-brand [&_h2]:mt-8 [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink">
      <h1 className="h1 text-ink">{title}</h1>
      <p className="text-sm text-ink-3">Última actualización: {updated}</p>
      {children}
    </article>
  );
}
