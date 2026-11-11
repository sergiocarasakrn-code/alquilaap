# Propuesta técnica (resumen)

Documento completo: https://claude.ai/artifact/4uE1ZEGSvRQQWqaLx3MK2Z

## Modelo de negocio
- Gratis para publicar y alquilar. Sin comisiones. Sin pagos retenidos (sin escrow).
- Packs de visibilidad: Básico 1,99 € / 24 h, Pro 6,99 € / 7 días, Premium 19,99 € / 30 días.
- Alquilaap Pro (tiendas): 24,99 €/mes, ranking por delante de los anuncios gratuitos, sello «Tienda Pro», reserva inmediata.
- Seguro opcional de aseguradora asociada (comisión por póliza, aseguradora pendiente).

## Confianza
1. Verificación obligatoria para publicar y reservar: nombre, DNI/NIE, fecha de nacimiento, teléfono, dirección, foto del documento y selfie.
2. Doble confirmación: al entregar, ambos marcan «alquilado»; al devolver, ambos marcan «finalizado» (certifica devolución en buen estado).
3. Botón «Hay un problema» abre una incidencia y congela la reserva.
4. Reseñas solo después de que ambos marquen «finalizado».

## Estados de una reserva
`requested → accepted → in_progress → completed`, con salidas `declined`, `cancelled`, `expired` e `incident`.

## Fases
1. **Web (PWA)**: anuncios, búsqueda, reservas con doble confirmación, verificación, reseñas, packs y Pro con Stripe.
2. **Apps móviles** (Expo) sobre la misma API `/api/v1`.
3. Seguro integrado, alertas de búsqueda, contratos automáticos, PostGIS para búsqueda por radio.

## Principios técnicos
- Migraciones expand/contract (sin cortes), API versionada `/api/v1`.
- Webhooks de Stripe idempotentes (tabla de eventos procesados) y cabecera `Idempotency-Key` en operaciones de pago.
- Bloqueo optimista en reservas (`version`) y restricción de no solapamiento en base de datos.

`schema-objetivo.sql` es el esquema completo de destino (con PostGIS). La fase 1 implementa un subconjunto en `web/prisma/schema.prisma`.
