-- Migration: Create missing database objects (functions, views, triggers)
-- Run this in Supabase SQL Editor if booking fails with 400 error.
-- Safe to run multiple times (uses CREATE OR REPLACE).

-- 1. Resource overlap check function
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

-- 2. Sessions with availability view
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

-- 3. Max-spots constraint trigger
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

-- 4. Atomic booking creation (prevents race conditions)
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
