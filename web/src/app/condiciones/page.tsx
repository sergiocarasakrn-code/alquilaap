import Link from "next/link";
import { LEGAL } from "@/lib/legal";
import { PACKS, PAID_FEATURES, PRO_PLAN } from "@/lib/config";
import { money } from "@/lib/format";
import { LegalPage } from "@/components/Legal";

export const metadata = { title: "Condiciones de uso", description: "Las reglas para alquilar y publicar en Alquilaap." };

export default function Condiciones() {
  return (
    <LegalPage title="Condiciones de uso" updated={LEGAL.updated}>
      <p>
        Alquilaap es una plataforma de {LEGAL.name} (CIF {LEGAL.taxId}, {LEGAL.address}) que pone en contacto a personas y tiendas que quieren alquilar objetos.
        Al crear una cuenta aceptas estas condiciones y la <Link href="/privacidad">política de privacidad</Link>.
      </p>

      <h2 className="h2">1. Quién puede usar Alquilaap</h2>
      <ul>
        <li>Mayores de 18 años con una identidad real. Para alquilar y publicar hay que verificar la identidad.</li>
        <li>Una cuenta por persona. No puedes usar la cuenta ni los documentos de otra persona.</li>
      </ul>

      <h2 className="h2">2. Cómo funciona un alquiler</h2>
      <ul>
        <li>
          El alquiler es un acuerdo <strong>entre el propietario y quien alquila</strong>. Alquilaap no es parte de ese acuerdo, no es propietaria de los objetos y
          no cobra comisión.
        </li>
        <li>
          El precio del alquiler y la fianza se pagan <strong>en mano</strong>, en la entrega. Alquilaap no cobra, no guarda ni devuelve ese dinero.
        </li>
        <li>
          Al entregar, los dos marcáis «alquilado». Al devolver, los dos marcáis «finalizado»: con esas dos confirmaciones ambos certificáis que el objeto se ha
          devuelto en buen estado.
        </li>
        <li>Si algo va mal, pulsa «Hay un problema» antes de finalizar. Alquilaap podrá mediar, pero la responsabilidad del objeto es de quien lo tiene alquilado.</li>
        <li>El seguro es opcional y lo presta la aseguradora asociada con sus propias condiciones.</li>
      </ul>

      <h2 className="h2">3. Anuncios</h2>
      <ul>
        <li>Publicar es gratis. Solo puedes anunciar objetos que sean tuyos o que tengas derecho a alquilar, con fotos y descripción reales.</li>
        <li>
          Está prohibido anunciar armas, drogas, objetos robados, falsificaciones, animales, productos peligrosos y cualquier cosa ilegal o que exija una licencia
          que no tengas. Los vehículos solo con su seguro y documentación en regla.
        </li>
        <li>Podemos retirar anuncios o cuentas que incumplan estas normas o que reciban denuncias fundadas.</li>
      </ul>

      {PAID_FEATURES ? (
        <>
      <h2 className="h2">4. Servicios de pago</h2>
      <ul>
        <li>
          Packs de visibilidad: {Object.values(PACKS).map((p) => `${p.name} ${money(p.priceCents)}`).join(", ")}. Se activan al pagar y duran el tiempo indicado. Como es un
          servicio digital que empieza de inmediato, al pagar aceptas que se active al momento y que no hay derecho de desistimiento una vez activo.
        </li>
        <li>
          Alquilaap Pro: {money(PRO_PLAN.priceCents)} al mes, se renueva cada mes y puedes cancelarlo cuando quieras; seguirá activo hasta el final del periodo pagado.
        </li>
        <li>Los precios incluyen IVA. Los pagos los procesa Stripe.</li>
      </ul>
        </>
      ) : (
        <>
          <h2 className="h2">4. Precio</h2>
          <p>
            Alquilaap es gratis: no cobramos por registrarte, publicar, escribir ni alquilar, y no nos quedamos ninguna comisión. Si algún día añadimos servicios de
            pago, serán opcionales y te avisaremos antes.
          </p>
        </>
      )}

      <h2 className="h2">5. Conducta</h2>
      <ul>
        <li>Trata con respeto a los demás. No envíes spam ni publicidad por mensajes.</li>
        <li>No pidas pagos por adelantado fuera de la entrega ni datos de tarjeta o contraseñas.</li>
        <li>Las reseñas deben ser sinceras y sobre alquileres reales.</li>
      </ul>

      <h2 className="h2">6. Responsabilidad</h2>
      <p>
        Alquilaap verifica la identidad de los usuarios, pero no inspecciona los objetos ni garantiza su estado. Cada usuario responde de sus anuncios, de los
        objetos que alquila y del uso que hace de ellos. Alquilaap responde de prestar la plataforma con diligencia, conforme a la ley.
      </p>

      <h2 className="h2">7. Baja</h2>
      <p>
        Puedes <Link href="/borrar-cuenta">borrar tu cuenta</Link> cuando quieras. Si tienes una reserva aceptada o en curso, primero hay que terminarla.
      </p>

      <h2 className="h2">8. Ley aplicable</h2>
      <p>
        Estas condiciones se rigen por la ley española. Si eres consumidor, puedes reclamar ante los juzgados de tu domicilio. Para cualquier duda, escríbenos a{" "}
        {LEGAL.email}.
      </p>
    </LegalPage>
  );
}
