-- =============================================
-- RLS Policies: Add INSERT/UPDATE/DELETE for all settings tables
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- =============================================

DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'units', 'instruments', 'parameters', 'methods', 'sample_matrices',
        'customers', 'test_packages', 'departments', 'matrix_parameter_rules',
        'price_list', 'users', 'test_package_items',
        'customer_contacts', 'analyst_profiles', 'analyst_competencies', 'analyst_certificates'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        -- DROP existing policies if they exist (safe re-run)
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated insert %s" ON %I', tbl, tbl);
            EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated update %s" ON %I', tbl, tbl);
            EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated delete %s" ON %I', tbl, tbl);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;

        -- Create INSERT policy
        EXECUTE format('CREATE POLICY "Allow authenticated insert %s" ON %I FOR INSERT TO authenticated WITH CHECK (true)', tbl, tbl);
        -- Create UPDATE policy
        EXECUTE format('CREATE POLICY "Allow authenticated update %s" ON %I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', tbl, tbl);
        -- Create DELETE policy
        EXECUTE format('CREATE POLICY "Allow authenticated delete %s" ON %I FOR DELETE TO authenticated USING (true)', tbl, tbl);

        RAISE NOTICE 'Added INSERT/UPDATE/DELETE policies for %', tbl;
    END LOOP;
END $$;
