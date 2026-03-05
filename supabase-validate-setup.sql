-- Validate Lorenzo database setup
-- Run in Supabase SQL Editor — review output for missing objects

-- 1. Tables
SELECT 'TABLES' AS section;
SELECT expected.name AS table_name,
  CASE WHEN t.table_name IS NOT NULL THEN 'OK' ELSE 'MISSING' END AS status
FROM (VALUES ('resources'), ('coaches'), ('services'), ('service_schedules'), ('sessions'), ('bookings')) AS expected(name)
LEFT JOIN information_schema.tables t
  ON t.table_name = expected.name AND t.table_schema = 'public';

-- 2. Views
SELECT 'VIEWS' AS section;
SELECT expected.name AS view_name,
  CASE WHEN v.viewname IS NOT NULL THEN 'OK' ELSE 'MISSING' END AS status
FROM (VALUES ('sessions_with_availability')) AS expected(name)
LEFT JOIN pg_views v ON v.viewname = expected.name AND v.schemaname = 'public';

-- 3. RPC Functions
SELECT 'FUNCTIONS' AS section;
SELECT expected.name AS function_name,
  CASE WHEN r.routine_name IS NOT NULL THEN 'OK' ELSE 'MISSING' END AS status
FROM (VALUES ('create_booking_atomic'), ('check_resource_overlap')) AS expected(name)
LEFT JOIN information_schema.routines r
  ON r.routine_name = expected.name AND r.routine_schema = 'public';

-- 4. Slug column on services
SELECT 'SLUG COLUMN' AS section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'services' AND column_name = 'slug';

-- 5. Key indexes
SELECT 'INDEXES' AS section;
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN ('idx_services_slug', 'idx_bookings_session_id', 'idx_sessions_service_date');

-- 6. Bookings table columns (verify addons, lang exist)
SELECT 'BOOKINGS COLUMNS' AS section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings'
ORDER BY ordinal_position;

-- 7. Sessions table columns
SELECT 'SESSIONS COLUMNS' AS section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sessions'
ORDER BY ordinal_position;

-- 8. Services data check
SELECT 'SERVICES DATA' AS section;
SELECT id, slug, name_es, pricing_model, price_pen, max_spots, active
FROM services
ORDER BY name_es;

-- 9. Test create_booking_atomic signature
SELECT 'RPC SIGNATURE' AS section;
SELECT p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'create_booking_atomic';

-- 10. Row counts
SELECT 'ROW COUNTS' AS section;
SELECT 'resources' AS tbl, count(*) FROM resources
UNION ALL SELECT 'coaches', count(*) FROM coaches
UNION ALL SELECT 'services', count(*) FROM services
UNION ALL SELECT 'service_schedules', count(*) FROM service_schedules
UNION ALL SELECT 'sessions', count(*) FROM sessions
UNION ALL SELECT 'bookings', count(*) FROM bookings;
