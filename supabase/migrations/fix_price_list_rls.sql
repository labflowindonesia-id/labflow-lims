-- =============================================
-- FIX: price_list RLS + test_package_items FK + RLS
-- Run this in Supabase SQL Editor
-- =============================================

-- ========== PART 1: price_list RLS ==========
DROP POLICY IF EXISTS "Allow authenticated insert price_list" ON price_list;
DROP POLICY IF EXISTS "Allow authenticated update price_list" ON price_list;
DROP POLICY IF EXISTS "Allow authenticated delete price_list" ON price_list;
DROP POLICY IF EXISTS "Allow authenticated select price_list" ON price_list;

ALTER TABLE price_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated select price_list" ON price_list FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert price_list" ON price_list FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update price_list" ON price_list FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete price_list" ON price_list FOR DELETE TO authenticated USING (true);

-- ========== PART 2: test_package_items RLS ==========
DROP POLICY IF EXISTS "Allow authenticated insert test_package_items" ON test_package_items;
DROP POLICY IF EXISTS "Allow authenticated update test_package_items" ON test_package_items;
DROP POLICY IF EXISTS "Allow authenticated delete test_package_items" ON test_package_items;
DROP POLICY IF EXISTS "Allow authenticated select test_package_items" ON test_package_items;

ALTER TABLE test_package_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated select test_package_items" ON test_package_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert test_package_items" ON test_package_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update test_package_items" ON test_package_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete test_package_items" ON test_package_items FOR DELETE TO authenticated USING (true);

-- ========== PART 3: Make instrument_id nullable ==========
-- instrument_id has a FK constraint but is NOT NULL, causing errors
-- when adding parameters without selecting an instrument
ALTER TABLE test_package_items ALTER COLUMN instrument_id DROP NOT NULL;
