# Planning AI Assistant - Document Upload Enhancement

## Implementation Schedule

### Overview
Add PDF/image document upload capability to the Planning AI Assistant, allowing users to upload project briefs, requirements documents, or scope documents and have the AI analyze them to generate project plans.

---

## Pre-Implementation Verification

### Verified Capabilities ✅

| Capability | Evidence | Location |
|------------|----------|----------|
| Claude PDF support | Claude API supports `type: "document"` with base64 PDFs | Anthropic docs |
| Claude image support | Receipt scanner uses `type: "image"` with base64 | `api/scan-receipt.js` |
| File upload pattern | Expense form handles file uploads | `ExpenseAddForm.jsx` |
| Base64 conversion | FileReader API used for receipts | `ExpenseAddForm.jsx` |

### Supported Document Types
- **PDF** - Native Claude support via `type: "document"`
- **Images** - PNG, JPEG, WebP, GIF via `type: "image"`

---

## Implementation Segments

### Segment 1: API Enhancement ⬜
**Estimated Time:** 30-45 minutes

- [ ] 1.1 Update `api/planning-ai.js` to accept document parameter
- [ ] 1.2 Add document to Claude message content array
- [ ] 1.3 Update system prompt to handle document analysis
- [ ] 1.4 Add file size validation (max 10MB)
- [ ] 1.5 Test API accepts document payload

**Checkpoint:** API can receive and process documents

---

### Segment 2: File Upload UI ⬜
**Estimated Time:** 45-60 minutes

- [ ] 2.1 Add file input and upload button to PlanningAIAssistant.jsx
- [ ] 2.2 Create `DocumentUpload` sub-component
- [ ] 2.3 Implement drag-and-drop zone
- [ ] 2.4 Add file type validation (PDF, PNG, JPG)
- [ ] 2.5 Convert file to base64 using FileReader
- [ ] 2.6 Store uploaded document in component state

**Checkpoint:** Users can select/drop files and see them displayed

---

### Segment 3: Document Preview & Management ⬜
**Estimated Time:** 30-45 minutes

- [ ] 3.1 Show uploaded document with filename and size
- [ ] 3.2 Add remove button to clear document
- [ ] 3.3 Show document icon based on type (PDF vs image)
- [ ] 3.4 Add loading state during file read
- [ ] 3.5 Display file size in human-readable format
- [ ] 3.6 Limit to one document at a time (simplicity)

**Checkpoint:** Document shows in UI with ability to remove

---

### Segment 4: Integration & Sending ⬜
**Estimated Time:** 30-45 minutes

- [ ] 4.1 Include document in API request payload
- [ ] 4.2 Clear document after successful send
- [ ] 4.3 Update quick prompts for document context
- [ ] 4.4 Show "Analyzing document..." loading state
- [ ] 4.5 Handle large file upload errors gracefully

**Checkpoint:** Documents sent to API and analyzed by Claude

---

### Segment 5: Styling & Polish ⬜
**Estimated Time:** 20-30 minutes

- [ ] 5.1 Style upload zone (dashed border, hover state)
- [ ] 5.2 Style document preview chip
- [ ] 5.3 Add drag-over visual feedback
- [ ] 5.4 Responsive adjustments
- [ ] 5.5 Error state styling

**Checkpoint:** Professional, polished UI matching app design

---

### Segment 6: Testing & Deployment ⬜
**Estimated Time:** 15-20 minutes

- [ ] 6.1 Test PDF upload and analysis
- [ ] 6.2 Test image upload and analysis
- [ ] 6.3 Test error handling (large file, wrong type)
- [ ] 6.4 Commit and push
- [ ] 6.5 Verify deployment

**Checkpoint:** Feature live and working in production

---

## Total Estimated Time: 3-4 hours

---

## Technical Details

### API Request Structure (after enhancement)
```javascript
// POST /api/planning-ai
{
  messages: [
    { role: "user", content: "Create a plan from this document" }
  ],
  projectContext: { projectId, projectName },
  currentStructure: [...],
  document: {                    // NEW
    type: "pdf" | "image",
    mediaType: "application/pdf" | "image/png" | "image/jpeg",
    data: "base64-encoded-content",
    filename: "ProjectBrief.pdf",
    size: 245000
  }
}
```

### Claude Message with Document
```javascript
// For PDF
{
  role: "user",
  content: [
    {
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: base64Data
      }
    },
    {
      type: "text",
      text: "Create a project plan based on this document"
    }
  ]
}

// For Image
{
  role: "user",
  content: [
    {
      type: "image",
      source: {
        type: "base64",
        media_type: "image/png",
        data: base64Data
      }
    },
    {
      type: "text",
      text: "Create a project plan based on this document"
    }
  ]
}
```

### File Size Limits
- **PDF:** Max 10MB (Claude limit is 32MB, but we'll be conservative)
- **Images:** Max 5MB
- **Validation:** Client-side before upload, server-side before API call

---

## Files to Modify

| File | Changes |
|------|---------|
| `api/planning-ai.js` | Accept document, build Claude message |
| `src/pages/planning/PlanningAIAssistant.jsx` | File upload UI, state, base64 conversion |
| `src/pages/planning/PlanningAIAssistant.css` | Upload zone styling |

---

## Risk Considerations

1. **Large files** - Could slow down UI; mitigate with size limits and progress indicator
2. **PDF parsing** - Some PDFs may not parse well; Claude handles this gracefully
3. **Cost** - Vision/document API calls cost more; acceptable for planning use case
4. **Memory** - Base64 increases size ~33%; client-side validation prevents issues

---

*Schedule created: 26 December 2025*
*Enhancement to: Planning AI Assistant*
