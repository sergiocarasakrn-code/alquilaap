import Link from "next/link";
import { LEGAL } from "@/lib/legal";
import { PAID_FEATURES } from "@/lib/config";
import { LegalPage } from "@/components/Legal";

export const metadata = { title: "Política de privacidad", description: "Qué datos trata Alquilaap, para qué y cómo ejercer tus derechos." };

export default function Privacidad() {
  return (
    <LegalPage title="Política de privacidad" updated={LEGAL.updated}>
      <p>
        En Alquilaap tratamos tus datos solo para que puedas alquilar y publicar con seguridad. Aquí te explicamos qué datos usamos, para qué, con quién los
        compartimos y cómo puedes borrarlos.
      </p>

      <h2 className="h2">1. Quién es el responsable</h2>
      <ul>
        <li>
          <strong>Titular:</strong> {LEGAL.name} (CIF {LEGAL.taxId})
        </li>
        <li>
          <strong>Domicilio:</strong> {LEGAL.address}
        </li>
        <li>
          <strong>Contacto para privacidad:</strong> {LEGAL.email}
        </li>
      </ul>

      <h2 className="h2">2. Qué datos tratamos</h2>
      <ul>
        <li>
          <strong>Cuenta:</strong> nombre, email y contraseña (guardada cifrada; nunca la vemos).
        </li>
        <li>
          <strong>Verificación de identidad</strong> (opcional; da el sello «Verificado» y ayuda a prevenir robos): nombre y apellidos, DNI o NIE, fecha de nacimiento,
          teléfono, dirección, foto del documento y un selfie. Del DNI o NIE no guardamos el número: solo una huella cifrada (para impedir cuentas duplicadas) y los
          4 últimos caracteres.
        </li>
        <li>
          <strong>Anuncios:</strong> título, descripción, fotos, precio y localidad. Si usas «Usar mi ubicación», guardamos una ubicación aproximada (redondeada a
          1 km), nunca la exacta.
        </li>
        <li>
          <strong>Reservas, mensajes y reseñas</strong> entre usuarios, y las incidencias que se abran.
        </li>
        {PAID_FEATURES && (
          <li>
            <strong>Pagos de packs y de Alquilaap Pro:</strong> los gestiona Stripe. No vemos ni guardamos los datos de tu tarjeta.
          </li>
        )}
        <li>
          <strong>Datos técnicos:</strong> una cookie de sesión para que no tengas que entrar cada vez. No usamos cookies de publicidad ni de seguimiento.
        </li>
      </ul>

      <h2 className="h2">3. Para qué los usamos y con qué base legal</h2>
      <ul>
        <li>
          <strong>Prestarte el servicio</strong> (cuenta, anuncios, reservas, mensajes, avisos por email): ejecución del contrato que aceptas al registrarte.
        </li>
        <li>
          <strong>Verificar tu identidad y prevenir robos y fraudes:</strong> interés legítimo de Alquilaap y de los usuarios en alquilar con seguridad.
        </li>
        {PAID_FEATURES && (
          <li>
            <strong>Cobrar los packs y la suscripción y llevar la contabilidad:</strong> ejecución del contrato y obligaciones legales.
          </li>
        )}
        <li>
          <strong>Atender incidencias y requerimientos de las autoridades:</strong> interés legítimo y obligación legal.
        </li>
      </ul>
      <p>No vendemos tus datos ni los usamos para publicidad de terceros.</p>

      <h2 className="h2">4. Qué ven otros usuarios</h2>
      <p>
        Los demás ven tu nombre, tus anuncios, tus reseñas y si estás verificado. Tu teléfono solo lo ve la otra persona cuando una reserva está aceptada. Tu
        DNI, dirección, documento y selfie no los ve ningún usuario: solo el equipo de Alquilaap para verificarte.
      </p>

      <h2 className="h2">5. Con quién los compartimos</h2>
      <p>Solo con los proveedores que necesitamos para funcionar, con contrato de encargado del tratamiento:</p>
      <ul>
        <li>Railway (alojamiento de la web y la base de datos).</li>
        <li>Cloudflare (almacenamiento privado de fotos y documentos).</li>
        <li>{PAID_FEATURES ? "Stripe (pagos y, cuando se active, verificación de identidad)." : "Stripe (cuando se active, verificación de identidad)."}</li>
        <li>Resend (envío de emails de aviso).</li>
      </ul>
      <p>
        Algunos de estos proveedores pueden tratar datos fuera del Espacio Económico Europeo. En ese caso lo hacen con las garantías del RGPD (cláusulas
        contractuales tipo de la Comisión Europea o marco de privacidad UE-EE. UU.). También podemos facilitar datos a jueces o fuerzas de seguridad cuando la ley
        lo exija, por ejemplo ante una denuncia por robo.
      </p>

      <h2 className="h2">6. Cuánto tiempo los guardamos</h2>
      <ul>
        <li>Mientras tengas la cuenta abierta.</li>
        <li>
          Si la borras, eliminamos al momento tus datos personales, tu documento, tu selfie y tus anuncios. El historial de reservas, mensajes y reseñas se
          conserva sin tu nombre, porque también pertenece a la otra persona.
        </li>
        <li>Si tuviste alguna incidencia, guardamos la huella cifrada de tu DNI hasta 5 años, solo para prevenir fraudes.</li>
        {PAID_FEATURES && <li>Las facturas de los packs y de la suscripción se guardan el tiempo que exige la ley fiscal.</li>}
      </ul>

      <h2 className="h2">7. Tus derechos</h2>
      <p>
        Puedes pedir acceso, rectificación, supresión, oposición, limitación y portabilidad de tus datos escribiendo a {LEGAL.email}. Puedes{" "}
        <Link href="/borrar-cuenta">borrar tu cuenta</Link> tú mismo en cualquier momento. Si no estás conforme con cómo tratamos tus datos, puedes reclamar ante
        la Agencia Española de Protección de Datos (aepd.es).
      </p>

      <h2 className="h2">8. Menores</h2>
      <p>Alquilaap es solo para mayores de 18 años. La verificación de identidad comprueba la fecha de nacimiento.</p>

      <h2 className="h2">9. Cambios</h2>
      <p>Si cambiamos esta política de forma importante, te avisaremos en la app o por email.</p>
    </LegalPage>
  );
}
