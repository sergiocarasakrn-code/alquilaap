import Link from "next/link";
import { INSURANCE } from "@/lib/config";
import { money } from "@/lib/format";

export const metadata = { title: "Cómo funciona" };

const STEPS = [
  ["Regístrate y verifica tu identidad", "Nombre, DNI o NIE, fecha de nacimiento, teléfono, dirección, foto del documento y un selfie. Solo una vez. Así evitamos robos."],
  ["Publica gratis o busca lo que necesitas", "Publicar y alquilar no cuesta nada. Si quieres más visitas, puedes destacar tu anuncio."],
  ["Solicita la reserva", "El propietario la acepta (o se acepta al momento si es Tienda Pro). Acordad la recogida por el chat."],
  ["Al entregar: los dos marcáis «alquilado»", "El alquiler y la fianza se pagan en mano. Alquilaap no cobra comisión ni retiene dinero."],
  ["Al devolver: los dos marcáis «finalizado»", "Con las dos confirmaciones queda certificado que el objeto se devolvió en perfectas condiciones."],
  ["¿Algo fue mal? «Hay un problema»", "Se abre una incidencia, la reserva se congela y el equipo de Alquilaap media."],
  ["Valoraos", "Las reseñas solo se pueden dejar tras un alquiler finalizado por los dos, así son reales."],
];

export default function ComoFunciona() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="h1">Cómo funciona</h1>
      <ol className="space-y-3">
        {STEPS.map(([t, d], i) => (
          <li key={t} className="card flex gap-3 p-4">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand font-bold text-brand-ink">{i + 1}</span>
            <div>
              <p className="font-semibold">{t}</p>
              <p className="text-sm text-ink-2">{d}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="card p-4 text-sm text-ink-2">
        Seguro opcional: {INSURANCE.name}, hasta {money(INSURANCE.coverCents)} de cobertura, por el {Math.round(INSURANCE.rate * 100)} % del alquiler (mínimo{" "}
        {money(INSURANCE.minCents)}).
      </p>
      <Link href="/registro" className="btn-primary">
        Crear cuenta gratis
      </Link>
    </div>
  );
}
