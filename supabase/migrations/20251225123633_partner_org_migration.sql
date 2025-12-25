-- ============================================================================
-- MIGRATION: Partner Migration - Project Level → Organisation Level
-- Complete migration in correct dependency order
-- ============================================================================

-- STEP 1: Add organisation_id column (nullable initially)
ALTER TABLE partners 
ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);

-- STEP 2: Populate organisation_id from project's organisation
UPDATE partners p
SET organisation_id = proj.organisation_id
FROM projects proj
WHERE p.project_id = proj.id
AND p.organisation_id IS NULL;

-- STEP 3: Handle duplicates - merge partners with same name in same org
DO $$
DECLARE
    dup RECORD;
    keep_id UUID;
    delete_ids UUID[];
BEGIN
    FOR dup IN 
        SELECT organisation_id, name, array_agg(id ORDER BY created_at ASC) as partner_ids
        FROM partners
        WHERE organisation_id IS NOT NULL
        GROUP BY organisation_id, name
        HAVING COUNT(*) > 1
    LOOP
        keep_id := dup.partner_ids[1];
        delete_ids := dup.partner_ids[2:];
        
        UPDATE resources SET partner_id = keep_id WHERE partner_id = ANY(delete_ids);
        UPDATE partner_invoices SET partner_id = keep_id WHERE partner_id = ANY(delete_ids);
        DELETE FROM partners WHERE id = ANY(delete_ids);
        
        RAISE NOTICE 'Merged partner "%" - kept %, deleted %', dup.name, keep_id, delete_ids;
    END LOOP;
END $$;

-- STEP 4: Make organisation_id NOT NULL
ALTER TABLE partners 
ALTER COLUMN organisation_id SET NOT NULL;

-- STEP 5: Drop dependent view FIRST
DROP VIEW IF EXISTS active_partners;

-- STEP 6: Drop ALL old RLS policies that reference project_id
DROP POLICY IF EXISTS partner_invoices_insert_policy ON partner_invoices;
DROP POLICY IF EXISTS partner_invoices_update_policy ON partner_invoices;
DROP POLICY IF EXISTS partner_invoices_delete_policy ON partner_invoices;
DROP POLICY IF EXISTS partner_invoices_select_policy ON partner_invoices;
DROP POLICY IF EXISTS partner_invoice_lines_insert_policy ON partner_invoice_lines;
DROP POLICY IF EXISTS partner_invoice_lines_update_policy ON partner_invoice_lines;
DROP POLICY IF EXISTS partner_invoice_lines_delete_policy ON partner_invoice_lines;
DROP POLICY IF EXISTS partner_invoice_lines_select_policy ON partner_invoice_lines;
DROP POLICY IF EXISTS partners_select_policy ON partners;
DROP POLICY IF EXISTS partners_insert_policy ON partners;
DROP POLICY IF EXISTS partners_update_policy ON partners;
DROP POLICY IF EXISTS partners_delete_policy ON partners;
DROP POLICY IF EXISTS "Users can view partners in their projects" ON partners;
DROP POLICY IF EXISTS "Admin and Supplier PM can insert partners" ON partners;
DROP POLICY IF EXISTS "Admin and Supplier PM can update partners" ON partners;
DROP POLICY IF EXISTS "Admin can delete partners" ON partners;

-- STEP 7: Now drop project_id column
ALTER TABLE partners DROP COLUMN IF EXISTS project_id;

-- STEP 8: Create index for organisation_id
CREATE INDEX IF NOT EXISTS idx_partners_organisation_id ON partners(organisation_id);

-- STEP 9: Create new organisation-based RLS policies for partners
CREATE POLICY "partners_select_policy"
ON partners FOR SELECT TO authenticated
USING (organisation_id IN (SELECT organisation_id FROM user_organisations WHERE user_id = auth.uid()));

CREATE POLICY "partners_insert_policy"
ON partners FOR INSERT TO authenticated
WITH CHECK (organisation_id IN (SELECT organisation_id FROM user_organisations WHERE user_id = auth.uid() AND org_role = 'org_admin'));

CREATE POLICY "partners_update_policy"
ON partners FOR UPDATE TO authenticated
USING (organisation_id IN (SELECT organisation_id FROM user_organisations WHERE user_id = auth.uid() AND org_role = 'org_admin'))
WITH CHECK (organisation_id IN (SELECT organisation_id FROM user_organisations WHERE user_id = auth.uid() AND org_role = 'org_admin'));

CREATE POLICY "partners_delete_policy"
ON partners FOR DELETE TO authenticated
USING (organisation_id IN (SELECT organisation_id FROM user_organisations WHERE user_id = auth.uid() AND org_role = 'org_admin'));

-- STEP 10: Create partner_invoices RLS policies
CREATE POLICY "partner_invoices_select_policy"
ON partner_invoices FOR SELECT TO authenticated
USING (partner_id IN (SELECT p.id FROM partners p JOIN user_organisations uo ON p.organisation_id = uo.organisation_id WHERE uo.user_id = auth.uid()));

CREATE POLICY "partner_invoices_insert_policy"
ON partner_invoices FOR INSERT TO authenticated
WITH CHECK (partner_id IN (SELECT p.id FROM partners p JOIN user_organisations uo ON p.organisation_id = uo.organisation_id WHERE uo.user_id = auth.uid() AND uo.org_role = 'org_admin'));

CREATE POLICY "partner_invoices_update_policy"
ON partner_invoices FOR UPDATE TO authenticated
USING (partner_id IN (SELECT p.id FROM partners p JOIN user_organisations uo ON p.organisation_id = uo.organisation_id WHERE uo.user_id = auth.uid() AND uo.org_role = 'org_admin'))
WITH CHECK (partner_id IN (SELECT p.id FROM partners p JOIN user_organisations uo ON p.organisation_id = uo.organisation_id WHERE uo.user_id = auth.uid() AND uo.org_role = 'org_admin'));

CREATE POLICY "partner_invoices_delete_policy"
ON partner_invoices FOR DELETE TO authenticated
USING (partner_id IN (SELECT p.id FROM partners p JOIN user_organisations uo ON p.organisation_id = uo.organisation_id WHERE uo.user_id = auth.uid() AND uo.org_role = 'org_admin'));

-- STEP 11: Create partner_invoice_lines RLS policies (uses invoice_id, not partner_invoice_id)
CREATE POLICY "partner_invoice_lines_select_policy"
ON partner_invoice_lines FOR SELECT TO authenticated
USING (invoice_id IN (SELECT pi.id FROM partner_invoices pi JOIN partners p ON pi.partner_id = p.id JOIN user_organisations uo ON p.organisation_id = uo.organisation_id WHERE uo.user_id = auth.uid()));

CREATE POLICY "partner_invoice_lines_insert_policy"
ON partner_invoice_lines FOR INSERT TO authenticated
WITH CHECK (invoice_id IN (SELECT pi.id FROM partner_invoices pi JOIN partners p ON pi.partner_id = p.id JOIN user_organisations uo ON p.organisation_id = uo.organisation_id WHERE uo.user_id = auth.uid() AND uo.org_role = 'org_admin'));

CREATE POLICY "partner_invoice_lines_update_policy"
ON partner_invoice_lines FOR UPDATE TO authenticated
USING (invoice_id IN (SELECT pi.id FROM partner_invoices pi JOIN partners p ON pi.partner_id = p.id JOIN user_organisations uo ON p.organisation_id = uo.organisation_id WHERE uo.user_id = auth.uid() AND uo.org_role = 'org_admin'))
WITH CHECK (invoice_id IN (SELECT pi.id FROM partner_invoices pi JOIN partners p ON pi.partner_id = p.id JOIN user_organisations uo ON p.organisation_id = uo.organisation_id WHERE uo.user_id = auth.uid() AND uo.org_role = 'org_admin'));

CREATE POLICY "partner_invoice_lines_delete_policy"
ON partner_invoice_lines FOR DELETE TO authenticated
USING (invoice_id IN (SELECT pi.id FROM partner_invoices pi JOIN partners p ON pi.partner_id = p.id JOIN user_organisations uo ON p.organisation_id = uo.organisation_id WHERE uo.user_id = auth.uid() AND uo.org_role = 'org_admin'));

-- STEP 12: Recreate active_partners view (now using organisation_id)
CREATE OR REPLACE VIEW active_partners AS
SELECT * FROM partners WHERE is_active = true;

-- STEP 13: Documentation
COMMENT ON TABLE partners IS 'Third-party partner companies at organisation level. Partners can be assigned to resources across any project in the organisation.';
