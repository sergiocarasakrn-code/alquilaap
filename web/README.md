# Alquilaap web (fase 1)

Next.js 15 + PostgreSQL (Prisma). Una sola app con las pantallas y la API (`/api/v1`).

## Arrancar en local

```bash
cp .env.example .env          # ajusta DATABASE_URL
npm install
npx prisma migrate deploy     # crea las tablas
npm run db:seed               # datos de ejemplo (contraseña de los usuarios demo: alquilaap123)
npm run dev                   # http://localhost:3000
```

Con PostgreSQL en Docker: `docker run -d -p 5432:5432 -e POSTGRES_USER=alquilaap -e POSTGRES_PASSWORD=alquilaap postgres:16`.

## Qué incluye

- Cuentas con email y contraseña, verificación de identidad obligatoria para publicar y reservar (DNI/NIE con letra validada; el número se guarda cifrado con HMAC).
- Anuncios con fotos, búsqueda por texto, categoría y ciudad, y páginas SEO `/alquilar/<categoría>/<ciudad>`.
- Reservas: solicitud, aceptación (inmediata si el propietario es Pro), doble confirmación «alquilado» y «finalizado», incidencias, chat y reseñas.
- Packs de visibilidad y suscripción Alquilaap Pro con Stripe. Sin claves de Stripe, en desarrollo se puede simular el pago.
- Alquilaap no cobra el alquiler ni la fianza: se pagan en mano.

## Garantías

- La base de datos impide dos reservas aceptadas que se solapen (restricción `booking_no_overlap`).
- Bloqueo optimista (`version`) para que dos personas no se pisen al tocar la misma reserva.
- Acciones idempotentes: repetir «alquilado», pulsar dos veces «Destacar» o recibir dos veces el mismo aviso de Stripe no duplica nada.

## Pruebas

```bash
npm test                                         # reglas de negocio
TEST_DATABASE_URL=postgresql://... npm run test:db   # también contra PostgreSQL real
```

## Pendiente para producción

- Fotos en S3/R2 (ahora en disco local: `src/lib/storage.ts`).
- Verificación de identidad con Stripe Identity (ahora `KYC_AUTO_APPROVE` en desarrollo; en producción queda «pendiente»).
- Emails (bienvenida, nueva reserva) y recuperación de contraseña.
- Panel de soporte para incidencias y verificaciones.
