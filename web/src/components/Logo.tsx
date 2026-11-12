// Logo de Alquilaap: dos chinchetas que se juntan (el dueño y quien alquila, cerca el uno del otro).
// La primera usa currentColor (verde de marca, más claro en modo oscuro) y los huecos el color de fondo.
export function LogoMark({ className = "h-7 w-auto" }: { className?: string }) {
  const pin = "M0 22 C-3 18 -11 11 -11 3 A11 11 0 0 1 11 3 C11 11 3 18 0 22 Z";
  return (
    <svg viewBox="11 11.5 42 43" className={className} aria-hidden>
      <g transform="translate(24 24)">
        <path d={pin} fill="currentColor" />
        <circle cx="0" cy="3" r="4.2" fill="var(--surface)" />
      </g>
      <g transform="translate(40 30)">
        <path d={pin} fill="#F3C536" stroke="var(--surface)" strokeWidth="2.6" strokeLinejoin="round" />
        <circle cx="0" cy="3" r="4.2" fill="var(--surface)" />
      </g>
    </svg>
  );
}

/** compact: en móviles estrechos solo se ve el símbolo (para que quepa el menú con sesión iniciada). */
export function Logo({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-brand ${className}`}>
      <LogoMark />
      <span className={`font-logo text-[1.4rem] leading-none tracking-tight ${compact ? "hidden min-[440px]:inline" : ""}`}>alquilaap</span>
    </span>
  );
}
