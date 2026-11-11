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

## Publicar en Railway

Railway construye la app con el `Dockerfile` de la raíz del repositorio (lo indica el `railway.json` de la raíz): no hace falta configurar «Root Directory». Al arrancar aplica las migraciones (`npm run start:prod`) y Railway comprueba `/api/v1/health` antes de pasar el tráfico a la versión nueva (sin cortes). Si alguien pone «Root Directory = web», también funciona: entonces se usa `web/railway.json` con el constructor estándar de Railway.

1. En Railway: New Project → Deploy from GitHub repo → `alquilaap`. Deja «Root Directory» vacío.
2. Añade una base de datos PostgreSQL al proyecto y, en Variables del servicio, `DATABASE_URL = ${{Postgres.DATABASE_URL}}`.
3. Resto de variables: `ID_HASH_SECRET` (texto largo aleatorio), `APP_URL` (la URL pública), `ADMIN_EMAILS`, `S3_*` (Cloudflare R2), `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET`.
4. En Stripe, webhook a `<APP_URL>/api/v1/stripe/webhook` con los eventos `checkout.session.completed`, `customer.subscription.updated` y `customer.subscription.deleted`.

Las fuentes (Inter y Bricolage Grotesque) van dentro de la app (`@fontsource`), así que construir no depende de descargar nada de Google.

## Administración

Los emails de `ADMIN_EMAILS` ven el enlace «Admin» (`/admin`): aprobar o rechazar verificaciones de identidad (con la foto del documento y el selfie) y ver incidencias abiertas. Los documentos se guardan en privado y solo los ve un administrador.

## Pendiente

- Verificación automática con Stripe Identity (ahora se aprueba a mano en `/admin`; en local, `KYC_AUTO_APPROVE`).
- Emails (bienvenida, nueva reserva) y recuperación de contraseña.
- Panel de soporte para incidencias y verificaciones.
