-- Lorenzo Platform — Supabase Migration
-- Run this entire file in the Supabase SQL Editor.
-- This is the PRODUCTION migration — real data only, no demos.

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Tables

-- Resources
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity >= 1),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resources_active ON resources (active);

-- Coaches
CREATE TABLE IF NOT EXISTS coaches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operator')) DEFAULT 'operator',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coaches_active ON coaches (active);

-- Services
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_es TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('paddle', 'boat', 'event', 'alliance', 'other')) DEFAULT 'other',
  resource_id UUID REFERENCES resources (id) ON DELETE RESTRICT,
  pricing_model TEXT NOT NULL CHECK (pricing_model IN ('per_person', 'flat')) DEFAULT 'per_person',
  price_pen NUMERIC(10, 2) NOT NULL CHECK (price_pen >= 0),
  max_spots INTEGER NOT NULL CHECK (max_spots >= 1),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 15),
  is_addon BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_services_active ON services (active);
CREATE INDEX IF NOT EXISTS idx_services_resource ON services (resource_id);
CREATE INDEX IF NOT EXISTS idx_services_type ON services (type);
CREATE INDEX IF NOT EXISTS idx_services_is_addon ON services (is_addon);
CREATE UNIQUE INDEX IF NOT EXISTS idx_services_slug ON services (slug);

-- Service Schedules
CREATE TABLE IF NOT EXISTS service_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services (id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_schedules_service ON service_schedules (service_id);
CREATE INDEX IF NOT EXISTS idx_schedules_service_day ON service_schedules (service_id, day_of_week);

-- Sessions (materialized from schedules when a booking is placed)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services (id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 15),
  max_spots INTEGER NOT NULL CHECK (max_spots >= 1),
  price_pen NUMERIC(10, 2) NOT NULL CHECK (price_pen >= 0),
  coach_id UUID REFERENCES coaches (id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'cancelled')) DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_service ON sessions (service_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions (date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions (status);
CREATE INDEX IF NOT EXISTS idx_sessions_coach ON sessions (coach_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date_status ON sessions (date, status);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions (id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  seats INTEGER NOT NULL CHECK (seats >= 1),
  total_pen NUMERIC(10, 2) NOT NULL CHECK (total_pen >= 0),
  addons UUID[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  lang TEXT NOT NULL CHECK (lang IN ('es', 'en')) DEFAULT 'es',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_session ON bookings (session_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings (created_at DESC);

-- 3. Updated-At Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_resources_updated_at') THEN
    CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_coaches_updated_at') THEN
    CREATE TRIGGER update_coaches_updated_at BEFORE UPDATE ON coaches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_services_updated_at') THEN
    CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sessions_updated_at') THEN
    CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_bookings_updated_at') THEN
    CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 4. Resource Overlap Check Function
CREATE OR REPLACE FUNCTION check_resource_overlap(
  p_resource_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_duration_minutes INTEGER,
  p_exclude_session_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  p_end_time TIME;
  conflict_count INTEGER;
BEGIN
  p_end_time := p_start_time + (p_duration_minutes || ' minutes')::INTERVAL;

  SELECT COUNT(*) INTO conflict_count
  FROM sessions s
  JOIN services svc ON s.service_id = svc.id
  WHERE svc.resource_id = p_resource_id
    AND s.date = p_date
    AND s.status = 'scheduled'
    AND (p_exclude_session_id IS NULL OR s.id != p_exclude_session_id)
    AND s.time < p_end_time
    AND (s.time + (s.duration_minutes || ' minutes')::INTERVAL)::TIME > p_start_time;

  RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

-- 5. Availability View
CREATE OR REPLACE VIEW sessions_with_availability AS
SELECT
  s.*,
  svc.name_es AS service_name_es,
  svc.name_en AS service_name_en,
  svc.type AS service_type,
  svc.pricing_model,
  svc.resource_id,
  svc.is_addon,
  r.name AS resource_name,
  r.capacity AS resource_capacity,
  c.name AS coach_name,
  COALESCE(ba.booked_spots, 0) AS booked_spots,
  s.max_spots - COALESCE(ba.booked_spots, 0) AS available_spots,
  CASE
    WHEN s.max_spots > 0
    THEN ROUND((COALESCE(ba.booked_spots, 0)::NUMERIC / s.max_spots) * 100)
    ELSE 0
  END AS occupation_pct
FROM sessions s
JOIN services svc ON s.service_id = svc.id
LEFT JOIN resources r ON svc.resource_id = r.id
LEFT JOIN coaches c ON s.coach_id = c.id
LEFT JOIN (
  SELECT
    session_id,
    SUM(seats) AS booked_spots
  FROM bookings
  WHERE status != 'rejected'
  GROUP BY session_id
) ba ON s.id = ba.session_id;

-- 6. Max-Spots Constraint Check
CREATE OR REPLACE FUNCTION check_service_max_spots()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.resource_id IS NOT NULL THEN
    IF NEW.max_spots > (SELECT capacity FROM resources WHERE id = NEW.resource_id) THEN
      RAISE EXCEPTION 'max_spots (%) exceeds resource capacity (%)',
        NEW.max_spots,
        (SELECT capacity FROM resources WHERE id = NEW.resource_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'check_service_capacity') THEN
    CREATE TRIGGER check_service_capacity BEFORE INSERT OR UPDATE ON services FOR EACH ROW EXECUTE FUNCTION check_service_max_spots();
  END IF;
END $$;

-- 7. Atomic Booking Creation (prevents race conditions)
CREATE OR REPLACE FUNCTION create_booking_atomic(
  p_session_id UUID,
  p_name TEXT,
  p_phone TEXT,
  p_seats INTEGER,
  p_total_pen NUMERIC(10, 2),
  p_addons UUID[],
  p_lang TEXT
)
RETURNS UUID AS $$
DECLARE
  v_max_spots INTEGER;
  v_booked INTEGER;
  v_available INTEGER;
  v_booking_id UUID;
BEGIN
  -- Lock the session row to prevent concurrent reads
  SELECT max_spots INTO v_max_spots
  FROM sessions
  WHERE id = p_session_id AND status = 'scheduled'
  FOR UPDATE;

  IF v_max_spots IS NULL THEN
    RAISE EXCEPTION 'Session not found or cancelled';
  END IF;

  -- Calculate current bookings (within the lock)
  SELECT COALESCE(SUM(seats), 0) INTO v_booked
  FROM bookings
  WHERE session_id = p_session_id AND status != 'rejected';

  v_available := v_max_spots - v_booked;

  IF v_available < p_seats THEN
    RAISE EXCEPTION 'Not enough spots: % available, % requested', v_available, p_seats;
  END IF;

  -- Insert the booking
  INSERT INTO bookings (session_id, name, phone, seats, total_pen, addons, status, lang)
  VALUES (p_session_id, p_name, p_phone, p_seats, p_total_pen, p_addons, 'pending', p_lang)
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql;

-- 8. Add slug column if missing (safe for existing databases)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'slug') THEN
    ALTER TABLE services ADD COLUMN slug TEXT;
    UPDATE services SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name_en, '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', '', 'g')) WHERE slug IS NULL;
    ALTER TABLE services ALTER COLUMN slug SET NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_services_slug ON services (slug);
  END IF;
END $$;

-- 8. Production Seed Data

-- Resources
INSERT INTO resources (id, name, capacity) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Lancha 1', 7),
  ('a1000000-0000-0000-0000-000000000002', 'SUP Boards', 6),
  ('a1000000-0000-0000-0000-000000000003', 'SUP Grupal', 5),
  ('a1000000-0000-0000-0000-000000000004', 'Velero Michele', 8)
ON CONFLICT (id) DO NOTHING;

-- Coaches
INSERT INTO coaches (id, name, phone, role) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Franco Marsano', '+51944629513', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Services
INSERT INTO services (id, slug, name_es, name_en, description_es, description_en, type, resource_id, pricing_model, price_pen, max_spots, duration_minutes, is_addon) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'paddle-bahia', 'Paddle Bahia', 'Bay Paddle', 'Paddle en la bahia de La Punta.', 'Paddle in the bay of La Punta.', 'paddle', 'a1000000-0000-0000-0000-000000000002', 'per_person', 130, 6, 90, false),
  ('b1000000-0000-0000-0000-000000000002', 'paddle-camotal', 'Paddle Camotal', 'Camotal Paddle', 'Paddle hasta El Camotal.', 'Paddle to El Camotal.', 'paddle', 'a1000000-0000-0000-0000-000000000002', 'per_person', 150, 6, 120, false),
  ('b1000000-0000-0000-0000-000000000003', 'paddle-grupal', 'Paddle Grupal', 'Group Paddle', 'Sesion grupal de paddle.', 'Group paddle session.', 'paddle', 'a1000000-0000-0000-0000-000000000003', 'flat', 500, 5, 90, false),
  ('b1000000-0000-0000-0000-000000000004', 'anchor-chill', 'Bahia — Anchor & Chill', 'Bay — Anchor & Chill', 'Paseo en lancha por la bahia con ancla.', 'Boat trip with anchoring in the bay.', 'boat', 'a1000000-0000-0000-0000-000000000001', 'flat', 1200, 7, 180, false),
  ('b1000000-0000-0000-0000-000000000005', 'camotal-anchor', 'El Camotal — Anchor', 'El Camotal — Anchor', 'Viaje a El Camotal con ancla.', 'Trip to El Camotal with anchoring.', 'boat', 'a1000000-0000-0000-0000-000000000001', 'flat', 1500, 7, 240, false),
  ('b1000000-0000-0000-0000-000000000006', 'san-lorenzo', 'San Lorenzo Island', 'San Lorenzo Island', 'Excursion a la Isla San Lorenzo.', 'Excursion to San Lorenzo Island.', 'boat', 'a1000000-0000-0000-0000-000000000001', 'flat', 2000, 7, 300, false),
  ('b1000000-0000-0000-0000-000000000007', 'wakeboard-toys', 'Wakeboard / Toys', 'Wakeboard / Toys', 'Wakeboard y juegos acuaticos.', 'Wakeboard and water toys.', 'boat', 'a1000000-0000-0000-0000-000000000001', 'per_person', 80, 7, 30, true),
  ('b1000000-0000-0000-0000-000000000008', 'palomino', 'Palomino Island', 'Palomino Island', 'Tour a las Islas Palomino.', 'Tour to Palomino Islands.', 'alliance', NULL, 'per_person', 120, 30, 180, false),
  ('b1000000-0000-0000-0000-000000000009', 'velero', 'Velero Experience', 'Sailboat Experience', 'Experiencia en velero con Michele.', 'Sailboat experience with Michele.', 'alliance', 'a1000000-0000-0000-0000-000000000004', 'flat', 3000, 8, 240, false)
ON CONFLICT (id) DO NOTHING;

-- Service Schedules (weekly availability windows)
INSERT INTO service_schedules (service_id, day_of_week, start_time, end_time) VALUES
  -- Paddle Bahia: Mon, Wed, Fri 07:00-17:00, Sat 07:00-14:00
  ('b1000000-0000-0000-0000-000000000001', 1, '07:00', '17:00'),
  ('b1000000-0000-0000-0000-000000000001', 3, '07:00', '17:00'),
  ('b1000000-0000-0000-0000-000000000001', 5, '07:00', '17:00'),
  ('b1000000-0000-0000-0000-000000000001', 6, '07:00', '14:00'),
  -- Paddle Camotal: Sat-Sun 08:00-14:00
  ('b1000000-0000-0000-0000-000000000002', 6, '08:00', '14:00'),
  ('b1000000-0000-0000-0000-000000000002', 0, '08:00', '14:00'),
  -- Bahia Anchor & Chill: Sat-Sun 09:00-17:00
  ('b1000000-0000-0000-0000-000000000004', 6, '09:00', '17:00'),
  ('b1000000-0000-0000-0000-000000000004', 0, '09:00', '17:00'),
  -- El Camotal Anchor: Sat 08:00-16:00
  ('b1000000-0000-0000-0000-000000000005', 6, '08:00', '16:00'),
  -- Palomino Island: Sat-Sun 08:30-15:00
  ('b1000000-0000-0000-0000-000000000008', 6, '08:30', '15:00'),
  ('b1000000-0000-0000-0000-000000000008', 0, '08:30', '15:00');
