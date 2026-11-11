// Iconos de línea propios de Alquilaap (24×24). La parte en color de marca va en <g className="accent">.
const ICONS: Record<string, React.ReactNode> = {
  motor: (
    <>
      <path d="M3 15v-3l2-4.5A2 2 0 0 1 6.8 6.3h8.7a2 2 0 0 1 1.6.8L20 11l1 1v3h-2" />
      <path d="M5 15H3m12 0H9M4.5 11h15" />
      <g className="accent">
        <circle cx="7" cy="16" r="2" />
        <circle cx="17" cy="16" r="2" />
      </g>
    </>
  ),
  bicis: (
    <>
      <circle cx="5.5" cy="16" r="3.5" />
      <circle cx="18.5" cy="16" r="3.5" />
      <path d="M5.5 16 9 9h7l2.5 7M9 9l3 7h-6.5M14 6h3" />
      <g className="accent">
        <circle cx="12" cy="16" r="1.4" />
      </g>
    </>
  ),
  movilidad: (
    <>
      <path d="M6 18h10l3-12h2" />
      <path d="m14 18-1-6" />
      <g className="accent">
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </g>
    </>
  ),
  deportes: (
    <>
      <path d="M2 16c3 2 17 2 20 0" />
      <path d="M6 15 18 9M15 6l6 6" />
      <g className="accent">
        <path d="M4 19c2.5 1.4 13.5 1.4 16 0" />
      </g>
    </>
  ),
  camping: (
    <>
      <path d="M3 20h18L12 4z" />
      <path d="M12 4v4" />
      <g className="accent">
        <path d="m9 20 3-6 3 6z" />
      </g>
    </>
  ),
  herramientas: (
    <>
      <path d="M14.5 6.5a4 4 0 0 0 5 5l-8.8 8.8a2.1 2.1 0 0 1-3-3l8.8-8.8a4 4 0 0 0 5-5L19 6l-2-.5-.5-2z" />
      <g className="accent">
        <circle cx="9.2" cy="18.8" r="0.8" />
      </g>
    </>
  ),
  hogar: (
    <>
      <path d="M4 20h16M6 20v-6h12v6" />
      <path d="M12 14V9" />
      <g className="accent">
        <path d="M12 9c-2.5 0-3.5-2-3-4 2 0 3 1.5 3 4zm0 0c2.5 0 3.5-2 3-4-2 0-3 1.5-3 4z" />
      </g>
    </>
  ),
  foto: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="m8 7 1.5-3h5L16 7" />
      <g className="accent">
        <circle cx="12" cy="13.5" r="3.5" />
      </g>
    </>
  ),
  electronica: (
    <>
      <rect x="4" y="5" width="16" height="11" rx="1.5" />
      <path d="M2 19h20" />
      <g className="accent">
        <path d="M9 19h6" />
        <path d="m15 8-3 5" />
      </g>
    </>
  ),
  juegos: (
    <>
      <path d="M7 8h10a4 4 0 0 1 4 4.5l-.5 3a2.5 2.5 0 0 1-4.3 1.3L14.5 15h-5l-1.7 1.8a2.5 2.5 0 0 1-4.3-1.3l-.5-3A4 4 0 0 1 7 8z" />
      <g className="accent">
        <path d="M7 11v3M5.5 12.5h3" />
        <circle cx="16" cy="11.5" r="0.8" />
        <circle cx="17.5" cy="13.5" r="0.8" />
      </g>
    </>
  ),
  fiestas: (
    <>
      <path d="M4 20 9 7l8 8z" />
      <path d="M15 4v2M20 9h-2M18.5 5.5 17 7" />
      <g className="accent">
        <path d="m6.5 14 3 3M8 10.5l5 5" />
      </g>
    </>
  ),
  bebes: (
    <>
      <path d="M4 10h11a5 5 0 0 1-5 5H8a4 4 0 0 1-4-4z" />
      <path d="M15 10V5h2M4 10V7" />
      <g className="accent">
        <circle cx="7" cy="18.5" r="1.8" />
        <circle cx="13" cy="18.5" r="1.8" />
      </g>
    </>
  ),
  moda: (
    <>
      <path d="M9 3h6l1 3-2 2 3 13H7l3-13-2-2z" />
      <g className="accent">
        <path d="M10 8h4" />
      </g>
    </>
  ),
  musica: (
    <>
      <path d="M14 4h3v3M17 4l-6.5 6.5" />
      <path d="M10.5 10.5a4.5 4.5 0 1 0 3 3c-1.5.3-2.7-1.5-3-3z" />
      <g className="accent">
        <circle cx="9" cy="15" r="1.3" />
      </g>
    </>
  ),
  mascotas: (
    <>
      <path d="M12 12c-2.8 0-5 2.6-5 5 0 1.6 1.2 2.5 2.5 2.5 1 0 1.6-.6 2.5-.6s1.5.6 2.5.6c1.3 0 2.5-.9 2.5-2.5 0-2.4-2.2-5-5-5z" />
      <g className="accent">
        <circle cx="5" cy="10" r="1.6" />
        <circle cx="9" cy="6" r="1.6" />
        <circle cx="15" cy="6" r="1.6" />
        <circle cx="19" cy="10" r="1.6" />
      </g>
    </>
  ),
  espacios: (
    <>
      <path d="M3 9.5 12 4l9 5.5V20H3z" />
      <path d="M3 20h18" />
      <g className="accent">
        <path d="M8 20v-7h8v7M8 15.5h8M8 18h8" />
      </g>
    </>
  ),
  todas: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <g className="accent">
        <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
      </g>
    </>
  ),
};

export function CategoryIcon({ slug, className = "h-7 w-7" }: { slug: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`cat-icon shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[slug] ?? ICONS.todas}
    </svg>
  );
}
