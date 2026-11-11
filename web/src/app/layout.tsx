import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { currentUser, isProUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { logout } from "./actions/auth";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600", "800"], variable: "--font-bricolage" });
const body = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: "Alquilaap · Alquila lo que necesitas, cerca de ti", template: "%s · Alquilaap" },
  description: "Alquila bicis, herramientas, material de camping y mucho más a particulares y tiendas. Publicar es gratis.",
};
export const viewport: Viewport = { themeColor: "#0f6b5c", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <html lang="es" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh font-sans antialiased">
        <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
            <Link href="/" className="font-display text-xl font-extrabold tracking-tight text-brand">
              alquilaap
            </Link>
            <form action="/buscar" className="hidden flex-1 sm:block">
              <input name="q" placeholder="¿Qué necesitas alquilar?" className="input max-w-md" aria-label="Buscar" />
            </form>
            <nav className="ml-auto flex shrink-0 items-center gap-0.5 text-sm font-medium sm:gap-1">
              <Link href="/buscar" className={`rounded-lg px-2 py-2 hover:bg-surface-2 sm:hidden ${user ? "hidden" : ""}`}>
                Buscar
              </Link>
              {user ? (
                <>
                  <Link href="/reservas" className="rounded-lg px-2 py-2 hover:bg-surface-2 sm:px-3">
                    Reservas
                  </Link>
                  <Link href="/mis-anuncios" className="hidden rounded-lg px-3 py-2 hover:bg-surface-2 sm:inline">
                    Mis anuncios
                  </Link>
                  <Link href="/perfil" className="rounded-lg px-2 py-2 hover:bg-surface-2 sm:px-3">
                    {user.name.split(" ")[0]}
                    {isProUser(user) && <span className="pill ml-1 bg-tag text-tag-ink">PRO</span>}
                  </Link>
                  {isAdmin(user) && (
                    <Link href="/admin" className="hidden rounded-lg px-3 py-2 hover:bg-surface-2 sm:inline">
                      Admin
                    </Link>
                  )}
                  <form action={logout} className="hidden sm:block">
                    <button className="rounded-lg px-3 py-2 text-ink-3 hover:bg-surface-2">Salir</button>
                  </form>
                </>
              ) : (
                <Link href="/entrar" className="rounded-lg px-3 py-2 hover:bg-surface-2">
                  Entrar
                </Link>
              )}
              <Link href="/publicar" className="btn-primary ml-1 px-3 sm:px-4">
                Publicar
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
        <footer className="mt-12 border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-2 px-4 py-6 text-sm text-ink-3">
            <span>© Alquilaap</span>
            <Link href="/pro">Alquilaap Pro para tiendas</Link>
            <Link href="/como-funciona">Cómo funciona</Link>
            <span>Publicar y alquilar es gratis. El alquiler se paga en mano.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
