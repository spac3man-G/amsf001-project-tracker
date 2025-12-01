-- =====================================================
-- P7: Smart Receipt Scanner Feature
-- =====================================================
-- Adds AI-powered receipt scanning with learning capabilities
-- 
-- @version 1.0
-- @created 2 December 2025
-- @author Claude AI Assistant
-- =====================================================

-- =====================================================
-- 1. RECEIPT SCANS TABLE
-- Stores scanned receipt data and AI extraction results
-- =====================================================

CREATE TABLE IF NOT EXISTS receipt_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Image storage
  image_url TEXT NOT NULL,
  image_path TEXT NOT NULL,  -- Supabase storage path
  
  -- Raw OCR/AI extraction
  raw_ocr_text TEXT,
  
  -- Extracted structured data
  extracted_merchant TEXT,
  extracted_amount DECIMAL(10,2),
  extracted_date DATE,
  extracted_currency TEXT DEFAULT 'GBP',
  extracted_items JSONB,  -- Line items if readable: [{name, qty, price}]
  
  -- Classification
  ai_suggested_category TEXT,
  ai_confidence DECIMAL(3,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  final_category TEXT,
  user_corrected BOOLEAN DEFAULT false,
  
  -- Processing status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'linked')),
  error_message TEXT,
  processing_time_ms INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX idx_receipt_scans_project ON receipt_scans(project_id);
CREATE INDEX idx_receipt_scans_user ON receipt_scans(uploaded_by);
CREATE INDEX idx_receipt_scans_status ON receipt_scans(status);
CREATE INDEX idx_receipt_scans_expense ON receipt_scans(expense_id);

-- =====================================================
-- 2. CLASSIFICATION RULES TABLE
-- Stores learned patterns from user corrections
-- =====================================================

CREATE TABLE IF NOT EXISTS classification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  
  -- Matching criteria (lowercase for matching)
  merchant_pattern TEXT NOT NULL,
  
  -- Classification result
  category TEXT NOT NULL CHECK (category IN ('Travel', 'Accommodation', 'Sustenance')),
  subcategory TEXT,
  
  -- Default values to apply
  default_chargeable BOOLEAN DEFAULT true,
  default_procurement TEXT DEFAULT 'supplier' CHECK (default_procurement IN ('supplier', 'partner')),
  
  -- Learning metadata
  match_count INTEGER DEFAULT 1,
  success_count INTEGER DEFAULT 1,  -- Times user accepted without edit
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- One rule per merchant pattern per project
  UNIQUE(project_id, merchant_pattern)
);

-- Index for pattern matching
CREATE INDEX idx_classification_rules_project ON classification_rules(project_id);
CREATE INDEX idx_classification_rules_pattern ON classification_rules(merchant_pattern);

-- =====================================================
-- 3. UPDATE TRIGGER FOR TIMESTAMPS
-- =====================================================

-- Receipt scans updated_at trigger
CREATE OR REPLACE FUNCTION update_receipt_scans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER receipt_scans_updated_at
  BEFORE UPDATE ON receipt_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_receipt_scans_updated_at();

-- Classification rules updated_at trigger
CREATE OR REPLACE FUNCTION update_classification_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER classification_rules_updated_at
  BEFORE UPDATE ON classification_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_classification_rules_updated_at();

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE receipt_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE classification_rules ENABLE ROW LEVEL SECURITY;

-- Receipt scans policies
-- Users can view scans in their project
CREATE POLICY "Users can view project receipt scans"
  ON receipt_scans FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_users WHERE user_id = auth.uid()
    )
  );

-- Users can insert their own scans
CREATE POLICY "Users can insert own receipt scans"
  ON receipt_scans FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

-- Users can update their own scans
CREATE POLICY "Users can update own receipt scans"
  ON receipt_scans FOR UPDATE
  USING (uploaded_by = auth.uid());

-- Users can delete their own scans
CREATE POLICY "Users can delete own receipt scans"
  ON receipt_scans FOR DELETE
  USING (uploaded_by = auth.uid());

-- Classification rules policies
-- Users can view rules in their project
CREATE POLICY "Users can view project classification rules"
  ON classification_rules FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_users WHERE user_id = auth.uid()
    )
  );

-- Users can insert rules for their project
CREATE POLICY "Users can insert classification rules"
  ON classification_rules FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_users WHERE user_id = auth.uid()
    )
  );

-- Users can update rules in their project
CREATE POLICY "Users can update classification rules"
  ON classification_rules FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id FROM project_users WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function to find best matching rule for a merchant
CREATE OR REPLACE FUNCTION find_classification_rule(
  p_project_id UUID,
  p_merchant TEXT
)
RETURNS TABLE (
  rule_id UUID,
  category TEXT,
  subcategory TEXT,
  default_chargeable BOOLEAN,
  default_procurement TEXT,
  confidence DECIMAL(3,2)
) AS $$
DECLARE
  merchant_lower TEXT;
BEGIN
  merchant_lower := lower(trim(p_merchant));
  
  RETURN QUERY
  SELECT 
    cr.id as rule_id,
    cr.category,
    cr.subcategory,
    cr.default_chargeable,
    cr.default_procurement,
    -- Calculate confidence based on match count and success rate
    LEAST(1.0, (cr.success_count::DECIMAL / GREATEST(cr.match_count, 1)) * 
           (0.7 + 0.3 * LEAST(cr.match_count / 10.0, 1)))::DECIMAL(3,2) as confidence
  FROM classification_rules cr
  WHERE cr.project_id = p_project_id
    AND merchant_lower LIKE '%' || cr.merchant_pattern || '%'
  ORDER BY 
    length(cr.merchant_pattern) DESC,  -- Prefer longer (more specific) matches
    cr.match_count DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to update or create a classification rule
CREATE OR REPLACE FUNCTION upsert_classification_rule(
  p_project_id UUID,
  p_merchant TEXT,
  p_category TEXT,
  p_user_id UUID,
  p_was_correction BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  merchant_normalized TEXT;
  rule_id UUID;
BEGIN
  -- Normalize merchant name for pattern matching
  merchant_normalized := lower(trim(regexp_replace(p_merchant, '[^a-zA-Z0-9 ]', '', 'g')));
  
  -- Try to update existing rule
  UPDATE classification_rules
  SET 
    category = p_category,
    match_count = match_count + 1,
    success_count = CASE WHEN p_was_correction THEN success_count ELSE success_count + 1 END,
    last_used_at = now()
  WHERE project_id = p_project_id
    AND merchant_pattern = merchant_normalized
  RETURNING id INTO rule_id;
  
  -- If no existing rule, insert new one
  IF rule_id IS NULL THEN
    INSERT INTO classification_rules (
      project_id,
      merchant_pattern,
      category,
      match_count,
      success_count,
      created_by
    ) VALUES (
      p_project_id,
      merchant_normalized,
      p_category,
      1,
      CASE WHEN p_was_correction THEN 0 ELSE 1 END,
      p_user_id
    )
    RETURNING id INTO rule_id;
  END IF;
  
  RETURN rule_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. STORAGE BUCKET (run separately if needed)
-- =====================================================
-- NOTE: This needs to be run in Supabase dashboard or via CLI
-- 
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('receipt-scans', 'receipt-scans', false);
-- 
-- CREATE POLICY "Users can upload receipt images"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'receipt-scans' AND
--   auth.uid()::text = (storage.foldername(name))[1]
-- );
-- 
-- CREATE POLICY "Users can view own receipt images"
-- ON storage.objects FOR SELECT
-- USING (
--   bucket_id = 'receipt-scans' AND
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- =====================================================
-- DEPLOYMENT NOTES
-- =====================================================
-- 1. Run this migration in Supabase SQL Editor
-- 2. Create 'receipt-scans' storage bucket in Supabase Dashboard
-- 3. Configure storage policies for the bucket
-- 4. Test with: SELECT find_classification_rule('<project_id>', 'costa coffee');
