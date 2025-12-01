# AMSF001 Project Tracker - Documentation Navigation Guide

**Last Updated:** 1 December 2025  
**Version:** 2.0  
**Purpose:** Central index for all project documentation

---

## 📚 Core Documents

### 1. Master Document (v3.0) ⭐ **LATEST**
**File:** `AMSF001-Master-Document-v3.md`  
**Size:** 922 lines  
**Status:** Production-Ready Documentation  
**Use When:** Need complete technical overview

**What's Inside:**
✅ System architecture with react-grid-layout  
✅ Technology stack (updated bundle sizes)  
✅ Database schema (35+ tables + dashboard_layouts)  
✅ Complete feature inventory  
✅ Full dashboard drag-and-drop documentation  
✅ Service layer (100% coverage)  
✅ Deployment configuration  
✅ Production readiness (91%)  
✅ Complete work log (1 December 2025)  

**Recent Updates (v3.0):**
- Full drag-and-drop dashboard implementation details
- Widget resizing with constraints guide
- Auto-save layout architecture
- Build troubleshooting (3 fixes documented)
- Complete 6-hour work timeline

**Target Audience:** Developers, architects, technical stakeholders

**Quick Jumps:**
- System Architecture → Section 2
- Dashboard Customization → Section 5
- Service Layer → Section 6
- Production Readiness → Section 8
- Development Roadmap → Section 9
- Today's Work Log → Appendix B

---

### 2. Development Playbook (v18.0) ⭐ **LATEST**
**File:** `AMSF001-Development-Playbook-v18.md`  
**Size:** 921 lines  
**Status:** Developer Quick Reference  
**Use When:** Building features, debugging, deploying

**What's Inside:**
✅ Quick start guide  
✅ Dashboard drag-and-drop patterns  
✅ Widget creation guide  
✅ Service layer patterns  
✅ Development workflows  
✅ Troubleshooting (with build fixes)  
✅ Code style guide  
✅ Performance optimization  
✅ Complete work log (1 December 2025)  

**Recent Updates (v18.0):**
- Drag-and-drop implementation guide
- Widget creation step-by-step
- Grid layout configuration
- Build error solutions
- Auto-save implementation
- Performance tips

**Target Audience:** Developers

**Quick Jumps:**
- Starting Development → Quick Reference
- Add New Widget → Common Tasks
- Service Layer Pattern → Architecture Patterns
- Dashboard State → Dashboard State Management
- Build Errors → Troubleshooting
- Today's Work → Appendix (Timeline)

---

### 3. User Manual (v6.0) ⭐ **LATEST**
**File:** `AMSF001-User-Manual-v6.md`  
**Size:** 806 lines  
**Status:** End-User Guide  
**Use When:** Learning to use the application

**What's Inside:**
✅ Getting started guide  
✅ Dashboard overview (v4.0 features)  
✅ Complete drag-and-drop tutorial  
✅ Widget moving instructions  
✅ Widget resizing guide  
✅ Auto-save behavior explained  
✅ Role-based defaults  
✅ Mobile experience  
✅ Feature walkthroughs  
✅ Troubleshooting FAQs  

**Recent Updates (v6.0):**
- Complete drag-and-drop instructions
- Step-by-step widget moving guide
- Widget resizing tutorial
- Visual feedback explanations
- Mobile experience details
- Dashboard quick reference card

**Target Audience:** End users, project managers, admins

**Quick Jumps:**
- Dashboard → Section 2
- Customization → Section 3
- Drag-and-Drop → Section 3.3
- Resizing → Section 3.4
- Quick Reference → End of document

---

### 4. Configuration Guide (v6.0)
**File:** `AMSF001-Configuration-Guide-v6.md`  
**Size:** 8,984 bytes  
**Status:** Setup & Deployment Guide  
**Use When:** Setting up environments, configuring services

**What's Inside:**
✅ Environment setup  
✅ Supabase configuration  
✅ Vercel deployment  
✅ Environment variables  
✅ Security setup  
✅ Database migrations  

**Target Audience:** DevOps, system administrators

---

### 5. Dashboard Customization Spec
**File:** `DASHBOARD-CUSTOMIZATION-SPEC.md`  
**Size:** 9,908 bytes  
**Status:** Feature Specification  
**Use When:** Understanding dashboard customization architecture

**What's Inside:**
✅ Feature overview  
✅ Technical architecture (simple version)  
✅ Implementation plan  
✅ Database schema  
✅ User flows  

**Note:** This spec covers the simple version (visibility toggles only). For full drag-and-drop documentation, see Master Document v3.0 or Development Playbook v18.0.

**Target Audience:** Product managers, developers

---

## 🎯 What Changed Today (1 December 2025)

### Documentation Updates

| Document | Old Version | New Version | Lines Changed |
|----------|-------------|-------------|---------------|
| Master Document | v2.0 | v3.0 | +922 lines (rewrite) |
| Development Playbook | v17.0 | v18.0 | +921 lines (rewrite) |
| User Manual | v5.0 | v6.0 | +806 lines (rewrite) |
| Documentation Guide | v1.0 | v2.0 | Updated references |

### New Content Added

1. **Full Drag-and-Drop Implementation**
   - react-grid-layout integration
   - Complete component architecture
   - Grid positioning system (x, y, w, h)
   - Auto-save with debounce

2. **Widget Resizing**
   - Resize handle styling
   - Min/max constraints per widget
   - Visual feedback system
   - Performance optimization

3. **Build Troubleshooting**
   - Missing export: getPresetForRole
   - Missing export: getAvailableWidgetsForRole
   - Syntax error fix
   - 3 Vercel deployments documented

4. **Complete Work Log**
   - 6-hour implementation timeline
   - 4 git commits documented
   - Files modified/created list
   - Challenges and solutions

5. **Updated Metrics**
   - Production Readiness: 91% (maintained)
   - Bundle Size: 495KB gzipped (+50KB for react-grid-layout)
   - Phase 2 progress: 15% (from dashboard work)

---

## 🔍 Finding Specific Information

### By Topic

**Setup & Installation**
→ Configuration Guide v6.0, Section 2-3

**Dashboard Features**
→ Master Document v3.0, Section 5  
→ User Manual v6.0, Section 2-3

**Drag-and-Drop Implementation**
→ Development Playbook v18.0, Common Tasks  
→ Master Document v3.0, Section 5.2-5.4

**Widget Creation**
→ Development Playbook v18.0, Add New Widget  
→ Master Document v3.0, Section 5.2

**Service Layer**
→ Master Document v3.0, Section 6  
→ Development Playbook v18.0, Service Layer Pattern

**Deployment**
→ Configuration Guide v6.0, Section 4  
→ Master Document v3.0, Section 7

**Troubleshooting**
→ Development Playbook v18.0, Troubleshooting  
→ User Manual v6.0, Troubleshooting section

**Today's Work**
→ Master Document v3.0, Appendix B  
→ Development Playbook v18.0, Appendix

### By File Type

**Components**
→ `/src/components/`  
→ Master Document v3.0, System Architecture

**Services**
→ `/src/services/`  
→ Master Document v3.0, Section 6

**Hooks**
→ `/src/hooks/`  
→ Development Playbook v18.0, Dashboard State

**Configuration**
→ `/src/config/`  
→ Master Document v3.0, Section 5.2

**Pages**
→ `/src/pages/`  
→ Master Document v3.0, System Architecture

### By User Role

**Developers**
→ Development Playbook v18.0 (primary)  
→ Master Document v3.0 (reference)

**End Users**
→ User Manual v6.0 (primary)  
→ Quick Reference Card at end

**DevOps/Admins**
→ Configuration Guide v6.0 (primary)  
→ Master Document v3.0, Section 7

**Project Managers**
→ User Manual v6.0 (primary)  
→ Master Document v3.0, Executive Summary

**Architects**
→ Master Document v3.0 (primary)  
→ Development Playbook v18.0 (patterns)

---

## 📊 Current Project Status

### Production Readiness: 91%

| Category | Score | Status |
|----------|-------|--------|
| Overall | 91% | ✅ Production Ready |
| Service Layer | 100% | ✅ Complete |
| Dashboard UX | 95% | ✅ Drag-and-drop live |
| Code Quality | 85% | 🟡 Good |
| Testing | 0% | 🔴 Critical Gap |
| Documentation | 100% | ✅ Comprehensive |

### Recent Achievements (1 December 2025)

✅ Full drag-and-drop dashboard  
✅ Widget resizing with constraints  
✅ Auto-save layout positions  
✅ All build issues resolved  
✅ Production deployment successful  
✅ Documentation fully updated  

### Phase Progress

**Phase 1: Stabilization** - ✅ 100% Complete  
**Phase 2: Multi-Tenant & Reporting** - 🔄 15% Complete  
- Dashboard customization: ✅ Complete
- Multi-tenant architecture: 📋 Planned
- Advanced reporting: 📋 Planned

---

## 🚀 Quick Actions

### For Developers

**Start Development:**
```bash
git clone repo
cd amsf001-project-tracker
npm install
npm run dev
```
→ See Development Playbook v18.0, Quick Reference

**Add New Widget:**
1. Update WIDGET_REGISTRY (dashboardPresets.js)
2. Add to presets (dashboardPresets.js)
3. Add to renderWidget() (Dashboard.jsx)

→ See Development Playbook v18.0, Common Tasks

**Fix Build Error:**
1. Check Vercel logs
2. Test locally: `npm run build`
3. See Troubleshooting section

→ See Development Playbook v18.0, Troubleshooting

### For End Users

**Customize Dashboard:**
1. Click "Customize" button
2. Toggle widget visibility
3. Click "Apply Changes"

→ See User Manual v6.0, Section 3

**Drag Widgets:**
1. Hover over widget
2. Grab drag handle (⋮⋮ icon)
3. Drag to new position
4. Auto-saves after 1 second

→ See User Manual v6.0, Section 3.3

**Resize Widgets:**
1. Hover over bottom-right corner
2. Grab resize handle
3. Drag to resize
4. Auto-saves after 1 second

→ See User Manual v6.0, Section 3.4

### For Admins

**Deploy to Production:**
```bash
git push origin main
```
→ Vercel auto-deploys

→ See Configuration Guide v6.0, Section 4

**Manage Users:**
Settings → Users → Invite User

→ See User Manual v6.0, Section 8

---

## 🆘 Common Questions

### Q: Where's the complete technical overview?
**A:** Master Document v3.0 (922 lines, comprehensive)

### Q: How do I implement drag-and-drop?
**A:** Development Playbook v18.0, Section "Dashboard Drag-and-Drop Implementation"

### Q: How do I use the dashboard as an end user?
**A:** User Manual v6.0, Sections 2-3 (Dashboard and Customization)

### Q: What changed today?
**A:** See "What Changed Today" section above, or Master Document v3.0 Appendix B

### Q: Where are the file locations?
**A:** Master Document v3.0, System Architecture section

### Q: How do I troubleshoot build errors?
**A:** Development Playbook v18.0, Troubleshooting → Build Errors

### Q: What's the auto-save behavior?
**A:** User Manual v6.0, Section 3.6 or Development Playbook v18.0, Dashboard State Management

### Q: What are the role-based presets?
**A:** User Manual v6.0, Section 3.7 or Master Document v3.0, Section 5.3

### Q: How do I add a new service?
**A:** Development Playbook v18.0, Common Tasks → Create New Service

### Q: What's next on the roadmap?
**A:** Master Document v3.0, Section 9 (Development Roadmap)

---

## 📝 Document Maintenance

### When to Update

Update documentation when:
- ✅ New features added (immediately)
- ✅ Architecture changes (immediately)
- ✅ Major work completed (same day)
- 🔄 Lessons learned (as they happen)
- 📅 Monthly reviews (production readiness)

### Version Numbering

**Major version (v3.0 → v4.0):**
- Complete rewrites
- Major feature additions
- Architecture changes

**Minor version (v3.0 → v3.1):**
- New sections added
- Significant updates
- Multiple changes

**Patch version (v3.1 → v3.1.1):**
- Typo fixes
- Minor clarifications
- Link updates

### Update Process

1. Identify which documents need updates
2. Open each document
3. Update relevant sections
4. Bump version number
5. Update "Last Updated" date
6. Update this guide if needed
7. Commit with clear message

---

## ✅ Verification Checklist

Today's documentation update checklist:

- [x] Master Document v3.0 created (922 lines)
- [x] Development Playbook v18.0 created (921 lines)
- [x] User Manual v6.0 created (806 lines)
- [x] Documentation Guide updated (this file)
- [x] All drag-and-drop features documented
- [x] Build fixes documented
- [x] Work log completed
- [x] Version numbers updated
- [x] All cross-references updated
- [x] Ready to commit

---

## 🎉 Summary

**All documentation is now fully up to date** with today's work:

| Document | Version | Status | Primary Use |
|----------|---------|--------|-------------|
| Master Document | v3.0 | ✅ Current | Technical reference |
| Development Playbook | v18.0 | ✅ Current | Developer guide |
| User Manual | v6.0 | ✅ Current | End-user guide |
| Configuration Guide | v6.0 | ✅ Current | Setup guide |
| Dashboard Spec | v1.0 | 📋 Historical | Feature spec |

**Next Update:** 8 December 2025 (weekly review)

---

**Document Version:** 2.0  
**Last Updated:** 1 December 2025  
**Maintained By:** Development Team

---

*End of Documentation Guide*
