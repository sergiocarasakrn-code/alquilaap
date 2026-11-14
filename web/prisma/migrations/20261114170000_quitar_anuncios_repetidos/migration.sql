-- Anuncios publicados varias veces por error (mismo usuario, título y descripción, con menos de 30 minutos entre ellos).
-- Se deja el más antiguo y los demás pasan a «deleted» (borrado suave: siguen en la base de datos y se pueden recuperar).
-- No se toca ninguno que tenga reservas o conversaciones.
UPDATE "Listing" AS l
SET "status" = 'deleted'
WHERE l."status" <> 'deleted'
  AND EXISTS (
    SELECT 1 FROM "Listing" AS o
    WHERE o."ownerId" = l."ownerId"
      AND o."title" = l."title"
      AND o."description" = l."description"
      AND o."status" <> 'deleted'
      AND o."createdAt" < l."createdAt"
      AND l."createdAt" - o."createdAt" < INTERVAL '30 minutes'
  )
  AND NOT EXISTS (SELECT 1 FROM "Booking" b WHERE b."listingId" = l."id")
  AND NOT EXISTS (SELECT 1 FROM "Conversation" c WHERE c."listingId" = l."id");
