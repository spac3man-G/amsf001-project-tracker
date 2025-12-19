-- =====================================================
-- Receipt Scans Table & RLS Policies
-- Created: 19 December 2025
-- Purpose: Fix RLS for receipt scanning feature
-- =====================================================

-- Create receipt_scans table if it doesn't exist
CREATE TABLE IF NOT EXISTS receipt_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Upload info
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  image_url TEXT,
  image_path TEXT,
  
  -- Extracted data
  raw_ocr_text TEXT,
  extracted_merchant TEXT,
  extracted_amount DECIMAL(12,2),
  extracted_date DATE,
  extracted_currency TEXT DEFAULT 'GBP',
  extracted_items JSONB,
  
  -- AI classification
  ai_suggested_category TEXT,
  ai_confidence DECIMAL(3,2),
  final_category TEXT,
  user_corrected BOOLEAN DEFAULT FALSE,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'linked')),
  processing_time_ms INTEGER,
  error_message TEXT,
  
  -- Link to expense when created
  expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_receipt_scans_project_id ON receipt_scans(project_id);
CREATE INDEX IF NOT EXISTS idx_receipt_scans_uploaded_by ON receipt_scans(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_receipt_scans_expense_id ON receipt_scans(expense_id);
CREATE INDEX IF NOT EXISTS idx_receipt_scans_status ON receipt_scans(status);

-- Enable RLS
ALTER TABLE receipt_scans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "receipt_scans_select_policy" ON receipt_scans;
DROP POLICY IF EXISTS "receipt_scans_insert_policy" ON receipt_scans;
DROP POLICY IF EXISTS "receipt_scans_update_policy" ON receipt_scans;
DROP POLICY IF EXISTS "receipt_scans_delete_policy" ON receipt_scans;

-- SELECT: Any user with project access can view receipt scans
CREATE POLICY "receipt_scans_select_policy" ON receipt_scans 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = receipt_scans.project_id
      AND up.user_id = auth.uid()
    )
  );

-- INSERT: Any user with project access (except viewers) can create receipt scans
CREATE POLICY "receipt_scans_insert_policy" ON receipt_scans 
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = receipt_scans.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm', 'customer_pm', 'contributor')
    )
  );

-- UPDATE: User who uploaded or Admin/Supplier PM can update
CREATE POLICY "receipt_scans_update_policy" ON receipt_scans 
  FOR UPDATE TO authenticated 
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = receipt_scans.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );

-- DELETE: Admin only
CREATE POLICY "receipt_scans_delete_policy" ON receipt_scans 
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = receipt_scans.project_id
      AND up.user_id = auth.uid()
      AND up.role = 'admin'
    )
  );

-- =====================================================
-- Classification Rules Table (for learning from corrections)
-- =====================================================

CREATE TABLE IF NOT EXISTS classification_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Matching criteria
  merchant_pattern TEXT NOT NULL,
  
  -- Classification
  category TEXT NOT NULL,
  subcategory TEXT,
  default_chargeable BOOLEAN,
  default_procurement TEXT,
  
  -- Confidence tracking
  match_count INTEGER DEFAULT 1,
  correction_count INTEGER DEFAULT 0,
  confidence DECIMAL(3,2) DEFAULT 0.70,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, merchant_pattern)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_classification_rules_project_id ON classification_rules(project_id);
CREATE INDEX IF NOT EXISTS idx_classification_rules_merchant ON classification_rules(merchant_pattern);

-- Enable RLS
ALTER TABLE classification_rules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "classification_rules_select_policy" ON classification_rules;
DROP POLICY IF EXISTS "classification_rules_insert_policy" ON classification_rules;
DROP POLICY IF EXISTS "classification_rules_update_policy" ON classification_rules;
DROP POLICY IF EXISTS "classification_rules_delete_policy" ON classification_rules;

-- SELECT: Any project member can view rules
CREATE POLICY "classification_rules_select_policy" ON classification_rules 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = classification_rules.project_id
      AND up.user_id = auth.uid()
    )
  );

-- INSERT: Any project member (except viewers) can create rules
CREATE POLICY "classification_rules_insert_policy" ON classification_rules 
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = classification_rules.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm', 'customer_pm', 'contributor')
    )
  );

-- UPDATE: Any project member (except viewers) can update rules
CREATE POLICY "classification_rules_update_policy" ON classification_rules 
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = classification_rules.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm', 'customer_pm', 'contributor')
    )
  );

-- DELETE: Admin and Supplier PM only
CREATE POLICY "classification_rules_delete_policy" ON classification_rules 
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = classification_rules.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to find matching classification rule for a merchant
CREATE OR REPLACE FUNCTION find_classification_rule(
  p_project_id UUID,
  p_merchant TEXT
)
RETURNS TABLE(
  rule_id UUID,
  category TEXT,
  subcategory TEXT,
  default_chargeable BOOLEAN,
  default_procurement TEXT,
  confidence DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.id as rule_id,
    cr.category,
    cr.subcategory,
    cr.default_chargeable,
    cr.default_procurement,
    cr.confidence
  FROM classification_rules cr
  WHERE cr.project_id = p_project_id
    AND LOWER(p_merchant) LIKE '%' || LOWER(cr.merchant_pattern) || '%'
  ORDER BY cr.confidence DESC, cr.match_count DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upsert classification rule (learn from user corrections)
CREATE OR REPLACE FUNCTION upsert_classification_rule(
  p_project_id UUID,
  p_merchant TEXT,
  p_category TEXT,
  p_user_id UUID DEFAULT NULL,
  p_was_correction BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  v_rule_id UUID;
  v_merchant_pattern TEXT;
BEGIN
  -- Normalize merchant name for pattern matching
  v_merchant_pattern := LOWER(TRIM(p_merchant));
  
  -- Try to find existing rule
  SELECT id INTO v_rule_id
  FROM classification_rules
  WHERE project_id = p_project_id
    AND LOWER(merchant_pattern) = v_merchant_pattern;
  
  IF v_rule_id IS NOT NULL THEN
    -- Update existing rule
    UPDATE classification_rules
    SET 
      category = p_category,
      match_count = match_count + 1,
      correction_count = CASE WHEN p_was_correction THEN correction_count + 1 ELSE correction_count END,
      confidence = CASE 
        WHEN p_was_correction THEN LEAST(confidence + 0.05, 1.0)
        ELSE LEAST(confidence + 0.02, 1.0)
      END,
      updated_at = NOW()
    WHERE id = v_rule_id;
  ELSE
    -- Create new rule
    INSERT INTO classification_rules (
      project_id, merchant_pattern, category, created_by, confidence
    ) VALUES (
      p_project_id, v_merchant_pattern, p_category, COALESCE(p_user_id, auth.uid()), 0.70
    )
    RETURNING id INTO v_rule_id;
  END IF;
  
  RETURN v_rule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION find_classification_rule TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_classification_rule TO authenticated;
