-- Alquilaap · esquema PostgreSQL 16 (+ PostGIS, btree_gist)
-- Importes en céntimos (integer). Fechas y horas en UTC.
-- Modelo: Alquilaap NO cobra ni retiene alquileres ni fianzas (se pagan entre usuarios).
-- Stripe solo cobra los packs de visibilidad.
-- Reglas de evolución: solo cambios aditivos (expand/contract). Nunca renombrar ni borrar
-- una columna en el mismo despliegue que deja de usarla.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ===================== Users =====================
CREATE TYPE kyc_status AS ENUM ('none','pending','verified','rejected');

CREATE TABLE users (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email               citext UNIQUE NOT NULL,
  email_verified_at   timestamptz,
  phone               text UNIQUE,
  phone_verified_at   timestamptz,
  display_name        text NOT NULL,
  avatar_url          text,
  bio                 text,
  city                text,
  home_location       geography(Point,4326),
  kyc_status          kyc_status NOT NULL DEFAULT 'none',
  kyc_provider_ref    text,                 -- id de sesión de Stripe Identity / Veriff
  legal_name          text,                 -- datos privados: nunca se muestran a otros usuarios
  id_number_hash      text,                 -- DNI/NIE cifrado (pgcrypto); solo se descifra ante denuncia
  birth_date          date,
  address             text,
  stripe_customer_id  text UNIQUE,          -- para comprar packs
  rating_avg          numeric(2,1),
  rating_count        integer NOT NULL DEFAULT 0,
  locale              text NOT NULL DEFAULT 'es',
  created_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz
);

CREATE TABLE auth_identities (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id),
  provider      text NOT NULL CHECK (provider IN ('email','google','apple')),
  provider_uid  text NOT NULL,
  UNIQUE (provider, provider_uid)
);

-- ===================== Categories =====================
CREATE TABLE categories (
  id          serial PRIMARY KEY,
  parent_id   integer REFERENCES categories(id),
  slug        text UNIQUE NOT NULL,       -- 'bicicletas', 'herramientas'…
  name_es     text NOT NULL,
  name_en     text,
  icon        text,
  sort_order  integer NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true
);

-- ===================== Products (anuncios) =====================
CREATE TYPE product_status AS ENUM ('draft','active','paused','removed');

CREATE TABLE products (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id          uuid NOT NULL REFERENCES users(id),
  category_id       integer NOT NULL REFERENCES categories(id),
  title             text NOT NULL CHECK (char_length(title) BETWEEN 5 AND 80),
  description       text NOT NULL,
  price_day_cents   integer NOT NULL CHECK (price_day_cents > 0),
  price_week_cents  integer CHECK (price_week_cents > 0),
  deposit_cents     integer NOT NULL DEFAULT 0 CHECK (deposit_cents >= 0),
  currency          char(3) NOT NULL DEFAULT 'EUR',
  location          geography(Point,4326) NOT NULL,  -- punto real (privado)
  location_public   geography(Point,4326) NOT NULL,  -- punto desplazado ~300 m (se muestra)
  postal_code       text,
  city              text NOT NULL,
  instant_booking   boolean NOT NULL DEFAULT false,
  min_days          smallint NOT NULL DEFAULT 1,
  status            product_status NOT NULL DEFAULT 'active',
  views_count       integer NOT NULL DEFAULT 0,
  search_tsv        tsvector GENERATED ALWAYS AS (
                      to_tsvector('spanish', coalesce(title,'') || ' ' || coalesce(description,''))) STORED,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_geo_idx    ON products USING gist (location_public);
CREATE INDEX products_search_idx ON products USING gin (search_tsv);
CREATE INDEX products_cat_idx    ON products (category_id, status);

CREATE TABLE product_photos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         text NOT NULL,
  position    smallint NOT NULL DEFAULT 0
);

CREATE TABLE availability_blocks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  during      daterange NOT NULL,
  EXCLUDE USING gist (product_id WITH =, during WITH &&)
);

-- ===================== Visibility packs =====================
CREATE TABLE visibility_packs (
  id              serial PRIMARY KEY,
  code            text UNIQUE NOT NULL,        -- 'basico', 'pro', 'premium'
  name            text NOT NULL,
  price_cents     integer NOT NULL,
  duration_hours  integer NOT NULL,
  rank_boost      smallint NOT NULL,           -- 1, 2, 3: orden en búsquedas
  on_homepage     boolean NOT NULL DEFAULT false,
  owner_badge     boolean NOT NULL DEFAULT false,
  perks           jsonb NOT NULL DEFAULT '[]',
  active          boolean NOT NULL DEFAULT true
);
INSERT INTO visibility_packs (code,name,price_cents,duration_hours,rank_boost,on_homepage,owner_badge) VALUES
  ('basico','Destacado 24 h',199,24,1,false,false),
  ('pro','Pro 7 días',699,168,2,true,false),
  ('premium','Premium 30 días',1999,720,3,true,true);

CREATE TYPE purchase_status AS ENUM ('pending','paid','refunded','failed');

CREATE TABLE pack_purchases (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id                uuid NOT NULL REFERENCES products(id),
  buyer_id                  uuid NOT NULL REFERENCES users(id),
  pack_id                   integer NOT NULL REFERENCES visibility_packs(id),
  price_cents               integer NOT NULL,          -- precio congelado al comprar
  starts_at                 timestamptz,
  ends_at                   timestamptz,
  status                    purchase_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id  text UNIQUE,
  created_at                timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pack_active_idx ON pack_purchases (product_id, ends_at) WHERE status = 'paid';

-- ===================== Bookings =====================
CREATE TYPE booking_status AS ENUM
  ('requested','accepted','in_progress','completed','incident',
   'declined','cancelled','expired','disputed');

CREATE TABLE bookings (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id                uuid NOT NULL REFERENCES products(id),
  renter_id                 uuid NOT NULL REFERENCES users(id),
  owner_id                  uuid NOT NULL REFERENCES users(id),
  start_date                date NOT NULL,
  end_date                  date NOT NULL CHECK (end_date >= start_date),
  days                      smallint NOT NULL,
  subtotal_cents            integer NOT NULL,   -- importe acordado (se paga en mano)
  deposit_cents             integer NOT NULL,   -- fianza informativa (se paga en mano)
  status                    booking_status NOT NULL DEFAULT 'requested',
  version                   integer NOT NULL DEFAULT 0,  -- bloqueo optimista
  -- Doble confirmación: los dos marcan alquilado (in_progress) y los dos finalizado (completed)
  owner_picked_up_at        timestamptz,
  renter_picked_up_at       timestamptz,
  owner_returned_ok_at      timestamptz,   -- certifica: recibido en perfectas condiciones
  renter_returned_ok_at     timestamptz,
  incident_reason           text,
  incident_opened_by        uuid REFERENCES users(id),
  insurance_cents           integer NOT NULL DEFAULT 0,   -- seguro opcional (aseguradora asociada)
  insurance_policy_ref      text,
  pickup_photos             jsonb NOT NULL DEFAULT '[]',
  return_photos             jsonb NOT NULL DEFAULT '[]',
  accepted_at               timestamptz,
  picked_up_at              timestamptz,
  completed_at              timestamptz,
  created_at                timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT no_overlap EXCLUDE USING gist (
    product_id WITH =, daterange(start_date, end_date, '[]') WITH &&
  ) WHERE (status IN ('accepted','in_progress'))
);
CREATE INDEX bookings_renter_idx ON bookings (renter_id, created_at DESC);
CREATE INDEX bookings_owner_idx  ON bookings (owner_id, status);

-- Historial inmutable de cambios de estado (auditoría y reconstrucción)
CREATE TABLE booking_events (
  id          bigserial PRIMARY KEY,
  booking_id  uuid NOT NULL REFERENCES bookings(id),
  from_status booking_status,
  to_status   booking_status NOT NULL,
  actor_id    uuid REFERENCES users(id),   -- null = sistema / webhook
  source      text NOT NULL,               -- 'api', 'stripe_webhook', 'scheduler'
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ===================== Pagos e idempotencia =====================
CREATE TABLE payments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_purchase_id  uuid REFERENCES pack_purchases(id),
  subscription_id   uuid,
  kind              text NOT NULL CHECK (kind IN ('pack_charge','subscription_charge','refund')),
  amount_cents      integer NOT NULL,
  stripe_object_id  text UNIQUE NOT NULL,
  status            text NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE stripe_events (
  id            text PRIMARY KEY,           -- evt_… : cada evento se procesa una vez
  type          text NOT NULL,
  payload       jsonb NOT NULL,
  processed_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE idempotency_keys (
  key           uuid PRIMARY KEY,           -- cabecera Idempotency-Key del cliente
  user_id       uuid NOT NULL REFERENCES users(id),
  request_hash  text NOT NULL,
  response      jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);


-- ===================== Suscripción Pro (tiendas y profesionales) =====================
CREATE TABLE subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES users(id),
  plan                    text NOT NULL DEFAULT 'pro',          -- 24,99 EUR/mes
  status                  text NOT NULL CHECK (status IN ('active','past_due','canceled')),
  current_period_end      timestamptz NOT NULL,
  stripe_subscription_id  text UNIQUE NOT NULL,
  created_at              timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX subscriptions_active_idx ON subscriptions (user_id) WHERE status = 'active';
-- Ranking: boost = max(pack activo, 1.5 si el propietario tiene Pro activo). Pro = reserva inmediata.

-- ===================== Páginas SEO por categoría y ciudad =====================
CREATE TABLE seo_pages (
  id           serial PRIMARY KEY,
  category_id  integer NOT NULL REFERENCES categories(id),
  city         text NOT NULL,
  slug         text UNIQUE NOT NULL,        -- 'alquilar/bicicletas/barcelona'
  title        text NOT NULL,
  meta_desc    text NOT NULL,
  listings     integer NOT NULL DEFAULT 0,  -- se indexa solo si > 0
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, city)
);

-- ===================== Confianza =====================
CREATE TABLE reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid NOT NULL REFERENCES bookings(id),
  author_id   uuid NOT NULL REFERENCES users(id),
  target_id   uuid NOT NULL REFERENCES users(id),
  role        text NOT NULL CHECK (role IN ('renter_to_owner','owner_to_renter')),
  stars       smallint NOT NULL CHECK (stars BETWEEN 1 AND 5),
  body        text,
  visible_at  timestamptz,                  -- se publican las dos a la vez o a los 14 días
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id, role)
);

CREATE TABLE message_threads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES products(id),
  renter_id   uuid NOT NULL REFERENCES users(id),
  owner_id    uuid NOT NULL REFERENCES users(id),
  UNIQUE (product_id, renter_id)
);
CREATE TABLE messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id   uuid NOT NULL REFERENCES message_threads(id),
  sender_id   uuid REFERENCES users(id),    -- null = mensaje del sistema
  body        text NOT NULL,
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ===================== Búsqueda con ranking por packs =====================
-- $1 lng, $2 lat, $3 radio en metros, $4 texto, $5 categoría
-- SELECT p.*, ST_Distance(p.location_public, ST_MakePoint($1,$2)::geography) AS dist_m,
--        coalesce(max(vp.rank_boost) FILTER (WHERE pp.ends_at > now()), 0) AS boost
-- FROM products p
-- LEFT JOIN pack_purchases pp ON pp.product_id = p.id AND pp.status = 'paid'
-- LEFT JOIN visibility_packs vp ON vp.id = pp.pack_id
-- WHERE p.status = 'active'
--   AND ST_DWithin(p.location_public, ST_MakePoint($1,$2)::geography, $3)
--   AND ($4 IS NULL OR p.search_tsv @@ plainto_tsquery('spanish', $4))
--   AND ($5 IS NULL OR p.category_id = $5)
-- GROUP BY p.id
-- ORDER BY boost DESC, dist_m ASC
-- LIMIT 40;
