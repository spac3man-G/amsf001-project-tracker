# AI Assistant Update - Starting Prompt

**Use this prompt to begin the AI Assistant update in a new Claude chat.**

---

## Prompt to Copy:

```
## Project: AMSF001 Project Tracker - AI Assistant Update

I need to update the AI chat assistant to support all current application features. A comprehensive plan has been created.

### Context
- This is a multi-tenant SaaS project management application
- The AI chat assistant is built with Claude API (Sonnet/Haiku)
- It currently has 12 database query tools but the app has grown significantly
- The assistant needs ~18 new tools to cover Planning, Estimator, Evaluator, RAID, Variations, etc.

### Your First Steps

1. **Read the implementation plan:**
   ```
   /Users/glennnickols/Projects/amsf001-project-tracker/docs/AI-ASSISTANT-UPDATE-PLAN.md
   ```

2. **Read the current chat API to understand existing patterns:**
   ```
   /Users/glennnickols/Projects/amsf001-project-tracker/api/chat.js
   ```

3. **Start with Segment 1: RAID Log Tools**
   - Add `getRaidItems` tool definition
   - Add `getRaidSummary` tool definition  
   - Implement execution functions
   - Update the tool router switch statement
   - Add error messages for the new tools

### Key Files
- `api/chat.js` - Main chat API with tool definitions and execution
- `api/chat-context.js` - Pre-fetch context for instant responses
- `src/lib/chatSuggestions.js` - Page-specific question suggestions
- `src/contexts/ChatContext.jsx` - Frontend chat state

### Working Style
- Follow the exact patterns in the existing code
- Each segment has a checklist - tick items off as you complete them
- After completing Segments 1-2, check context usage and ask if I want to continue or start a new chat
- The plan has ready-made continuation prompts at each checkpoint

Please read the plan document first, then begin implementing Segment 1.
```

---

## Notes

- The plan document is 2,445 lines with full code examples for every segment
- Expect to need 3-4 chat sessions to complete all 12 segments
- Each segment is designed to be independently testable
- The plan includes validation steps and testing queries

