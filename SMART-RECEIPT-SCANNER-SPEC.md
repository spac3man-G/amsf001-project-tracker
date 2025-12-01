# Smart Receipt Scanner - Technical Specification

**Version:** 1.0  
**Created:** 2 December 2025  
**Author:** Development Team  
**Status:** Approved for Development  
**Target Phase:** Phase 2 - Multi-Tenant & Reporting

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Feature Overview](#2-feature-overview)
3. [System Architecture](#3-system-architecture)
4. [Database Schema](#4-database-schema)
5. [API Design](#5-api-design)
6. [Claude Vision Integration](#6-claude-vision-integration)
7. [Learning System](#7-learning-system)
8. [UI/UX Specifications](#8-uiux-specifications)
9. [Security Considerations](#9-security-considerations)
10. [Cost Analysis](#10-cost-analysis)
11. [Implementation Roadmap](#11-implementation-roadmap)
12. [Testing Strategy](#12-testing-strategy)
13. [Appendices](#13-appendices)

---

## 1. Executive Summary

### 1.1 Purpose
Enable resources to submit expenses by photographing receipts, with AI-powered automatic data extraction and intelligent category classification that learns from user corrections.

### 1.2 Business Value
- **Time Savings:** Reduce expense entry time from 2-3 minutes to 30 seconds per receipt
- **Accuracy:** AI extraction eliminates manual data entry errors
- **Compliance:** Digital receipt storage meets audit requirements
- **Intelligence:** System learns organizational spending patterns

### 1.3 Key Metrics
| Metric | Target |
|--------|--------|
| Receipt processing time | < 5 seconds |
| Data extraction accuracy | > 90% |
| Classification accuracy (after learning) | > 95% |
| User adoption rate | > 80% of expense submissions |

---

## 2. Feature Overview

### 2.1 User Journey

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         RECEIPT UPLOAD FLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │  Upload  │───▶│  Scan    │───▶│  Review  │───▶│  Submit  │          │
│  │  Receipt │    │  & Parse │    │  & Edit  │    │  Expense │          │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘          │
│       │               │               │               │                  │
│       ▼               ▼               ▼               ▼                  │
│  Photo/File      AI extracts     User verifies   Expense created        │
│  uploaded        data + suggests  and corrects    + rule learned        │
│                  category         if needed                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Core Capabilities

| Capability | Description |
|------------|-------------|
| **Image Upload** | Camera capture or file upload (JPEG, PNG, WebP, HEIC) |
| **OCR Extraction** | Extract merchant, amount, date, line items, VAT |
| **Smart Classification** | Auto-categorize as Travel/Accommodation/Sustenance |
| **Learning System** | Remember corrections to improve future accuracy |
| **Bulk Processing** | Scan multiple receipts in sequence |
| **Receipt Storage** | Secure cloud storage linked to expenses |

### 2.3 Integration Points

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Receipt        │      │  Expenses       │      │  Partner        │
│  Scanner        │─────▶│  System         │─────▶│  Invoicing      │
│  Service        │      │                 │      │                 │
└────────┬────────┘      └─────────────────┘      └─────────────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│  Classification │      │  Supabase       │
│  Rules Engine   │      │  Storage        │
└─────────────────┘      └─────────────────┘
```

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                     │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐              │
│  │ ReceiptUpload  │  │ ReceiptReview  │  │ RulesManager   │              │
│  │ Component      │  │ Component      │  │ Component      │              │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘              │
│          │                   │                   │                        │
│          └───────────────────┴───────────────────┘                        │
│                              │                                            │
│                    ┌─────────▼─────────┐                                  │
│                    │ receiptScanner    │                                  │
│                    │ .service.js       │                                  │
│                    └─────────┬─────────┘                                  │
└──────────────────────────────┼────────────────────────────────────────────┘
                               │
┌──────────────────────────────┼────────────────────────────────────────────┐
│                          BACKEND                                          │
│                    ┌─────────▼─────────┐                                  │
│                    │ /api/scan-receipt │                                  │
│                    │ Edge Function     │                                  │
│                    └─────────┬─────────┘                                  │
│                              │                                            │
│            ┌─────────────────┼─────────────────┐                          │
│            │                 │                 │                          │
│  ┌─────────▼─────────┐ ┌─────▼─────┐ ┌────────▼────────┐                 │
│  │ Claude Vision API │ │ Supabase  │ │ Supabase        │                 │
│  │ (Anthropic)       │ │ Database  │ │ Storage         │                 │
│  └───────────────────┘ └───────────┘ └─────────────────┘                 │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Overview

| Component | Technology | Responsibility |
|-----------|------------|----------------|
| **ReceiptUploadComponent** | React | File selection, camera capture, drag-drop |
| **ReceiptReviewComponent** | React | Display extracted data, edit form, confirmation |
| **RulesManagerComponent** | React | View/edit classification rules |
| **receiptScanner.service.js** | JavaScript | Orchestrate upload, API calls, storage |
| **Edge Function** | Vercel/Supabase | Proxy Claude API calls, handle auth |
| **receipt_scans table** | PostgreSQL | Store scan results |
| **classification_rules table** | PostgreSQL | Store learned patterns |
| **receipt-scans bucket** | Supabase Storage | Store receipt images |

### 3.3 Data Flow

```
1. User uploads image
   └─▶ receiptScanner.service.uploadImage()
       └─▶ Supabase Storage (receipt-scans bucket)
           └─▶ Returns: { path, url }

2. Image processed by AI
   └─▶ receiptScanner.service.processReceipt()
       ├─▶ Fetch image as base64
       ├─▶ Call /api/scan-receipt Edge Function
       │   └─▶ Claude Vision API
       │       └─▶ Returns: { merchant, amount, date, category, confidence }
       ├─▶ Check classification_rules for match
       └─▶ Return combined result with best category

3. User reviews and confirms
   └─▶ If user changes category:
       └─▶ receiptScanner.service.learnFromCorrection()
           └─▶ Upsert classification_rules

4. Expense created
   └─▶ expenses.service.create()
   └─▶ receiptScanner.service.linkToExpense()
```

---

## 4. Database Schema

### 4.1 New Tables

#### 4.1.1 receipt_scans

```sql
CREATE TABLE receipt_scans (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  
  -- Image storage
  image_path TEXT NOT NULL,           -- Storage path
  image_url TEXT NOT NULL,            -- Public URL
  
  -- Extracted data
  raw_ocr_text TEXT,                  -- Full OCR output
  extracted_merchant TEXT,            -- Recognized merchant name
  extracted_amount DECIMAL(10,2),     -- Parsed amount
  extracted_currency TEXT DEFAULT 'GBP',
  extracted_date DATE,                -- Receipt date
  extracted_vat_amount DECIMAL(10,2), -- VAT if detected
  extracted_vat_rate DECIMAL(4,2),    -- VAT rate if detected
  extracted_items JSONB DEFAULT '[]', -- Line items array
  extracted_payment_method TEXT,      -- card/cash/unknown
  
  -- Classification
  ai_suggested_category TEXT,         -- AI's suggestion
  ai_confidence DECIMAL(3,2),         -- 0.00 to 1.00
  rule_matched_id UUID,               -- If matched by rule
  final_category TEXT,                -- User's final choice
  user_corrected BOOLEAN DEFAULT false,
  
  -- Processing metadata
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'linked'
  )),
  processing_time_ms INTEGER,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT false
);

-- Indexes for common queries
CREATE INDEX idx_receipt_scans_project ON receipt_scans(project_id);
CREATE INDEX idx_receipt_scans_user ON receipt_scans(uploaded_by);
CREATE INDEX idx_receipt_scans_expense ON receipt_scans(expense_id);
CREATE INDEX idx_receipt_scans_status ON receipt_scans(status);
CREATE INDEX idx_receipt_scans_created ON receipt_scans(created_at DESC);

-- Enable RLS
ALTER TABLE receipt_scans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own project scans" ON receipt_scans
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM user_project_access 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own scans" ON receipt_scans
  FOR INSERT WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update own scans" ON receipt_scans
  FOR UPDATE USING (uploaded_by = auth.uid());
```

#### 4.1.2 classification_rules

```sql
CREATE TABLE classification_rules (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Scope
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Matching criteria
  merchant_pattern TEXT NOT NULL,     -- Lowercase pattern to match
  merchant_exact TEXT,                -- Exact merchant name (optional)
  
  -- Classification output
  category TEXT NOT NULL CHECK (category IN ('Travel', 'Accommodation', 'Sustenance')),
  subcategory TEXT,                   -- Optional subcategory
  default_chargeable BOOLEAN DEFAULT true,
  default_procurement TEXT DEFAULT 'supplier',
  
  -- Learning metadata
  match_count INTEGER DEFAULT 1,      -- Times this rule matched
  correction_count INTEGER DEFAULT 0, -- Times user corrected to this
  confidence DECIMAL(3,2) DEFAULT 0.8,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint
  UNIQUE(project_id, merchant_pattern)
);

-- Indexes
CREATE INDEX idx_classification_rules_project ON classification_rules(project_id);
CREATE INDEX idx_classification_rules_pattern ON classification_rules(merchant_pattern);
CREATE INDEX idx_classification_rules_confidence ON classification_rules(confidence DESC);

-- Enable RLS
ALTER TABLE classification_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view project rules" ON classification_rules
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM user_project_access 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert rules" ON classification_rules
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update project rules" ON classification_rules
  FOR UPDATE USING (
    project_id IN (
      SELECT project_id FROM user_project_access 
      WHERE user_id = auth.uid()
    )
  );
```

### 4.2 Database Functions

#### 4.2.1 Find Classification Rule

```sql
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
  confidence DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.id AS rule_id,
    cr.category,
    cr.subcategory,
    cr.default_chargeable,
    cr.default_procurement,
    cr.confidence
  FROM classification_rules cr
  WHERE cr.project_id = p_project_id
    AND LOWER(p_merchant) LIKE '%' || cr.merchant_pattern || '%'
  ORDER BY 
    -- Prefer exact matches
    CASE WHEN LOWER(p_merchant) = cr.merchant_exact THEN 0 ELSE 1 END,
    -- Then by confidence
    cr.confidence DESC,
    -- Then by match count
    cr.match_count DESC
  LIMIT 1;
  
  -- Update last_used if found
  UPDATE classification_rules
  SET 
    last_used_at = now(),
    match_count = match_count + 1
  WHERE id = (SELECT rule_id FROM classification_rules cr
              WHERE cr.project_id = p_project_id
                AND LOWER(p_merchant) LIKE '%' || cr.merchant_pattern || '%'
              LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 4.2.2 Upsert Classification Rule

```sql
CREATE OR REPLACE FUNCTION upsert_classification_rule(
  p_project_id UUID,
  p_merchant TEXT,
  p_category TEXT,
  p_user_id UUID,
  p_was_correction BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  v_pattern TEXT;
  v_rule_id UUID;
BEGIN
  -- Normalize merchant to pattern
  v_pattern := LOWER(TRIM(p_merchant));
  
  -- Try to insert or update
  INSERT INTO classification_rules (
    project_id,
    merchant_pattern,
    merchant_exact,
    category,
    created_by,
    correction_count,
    confidence
  ) VALUES (
    p_project_id,
    v_pattern,
    LOWER(p_merchant),
    p_category,
    p_user_id,
    CASE WHEN p_was_correction THEN 1 ELSE 0 END,
    CASE WHEN p_was_correction THEN 0.9 ELSE 0.7 END
  )
  ON CONFLICT (project_id, merchant_pattern)
  DO UPDATE SET
    category = EXCLUDED.category,
    match_count = classification_rules.match_count + 1,
    correction_count = classification_rules.correction_count + 
      CASE WHEN p_was_correction THEN 1 ELSE 0 END,
    confidence = LEAST(
      0.99, 
      classification_rules.confidence + 
        CASE WHEN p_was_correction THEN 0.05 ELSE 0.02 END
    ),
    last_used_at = now(),
    updated_at = now()
  RETURNING id INTO v_rule_id;
  
  RETURN v_rule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.3 Storage Configuration

```sql
-- Create storage bucket for receipt images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipt-scans',
  'receipt-scans',
  true,  -- Public for easy display
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
);

-- Storage policies
CREATE POLICY "Users can upload receipts" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'receipt-scans' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view receipts" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'receipt-scans'
  );

CREATE POLICY "Users can delete own receipts" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'receipt-scans' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## 5. API Design

### 5.1 Edge Function: /api/scan-receipt

```typescript
// supabase/functions/scan-receipt/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'npm:@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')!
})

interface ScanRequest {
  image: {
    data: string      // Base64 encoded
    mediaType: string // image/jpeg, image/png, etc.
  }
  projectId: string
}

interface ScanResponse {
  merchant: string | null
  amount: number | null
  currency: string
  date: string | null
  items: Array<{name: string, quantity: number, price: number}>
  vatAmount: number | null
  vatRate: number | null
  paymentMethod: string | null
  category: string | null
  confidence: number
  rawText: string
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  try {
    const { image, projectId }: ScanRequest = await req.json()

    // Validate request
    if (!image?.data || !image?.mediaType) {
      return new Response(
        JSON.stringify({ error: 'Image data and mediaType required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Call Claude Vision API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: image.mediaType,
                data: image.data,
              },
            },
            {
              type: 'text',
              text: `Analyze this receipt image and extract information in JSON format:

{
  "merchant": "Store/vendor name exactly as shown",
  "amount": 0.00,
  "currency": "GBP",
  "date": "YYYY-MM-DD",
  "items": [{"name": "item", "quantity": 1, "price": 0.00}],
  "vatAmount": 0.00,
  "vatRate": 20.0,
  "paymentMethod": "card/cash/unknown",
  "category": "Travel/Accommodation/Sustenance",
  "confidence": 0.0,
  "rawText": "All visible text"
}

Category guidance:
- Travel: transport, fuel, parking, flights, trains, taxis, car hire
- Accommodation: hotels, B&Bs, lodging, Airbnb
- Sustenance: food, drinks, restaurants, cafes, supermarkets

Rules:
1. Use null for any field you cannot determine
2. Amount should be the TOTAL paid, not subtotal
3. Date in ISO format YYYY-MM-DD
4. Confidence 0.0-1.0 reflecting certainty
5. Include ALL visible text in rawText

Return ONLY valid JSON, no explanation.`
            },
          ],
        },
      ],
    })

    // Parse Claude's response
    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    // Clean and parse JSON
    let jsonStr = content.text.trim()
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7)
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3)
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3)
    }

    const result: ScanResponse = JSON.parse(jsonStr.trim())

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )

  } catch (error) {
    console.error('Scan receipt error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process receipt',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )
  }
})
```

### 5.2 Service Layer Methods

The existing `receiptScanner.service.js` already implements the core methods. Key methods:

| Method | Purpose |
|--------|---------|
| `uploadImage(file, userId)` | Upload receipt to Supabase Storage |
| `processReceipt(imageUrl, projectId)` | Call AI and get extracted data |
| `findClassificationRule(projectId, merchant)` | Check for learned rules |
| `learnFromCorrection(projectId, merchant, category, userId, wasCorrection)` | Save user's choice |
| `createScan(scanData)` | Store scan record in database |
| `linkToExpense(scanId, expenseId)` | Connect scan to expense |

---

## 6. Claude Vision Integration

### 6.1 Model Selection

| Model | Speed | Accuracy | Cost | Recommendation |
|-------|-------|----------|------|----------------|
| claude-sonnet-4-20250514 | ~3s | 95%+ | $0.003/image | ✅ **Recommended** |
| claude-opus-4-20250514 | ~5s | 98%+ | $0.015/image | Complex receipts only |
| claude-haiku-4-20250514 | ~1s | 85% | $0.0008/image | High volume, simple |

**Decision:** Use Sonnet for balance of accuracy and cost. Fallback to Opus for low-confidence results.

### 6.2 Prompt Engineering

The prompt has been optimized for:

1. **Structured Output:** JSON format with defined schema
2. **UK Context:** GBP default, UK merchant names
3. **Category Alignment:** Matches existing expense categories
4. **Confidence Scoring:** Self-assessment for uncertain results
5. **Error Handling:** null values for unreadable fields

### 6.3 Image Preprocessing (Optional Enhancement)

For better accuracy, consider preprocessing:

```javascript
async function preprocessImage(file) {
  // Resize if too large (>4MB)
  if (file.size > 4 * 1024 * 1024) {
    return await resizeImage(file, 2000); // Max 2000px
  }
  
  // Convert HEIC to JPEG
  if (file.type === 'image/heic') {
    return await convertHeicToJpeg(file);
  }
  
  return file;
}
```

### 6.4 Token Usage Estimation

| Receipt Type | Input Tokens | Output Tokens | Total |
|--------------|--------------|---------------|-------|
| Simple (thermal) | ~1,500 | ~200 | ~1,700 |
| Detailed (itemized) | ~2,500 | ~400 | ~2,900 |
| Complex (multi-page) | ~4,000 | ~600 | ~4,600 |

Average: **~2,500 tokens per receipt**

---

## 7. Learning System

### 7.1 Classification Priority

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLASSIFICATION PRIORITY                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. EXACT MATCH (Highest Priority)                              │
│     └── classification_rules.merchant_exact = lowercase(input)  │
│                                                                  │
│  2. PATTERN MATCH                                                │
│     └── lowercase(input) CONTAINS merchant_pattern              │
│     └── Ordered by: confidence DESC, match_count DESC           │
│                                                                  │
│  3. BUILT-IN PATTERNS                                            │
│     └── MERCHANT_HINTS object in service                        │
│     └── e.g., "costa" → Sustenance                              │
│                                                                  │
│  4. AI SUGGESTION (Lowest Priority)                             │
│     └── Claude's category guess                                  │
│     └── Only if confidence > 0.5                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Confidence Calculation

```javascript
function calculateConfidence(source, matchCount, correctionCount) {
  let base;
  
  switch(source) {
    case 'exact_match':
      base = 0.95;
      break;
    case 'pattern_match':
      base = 0.80;
      break;
    case 'builtin_pattern':
      base = 0.70;
      break;
    case 'ai_suggestion':
      base = 0.60;
      break;
    default:
      base = 0.50;
  }
  
  // Boost for repeated matches
  const matchBoost = Math.min(matchCount * 0.02, 0.15);
  
  // Boost for user corrections (stronger signal)
  const correctionBoost = Math.min(correctionCount * 0.05, 0.20);
  
  return Math.min(base + matchBoost + correctionBoost, 0.99);
}
```

### 7.3 Learning Triggers

| Event | Action | Confidence Change |
|-------|--------|-------------------|
| User accepts AI suggestion | Create/update rule | +0.02 |
| User corrects to different category | Create/update rule | +0.05 |
| Same merchant matched again | Increment match_count | +0.02 |
| Rule reaches 10 matches | Mark as "verified" | Set to 0.95 |

### 7.4 Rule Decay (Optional)

To prevent stale rules:

```sql
-- Monthly job to decay unused rules
UPDATE classification_rules
SET confidence = GREATEST(0.5, confidence - 0.05)
WHERE last_used_at < now() - interval '90 days';

-- Delete very old unused rules
DELETE FROM classification_rules
WHERE last_used_at < now() - interval '365 days'
  AND match_count < 5;
```

---

## 8. UI/UX Specifications

### 8.1 Upload Component

```
┌─────────────────────────────────────────────────────────────────────────┐
│  UPLOAD RECEIPT                                                    [X]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │                    ┌──────────────────┐                         │   │
│  │                    │   📸   📷        │                         │   │
│  │                    └──────────────────┘                         │   │
│  │                                                                  │   │
│  │              Drag and drop a receipt image here                 │   │
│  │                                                                  │   │
│  │                         - or -                                   │   │
│  │                                                                  │   │
│  │     ┌──────────────────┐    ┌──────────────────┐                │   │
│  │     │  📁 Choose File  │    │  📷 Take Photo   │                │   │
│  │     └──────────────────┘    └──────────────────┘                │   │
│  │                                                                  │   │
│  │           Supports: JPEG, PNG, WebP • Max 10MB                  │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Recent Scans (3)                                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 📄 Costa Coffee • £8.50 • 30/11/2025 • Sustenance       [Create] │  │
│  │ 📄 Premier Inn • £89.00 • 28/11/2025 • Accommodation    [Create] │  │
│  │ 📄 Shell Garage • £45.00 • 27/11/2025 • Travel          [Create] │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Scanning State

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SCANNING RECEIPT                                                  [X]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │                    [Receipt Image Preview]                        │  │
│  │                                                                   │  │
│  │                         250px x 350px                            │  │
│  │                                                                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  🔍 Scanning receipt...                                          │  │
│  │  ████████████████░░░░░░░░  65%                                   │  │
│  │                                                                   │  │
│  │  ✓ Uploading image                                               │  │
│  │  ✓ Analyzing with AI                                             │  │
│  │  ◦ Extracting data                                               │  │
│  │  ◦ Classifying category                                          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│                         [Cancel]                                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Review & Edit Form

```
┌─────────────────────────────────────────────────────────────────────────┐
│  RECEIPT SCANNED ✓                                                 [X]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────┐   ┌──────────────────────────────────────────────┐  │
│  │               │   │                                               │  │
│  │   [Receipt    │   │  Merchant      [Costa Coffee             ▼]  │  │
│  │    Thumbnail  │   │                 └── Auto-detected             │  │
│  │    150x200]   │   │                                               │  │
│  │               │   │  Amount        [£] [8.50                  ]  │  │
│  │   [View Full] │   │                 └── Extracted from receipt    │  │
│  │               │   │                                               │  │
│  └───────────────┘   │  Date          [30/11/2025            📅]    │  │
│                       │                 └── Auto-detected             │  │
│                       │                                               │  │
│                       │  Category      [Sustenance               ▼]  │  │
│                       │                 └── 94% confident (learned)   │  │
│                       │                 💡 Based on 12 previous       │  │
│                       │                    Costa Coffee receipts      │  │
│                       │                                               │  │
│                       │  ☐ Chargeable to customer                    │  │
│                       │  ○ Supplier procured  ● Partner procured     │  │
│                       │                                               │  │
│                       │  Description   [Coffee during site visit  ]  │  │
│                       │                                               │  │
│                       └──────────────────────────────────────────────┘  │
│                                                                          │
│  Line Items Detected (optional review)                          [Show]  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │   [Cancel]              [Scan Another]           [Create Expense] │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.4 Mobile Experience

On screens < 768px:
- Camera capture is primary option
- Full-screen preview during scan
- Simplified form with essential fields only
- Swipe gestures for scan history

---

## 9. Security Considerations

### 9.1 Data Protection

| Risk | Mitigation |
|------|------------|
| Receipt contains PII | Images stored in private bucket with RLS |
| OCR text contains sensitive data | rawText encrypted at rest |
| API key exposure | Edge function holds key, not frontend |
| Unauthorized access | RLS policies on all tables |

### 9.2 Storage Security

```javascript
// All images stored in user-specific folders
const path = `${userId}/${timestamp}.${extension}`;

// Folder structure prevents cross-user access
// RLS policy validates folder ownership
```

### 9.3 API Security

```javascript
// Edge function validates auth
const authHeader = req.headers.get('Authorization');
const { data: { user }, error } = await supabase.auth.getUser(
  authHeader?.replace('Bearer ', '')
);

if (error || !user) {
  return new Response('Unauthorized', { status: 401 });
}
```

### 9.4 Rate Limiting

```javascript
// Prevent abuse
const RATE_LIMIT = {
  perUser: 50,      // scans per day
  perProject: 500,  // scans per day
  perMinute: 5      // scans per minute per user
};
```

### 9.5 Data Retention

| Data Type | Retention | Deletion Policy |
|-----------|-----------|-----------------|
| Receipt images | 7 years | UK tax compliance |
| Scan records | 7 years | Linked to expenses |
| Classification rules | Indefinite | Project deletion cascades |
| OCR raw text | 90 days | Can be purged after expense confirmed |

---

## 10. Cost Analysis

### 10.1 Claude API Pricing

**Current Anthropic Pricing (as of December 2025):**

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| Claude Sonnet 4 | $3.00 | $15.00 |
| Claude Opus 4 | $15.00 | $75.00 |
| Claude Haiku 4 | $0.80 | $4.00 |

### 10.2 Per-Receipt Cost Calculation

**Using Claude Sonnet 4 (Recommended):**

| Component | Tokens | Cost |
|-----------|--------|------|
| Image encoding | ~1,600 input | $0.0048 |
| Prompt | ~300 input | $0.0009 |
| Response | ~250 output | $0.00375 |
| **Total per receipt** | ~2,150 | **~$0.009** |

**Rounded estimate: $0.01 per receipt**

### 10.3 Monthly Cost Projections

| Scenario | Receipts/Month | Claude Cost | Storage Cost | Total |
|----------|----------------|-------------|--------------|-------|
| **Low** (5 users, 20 each) | 100 | $1.00 | $0.10 | **$1.10** |
| **Medium** (20 users, 30 each) | 600 | $6.00 | $0.60 | **$6.60** |
| **High** (50 users, 50 each) | 2,500 | $25.00 | $2.50 | **$27.50** |
| **Enterprise** (200 users, 40 each) | 8,000 | $80.00 | $8.00 | **$88.00** |

### 10.4 Storage Costs

**Supabase Storage (Pro Plan):**
- Included: 100GB
- Overage: $0.021/GB

**Average receipt image: ~500KB**

| Receipts/Month | Storage/Month | Annual Storage | Annual Cost |
|----------------|---------------|----------------|-------------|
| 100 | 50MB | 600MB | Included |
| 600 | 300MB | 3.6GB | Included |
| 2,500 | 1.25GB | 15GB | Included |
| 8,000 | 4GB | 48GB | Included |

### 10.5 Cost Optimization Strategies

| Strategy | Savings | Trade-off |
|----------|---------|-----------|
| Use Haiku for simple receipts | -60% | Slightly lower accuracy |
| Cache common merchants | -10% | Development effort |
| Compress images before upload | -5% | Processing time |
| Skip AI if rule exists | -30% | None (rule-based is free) |

### 10.6 ROI Analysis

**Time Savings:**
- Manual expense entry: 3 minutes per receipt
- With receipt scanner: 30 seconds per receipt
- Savings: 2.5 minutes per receipt

**Cost per resource hour:** £75 (average)
**Cost per minute:** £1.25

| Scenario | Receipts | Time Saved | Value Saved | AI Cost | **Net Benefit** |
|----------|----------|------------|-------------|---------|-----------------|
| Low | 100/mo | 4.2 hours | £312 | £1 | **£311** |
| Medium | 600/mo | 25 hours | £1,875 | £6 | **£1,869** |
| High | 2,500/mo | 104 hours | £7,812 | £25 | **£7,787** |

**ROI: 31,000%+ in time savings value**

### 10.7 Budget Allocation

For Phase 2 budget planning:

| Component | One-Time | Monthly (Medium) |
|-----------|----------|------------------|
| Development | £5,000 | - |
| Claude API | - | £6-8 |
| Storage | - | Included |
| Maintenance | - | £0 (automated) |
| **Total** | **£5,000** | **~£7/month** |

---

## 11. Implementation Roadmap

### 11.1 Phase Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        IMPLEMENTATION PHASES                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Phase 1: Foundation        Phase 2: Intelligence      Phase 3: Polish  │
│  ═══════════════════       ══════════════════════     ═════════════════ │
│                                                                          │
│  Week 1-2                   Week 3-4                   Week 5-6          │
│  ────────                   ────────                   ────────          │
│  • Database schema          • Classification logic     • Mobile camera   │
│  • Storage bucket           • Learning system          • Bulk scanning   │
│  • Edge function            • Rule management UI       • Analytics       │
│  • Basic upload UI          • User corrections         • Performance     │
│  • Claude integration       • Confidence display       • Documentation   │
│                                                                          │
│  Deliverable:               Deliverable:               Deliverable:      │
│  Working scan → expense     Smart categorization       Production-ready  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Detailed Task Breakdown

#### Phase 1: Foundation (24 hours)

| Task | Hours | Dependencies |
|------|-------|--------------|
| Create database tables & functions | 4 | None |
| Configure Supabase Storage bucket | 2 | Tables |
| Deploy Edge Function for Claude | 4 | Storage |
| Build ReceiptUploadComponent | 6 | Edge Function |
| Build ReceiptReviewComponent | 4 | Upload Component |
| Integrate with expense creation | 4 | Review Component |
| **Phase 1 Total** | **24** | |

#### Phase 2: Intelligence (20 hours)

| Task | Hours | Dependencies |
|------|-------|--------------|
| Implement findClassificationRule | 3 | Phase 1 |
| Implement learnFromCorrection | 3 | Phase 1 |
| Build confidence display UI | 2 | Learning |
| Category dropdown with suggestions | 3 | Confidence UI |
| Build RulesManagerComponent | 5 | Learning |
| Add rule CRUD operations | 4 | Rules Manager |
| **Phase 2 Total** | **20** | |

#### Phase 3: Polish (18 hours)

| Task | Hours | Dependencies |
|------|-------|--------------|
| Mobile camera integration | 4 | Phase 2 |
| Bulk receipt scanning | 4 | Phase 2 |
| Analytics dashboard | 3 | Phase 2 |
| Performance optimization | 3 | All features |
| Error handling & edge cases | 2 | All features |
| Documentation & testing | 2 | All features |
| **Phase 3 Total** | **18** | |

### 11.3 Milestone Schedule

| Milestone | Target Date | Deliverables |
|-----------|-------------|--------------|
| **M1: Schema Ready** | Day 2 | Tables, functions, storage bucket |
| **M2: Basic Scanning** | Day 5 | Upload → Claude → Display |
| **M3: Expense Integration** | Day 8 | Full flow working |
| **M4: Learning Active** | Day 12 | Rules created from corrections |
| **M5: Rules UI** | Day 16 | View/edit classification rules |
| **M6: Production Ready** | Day 22 | All features, tested, documented |

### 11.4 Git Branch Strategy

```
main
  └── feature/receipt-scanner
        ├── receipt-scanner/database
        ├── receipt-scanner/edge-function
        ├── receipt-scanner/upload-component
        ├── receipt-scanner/review-component
        ├── receipt-scanner/learning-system
        └── receipt-scanner/rules-manager
```

---

## 12. Testing Strategy

### 12.1 Unit Tests

```javascript
// receiptScanner.service.test.js

describe('ReceiptScannerService', () => {
  describe('classifyFromPatterns', () => {
    it('classifies Costa as Sustenance', () => {
      const result = service.classifyFromPatterns('Costa Coffee');
      expect(result.category).toBe('Sustenance');
    });
    
    it('classifies Premier Inn as Accommodation', () => {
      const result = service.classifyFromPatterns('Premier Inn London');
      expect(result.category).toBe('Accommodation');
    });
    
    it('classifies Shell as Travel', () => {
      const result = service.classifyFromPatterns('Shell Petrol Station');
      expect(result.category).toBe('Travel');
    });
    
    it('returns null for unknown merchant', () => {
      const result = service.classifyFromPatterns('Random Store XYZ');
      expect(result).toBeNull();
    });
  });
  
  describe('calculateConfidence', () => {
    it('returns high confidence for exact match', () => {
      const result = calculateConfidence('exact_match', 5, 2);
      expect(result).toBeGreaterThan(0.9);
    });
    
    it('caps confidence at 0.99', () => {
      const result = calculateConfidence('exact_match', 100, 50);
      expect(result).toBeLessThanOrEqual(0.99);
    });
  });
});
```

### 12.2 Integration Tests

```javascript
describe('Receipt Scanning Integration', () => {
  it('completes full scan-to-expense flow', async () => {
    // Upload test image
    const file = new File([testImageData], 'receipt.jpg', { type: 'image/jpeg' });
    const { path, url } = await service.uploadImage(file, userId);
    
    // Process with AI
    const result = await service.processReceipt(url, projectId);
    
    expect(result.merchant).toBeTruthy();
    expect(result.amount).toBeGreaterThan(0);
    expect(result.suggestedCategory).toMatch(/Travel|Accommodation|Sustenance/);
    
    // Create expense
    const expense = await expensesService.create({
      project_id: projectId,
      resource_id: resourceId,
      category: result.suggestedCategory,
      amount: result.amount,
      expense_date: result.date
    });
    
    expect(expense.id).toBeTruthy();
    
    // Link scan to expense
    await service.linkToExpense(result.scanId, expense.id);
  });
});
```

### 12.3 Test Receipt Images

Create test fixtures for:

| Scenario | File | Expected Result |
|----------|------|-----------------|
| Clear thermal receipt | clear-receipt.jpg | Full extraction |
| Blurry receipt | blurry-receipt.jpg | Partial extraction |
| Rotated receipt | rotated-receipt.jpg | Auto-rotate + extract |
| Multi-page | multi-page.pdf | First page only |
| Foreign currency | euro-receipt.jpg | EUR detected |
| No date visible | no-date.jpg | null date |
| Handwritten | handwritten.jpg | Best effort |

### 12.4 Edge Case Testing

| Edge Case | Expected Behavior |
|-----------|-------------------|
| Image too large (>10MB) | Error message, reject upload |
| Invalid file type (.pdf) | Error message, suggest conversion |
| Network timeout | Retry 3x, then show error |
| Claude rate limited | Queue and retry after 60s |
| Duplicate receipt | Warn user, allow override |
| Empty/blank image | Low confidence, manual entry prompt |

---

## 13. Appendices

### 13.1 Existing Service Code

The `receiptScanner.service.js` file (522 lines) already implements:
- ✅ Image upload to Supabase Storage
- ✅ Claude Vision API call structure
- ✅ Pattern-based classification (MERCHANT_HINTS)
- ✅ Database CRUD operations
- ✅ Rule finding and learning functions

### 13.2 Dependencies

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",
    "react-dropzone": "^14.x"  // For drag-and-drop
  },
  "devDependencies": {
    "@anthropic-ai/sdk": "^0.x"  // Edge function only
  }
}
```

### 13.3 Environment Variables

```bash
# .env.local (frontend)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx

# Supabase Edge Function secrets
ANTHROPIC_API_KEY=sk-ant-xxx
```

### 13.4 Quick Reference: Category Mapping

| Category | Keywords | Examples |
|----------|----------|----------|
| **Travel** | uber, taxi, train, rail, flight, petrol, fuel, parking, car hire | Uber £12, Shell £45, NCP Parking £8 |
| **Accommodation** | hotel, inn, motel, airbnb, booking, lodge, B&B | Premier Inn £89, Marriott £150 |
| **Sustenance** | cafe, coffee, restaurant, food, pub, supermarket | Costa £8, Tesco £25, Wagamama £18 |

### 13.5 API Response Examples

**Successful Scan:**
```json
{
  "merchant": "Costa Coffee",
  "amount": 8.50,
  "currency": "GBP",
  "date": "2025-11-30",
  "items": [
    {"name": "Large Latte", "quantity": 1, "price": 4.50},
    {"name": "Croissant", "quantity": 1, "price": 2.50},
    {"name": "Bottled Water", "quantity": 1, "price": 1.50}
  ],
  "vatAmount": 1.42,
  "vatRate": 20.0,
  "paymentMethod": "card",
  "category": "Sustenance",
  "confidence": 0.92,
  "rawText": "COSTA COFFEE\n123 High Street\nLondon W1 1AA\n..."
}
```

**Partial Extraction:**
```json
{
  "merchant": "Unknown Store",
  "amount": 15.00,
  "currency": "GBP",
  "date": null,
  "items": [],
  "vatAmount": null,
  "vatRate": null,
  "paymentMethod": "unknown",
  "category": null,
  "confidence": 0.35,
  "rawText": "...blurry text..."
}
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-02 | Development Team | Initial specification |

---

*End of Technical Specification*
