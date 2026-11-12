// Digital Asset Links: demuestra a Android que la app de Play Store y esta web son del mismo dueño,
// para que la app abra la web a pantalla completa (sin barra del navegador).
// Variables: ANDROID_PACKAGE (p. ej. es.alquilaap.app) y ANDROID_CERT_SHA256 (huellas SHA-256 separadas por comas,
// la de Play Console → Integridad de la app → Firma de apps).
export const dynamic = "force-dynamic";

export function GET() {
  const pkg = process.env.ANDROID_PACKAGE;
  const prints = (process.env.ANDROID_CERT_SHA256 ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  const body =
    pkg && prints.length
      ? [{ relation: ["delegate_permission/common.handle_all_urls"], target: { namespace: "android_app", package_name: pkg, sha256_cert_fingerprints: prints } }]
      : [];
  return Response.json(body, { headers: { "Cache-Control": "public, max-age=3600" } });
}
