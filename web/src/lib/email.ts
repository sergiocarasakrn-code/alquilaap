import "server-only";

// Emails de aviso. Se envían con Resend (https://resend.com) si están RESEND_API_KEY y EMAIL_FROM.
// Sin ellas, la app funciona igual y los avisos solo se ven dentro de la app (en desarrollo se muestran en la consola).

export const emailEnabled = () => !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function messageEmail(p: { toName: string; fromName: string; listingTitle: string; preview: string; url: string }) {
  const preview = p.preview.length > 280 ? p.preview.slice(0, 277) + "…" : p.preview;
  const subject = `${p.fromName} te ha escrito sobre «${p.listingTitle}»`;
  const text = `Hola ${p.toName}:\n\n${p.fromName} te ha escrito sobre «${p.listingTitle}»:\n\n"${preview}"\n\nResponde aquí: ${p.url}\n\nAlquilaap`;
  const html = `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;color:#16201e">
<p style="font-size:20px;font-weight:800;color:#0f6b5c;margin:0 0 16px">alquilaap</p>
<p>Hola ${esc(p.toName)}:</p>
<p><b>${esc(p.fromName)}</b> te ha escrito sobre <b>«${esc(p.listingTitle)}»</b>:</p>
<blockquote style="margin:16px 0;padding:12px 16px;background:#eceee7;border-radius:12px;white-space:pre-line">${esc(preview)}</blockquote>
<p><a href="${esc(p.url)}" style="display:inline-block;background:#0f6b5c;color:#fff;padding:10px 18px;border-radius:12px;text-decoration:none;font-weight:600">Responder</a></p>
<p style="font-size:12px;color:#7c8682;margin-top:24px">Por seguridad, entrega y paga siempre en persona y nunca compartas contraseñas ni códigos.</p>
</div>`;
  return { subject, text, html };
}

export async function sendEmail(to: string, msg: { subject: string; text: string; html: string }): Promise<boolean> {
  if (!emailEnabled()) {
    if (process.env.NODE_ENV !== "production") console.info(`[email sin configurar] Para ${to}: ${msg.subject}`);
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject: msg.subject, text: msg.text, html: msg.html }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    console.error(`No se pudo enviar el email (${res.status}): ${(await res.text()).slice(0, 200)}`);
    return false;
  }
  return true;
}
