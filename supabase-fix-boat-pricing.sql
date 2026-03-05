-- Migration: Change boat services from flat to per_person pricing
-- The lancha/boat services should charge per seat, not a flat group rate.
-- Run this in the Supabase SQL Editor.

-- Bahia — Anchor & Chill: was flat S/1,200 for 7 people
UPDATE services SET pricing_model = 'per_person' WHERE id = 'b1000000-0000-0000-0000-000000000004';

-- El Camotal — Anchor: was flat S/1,500 for 7 people
UPDATE services SET pricing_model = 'per_person' WHERE id = 'b1000000-0000-0000-0000-000000000005';

-- San Lorenzo Island: was flat S/2,000 for 7 people
UPDATE services SET pricing_model = 'per_person' WHERE id = 'b1000000-0000-0000-0000-000000000006';

-- Velero Experience: was flat S/3,000 for 8 people
UPDATE services SET pricing_model = 'per_person' WHERE id = 'b1000000-0000-0000-0000-000000000009';

-- NOTE: The price_pen column now represents the PER-PERSON price.
-- Adjust the amounts below if needed (currently using the old flat rate as-is).
-- To set new per-person prices, uncomment and edit:
--
-- UPDATE services SET price_pen = 200 WHERE id = 'b1000000-0000-0000-0000-000000000004';  -- Anchor & Chill
-- UPDATE services SET price_pen = 250 WHERE id = 'b1000000-0000-0000-0000-000000000005';  -- Camotal Anchor
-- UPDATE services SET price_pen = 300 WHERE id = 'b1000000-0000-0000-0000-000000000006';  -- San Lorenzo
-- UPDATE services SET price_pen = 400 WHERE id = 'b1000000-0000-0000-0000-000000000009';  -- Velero
