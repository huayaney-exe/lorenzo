-- Migration: Add slug column to services table
-- Run this in the Supabase SQL Editor
-- Safe to run multiple times (idempotent)

-- 1. Add slug column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'slug'
  ) THEN
    ALTER TABLE services ADD COLUMN slug TEXT;
  END IF;
END $$;

-- 2. Populate slugs from English name (matches toSlug() in booking-data.ts)
--    Logic: lowercase, strip diacritics, replace non-alphanumeric with hyphens, trim hyphens
UPDATE services
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      TRANSLATE(name_en,
        'ÁÉÍÓÚáéíóúÑñÀÈÌÒÙàèìòù',
        'AEIOUaeiouNnAEIOUaeiou'
      ),
      '[^a-zA-Z0-9]+', '-', 'g'
    ),
    '^-|-$', '', 'g'
  )
)
WHERE slug IS NULL OR slug = '';

-- 3. Make slug NOT NULL and add unique index
ALTER TABLE services ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_services_slug ON services (slug);
