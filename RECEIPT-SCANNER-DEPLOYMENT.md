# Smart Receipt Scanner - Deployment Checklist

**Version:** 1.0  
**Created:** 2 December 2025  
**Status:** Ready for Deployment

---

## Pre-Deployment Status

### ✅ Code Complete

| Component | File | Lines | Status |
|-----------|------|-------|--------|
| Database Schema | `sql/P7-receipt-scanner.sql` | 310 | ✅ Ready |
| API Endpoint | `api/scan-receipt.js` | 300 | ✅ Ready |
| Service Layer | `src/services/receiptScanner.service.js` | 522 | ✅ Ready |
| React Component | `src/components/expenses/ReceiptScanner.jsx` | 694 | ✅ Ready |
| CSS Styling | `src/components/expenses/ReceiptScanner.css` | 725 | ✅ Ready |
| Expenses Integration | `src/pages/Expenses.jsx` | 1021 | ✅ Integrated |

**Total Lines of Code:** ~3,572

---

## Deployment Steps

### Step 1: Supabase Database Migration

**Required:** Run the SQL migration in Supabase SQL Editor

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `sql/P7-receipt-scanner.sql`
3. Execute the script
4. Verify tables were created:

```sql
-- Verification queries
SELECT count(*) FROM receipt_scans; -- Should return 0
SELECT count(*) FROM classification_rules; -- Should return 0

-- Test the functions
SELECT * FROM find_classification_rule('your-project-uuid', 'costa coffee');
```

**Tables Created:**
- `receipt_scans` - Stores uploaded receipt images and extraction results
- `classification_rules` - Stores learned merchant→category mappings

**Functions Created:**
- `find_classification_rule()` - Finds best matching rule for a merchant
- `upsert_classification_rule()` - Creates or updates classification rules

---

### Step 2: Supabase Storage Bucket

**Required:** Create storage bucket for receipt images

1. Open Supabase Dashboard → Storage
2. Click "Create a new bucket"
3. Configure:
   - **Bucket name:** `receipt-scans`
   - **Public bucket:** No (private)
   - **File size limit:** 10MB
   - **Allowed MIME types:** `image/jpeg, image/png, image/webp, image/heic`

4. Add storage policies (SQL Editor):

```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload receipt images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipt-scans' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view their own images
CREATE POLICY "Users can view own receipt images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipt-scans' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete own receipt images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'receipt-scans' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

### Step 3: Vercel Environment Variable

**Required:** Add Anthropic API key to Vercel

1. Open Vercel Dashboard → Project Settings → Environment Variables
2. Add new variable:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-api03-...` (your Anthropic API key)
   - **Environment:** Production, Preview, Development
3. Redeploy the application for changes to take effect

**Note:** If you don't have an Anthropic API key:
1. Go to https://console.anthropic.com/
2. Create an account or sign in
3. Navigate to API Keys
4. Create a new key
5. Copy and save securely

---

### Step 4: Deploy Application

1. Commit all changes to Git:
```bash
cd /Users/glennnickols/Projects/amsf001-project-tracker
git add .
git commit -m "feat: complete smart receipt scanner implementation"
git push origin main
```

2. Vercel will automatically deploy

3. Monitor deployment at https://vercel.com/dashboard

---

### Step 5: Post-Deployment Testing

#### Test 1: Basic Upload
1. Navigate to Expenses page
2. Click "Scan Receipt" button
3. Upload a test receipt image
4. Verify:
   - [ ] Image preview shows correctly
   - [ ] "Scan Receipt" button is enabled
   - [ ] No console errors

#### Test 2: AI Processing
1. Click "Scan Receipt" on uploaded image
2. Verify:
   - [ ] Processing spinner appears
   - [ ] AI extracts merchant, amount, date
   - [ ] Category is suggested
   - [ ] Confidence score displays

#### Test 3: Form Submission
1. Review extracted data
2. Select a resource
3. Modify any incorrect fields
4. Click "Create Expense"
5. Verify:
   - [ ] Expense appears in list
   - [ ] Receipt thumbnail attached
   - [ ] Classification rule created (check database)

#### Test 4: Learning System
1. Scan another receipt from same merchant
2. Verify:
   - [ ] Category auto-selected
   - [ ] "Based on previous receipts" message shows
   - [ ] Higher confidence score

---

## Configuration Reference

### API Endpoint
- **URL:** `/api/scan-receipt`
- **Method:** POST
- **Rate Limit:** 10 requests/minute per user

### Claude Model
- **Model:** `claude-haiku-4-5-20251001`
- **Max Tokens:** 1024
- **Cost:** ~$0.008 per receipt

### Storage
- **Bucket:** `receipt-scans`
- **Path Pattern:** `{user_id}/{timestamp}.{ext}`
- **Max File Size:** 10MB
- **Allowed Types:** JPEG, PNG, WebP, HEIC

---

## Troubleshooting

### "API key not configured" Error
- Check Vercel environment variables
- Ensure variable name is exactly `ANTHROPIC_API_KEY`
- Redeploy after adding variable

### "Failed to upload image" Error
- Check Supabase storage bucket exists
- Verify storage policies are correct
- Check file size (<10MB) and type

### "Rate limit exceeded" Error
- Wait 1 minute before trying again
- Rate limit: 10 scans per minute per user

### Low Confidence Results
- Ensure receipt is well-lit and flat
- Avoid shadows and glare
- Keep full receipt in frame
- Try higher resolution image

### Classification Not Learning
- Check `classification_rules` table has entries
- Verify `find_classification_rule` function works
- Ensure project_id is correct

---

## Rollback Procedure

If issues occur after deployment:

1. **Quick Rollback:** Revert to previous Vercel deployment
   - Vercel Dashboard → Deployments → Previous → Promote to Production

2. **Database Rollback:**
```sql
-- Remove tables (WARNING: deletes all data)
DROP TABLE IF EXISTS receipt_scans CASCADE;
DROP TABLE IF EXISTS classification_rules CASCADE;
DROP FUNCTION IF EXISTS find_classification_rule;
DROP FUNCTION IF EXISTS upsert_classification_rule;
```

3. **Storage Rollback:**
   - Delete `receipt-scans` bucket in Supabase Dashboard

---

## Success Criteria

- [ ] Database tables created without errors
- [ ] Storage bucket configured with policies
- [ ] API key set in Vercel
- [ ] Receipt upload works
- [ ] AI extraction returns data
- [ ] Expense creation succeeds
- [ ] Learning system stores rules
- [ ] No console errors in production

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| Tester | | | |
| Project Manager | | | |

---

*End of Deployment Checklist*
