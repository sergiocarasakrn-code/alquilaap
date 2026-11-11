-- Garantías en la base de datos (no solo en la app):
-- 1) Un objeto no puede tener dos reservas activas que se solapen.
-- 2) Fechas y precios coherentes. 3) Valoraciones de 1 a 5.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
  ADD CONSTRAINT booking_dates_ok CHECK ("endDate" >= "startDate"),
  ADD CONSTRAINT booking_amounts_ok CHECK ("priceCents" >= 0 AND "depositCents" >= 0 AND "insuranceCents" >= 0 AND "days" > 0),
  ADD CONSTRAINT booking_no_overlap EXCLUDE USING gist (
    "listingId" WITH =,
    daterange("startDate", "endDate", '[]') WITH &&
  ) WHERE (status IN ('accepted', 'in_progress', 'incident'));

ALTER TABLE "Review" ADD CONSTRAINT review_rating_ok CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE "Listing" ADD CONSTRAINT listing_price_ok CHECK ("pricePerDayCents" > 0 AND "depositCents" >= 0);
