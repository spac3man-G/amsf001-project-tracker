# User Management: Understanding Team Members, Resources & System Users

**Document Version:** 1.0  
**Last Updated:** 12 December 2025

---

## Executive Summary

The AMSF001 Project Tracker has three distinct concepts for managing people:

| Page | Purpose | Scope | Who Can Access |
|------|---------|-------|----------------|
| **Team Members** | Manage who has ACCESS to a project | Per-project | Admin, Supplier PM |
| **Resources** | Manage billable WORK assignments | Per-project | Admin, Supplier PM, Customer PM |
| **System Users** | Manage user ACCOUNTS system-wide | Global | Admin only |

---

## 1. Understanding the Three Concepts

### 1.1 Team Members (Project Access)

**What it is:** Controls WHO can log in and see a specific project.

**Database table:** `user_projects` (links users to projects)

**Key points:**
- A user must be a Team Member to access ANY project data
- Each project has its own team member list
- The same person can be in multiple projects with DIFFERENT roles
- Roles are project-scoped (e.g., Admin in Project A, Viewer in Project B)

**Use cases:**
- "Add Sarah to the GNFM project as Customer PM"
- "Remove John from this project" (he keeps his account, just loses access to THIS project)
- "Change Mike's role from Viewer to Contributor for this project"

### 1.2 Resources (Billable Work)

**What it is:** Tracks WHO does billable work, their rates, and time/cost calculations.

**Database table:** `resources` (stores rate cards, SFIA levels, etc.)

**Key points:**
- Resources have financial data: sell price, cost price, margins
- Resources track days worked (from validated timesheets)
- A Resource can be LINKED to a Team Member (user account)
- Resources exist independently - you can have a Resource without a linked user

**Use cases:**
- "Add a new contractor at SFIA Level 5, £750/day"
- "Track how many days each resource has worked"
- "Calculate project spend based on resource rates"

### 1.3 System Users (User Accounts)

**What it is:** The master list of ALL user accounts that exist in the system.

**Database table:** `profiles` (stores account info)

**Key points:**
- Admin-only access
- Shows ALL users across ALL projects
- This is where you CREATE new accounts
- Global role (for system administration) is stored here

**Use cases:**
- "Create an account for a new employee"
- "See how many projects each user is assigned to"
- "Mark a user as a test account"

---

## 2. How They Relate to Each Other

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SYSTEM USERS                                  │
│                     (profiles table)                                 │
│                                                                      │
│   All user accounts in the system                                   │
│   - john@company.com (Admin)                                        │
│   - sarah@company.com (Supplier PM)                                 │
│   - mike@client.com (Viewer)                                        │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            │ user_projects links users to projects
                            ▼
┌───────────────────────────────────────┐    ┌────────────────────────┐
│         TEAM MEMBERS                   │    │     TEAM MEMBERS       │
│         (Project A)                    │    │     (Project B)        │
│                                        │    │                        │
│  - john@company.com → Admin            │    │ - sarah@company.com    │
│  - sarah@company.com → Supplier PM     │    │       → Supplier PM    │
│  - mike@client.com → Customer PM       │    │ - mike@client.com      │
│                                        │    │       → Viewer         │
└───────────────────────┬────────────────┘    └────────────────────────┘
                        │
                        │ resources.user_id links to profiles.id
                        ▼
┌───────────────────────────────────────┐
│            RESOURCES                   │
│            (Project A)                 │
│                                        │
│  - "John Smith" → £850/day (L6)        │◄── Linked to john@company.com
│  - "Sarah Jones" → £650/day (L4)       │◄── Linked to sarah@company.com
│  - "External Dev" → £500/day (L3)      │    (No user link - contractor)
│                                        │
└────────────────────────────────────────┘
```

### The Key Relationships:

1. **System User → Team Member:** A user account can be added to multiple projects
2. **Team Member → Resource:** A team member can be linked to a resource for billing
3. **Resource → Team Member:** Optional - resources can exist without a user link

---

## 3. User Guide: Team Members Page

### 3.1 Accessing the Page

**Navigation:** Sidebar → Team Members  
**URL:** `/team-members`  
**Who can access:** Admin, Supplier PM

### 3.2 Page Overview

The Team Members page shows all users who have access to the **current project**. It displays:

- User name and avatar
- Email address
- Linked resource (if any)
- Project role
- Date added to project
- Test user indicator (when "Show Test" is enabled)

### 3.3 Features

#### Adding a Team Member

1. Click **"Add Team Member"** button (top right)
2. In the modal:
   - **Select User:** Choose from existing system users not already in this project
   - **Project Role:** Select the role for this project
3. Click **"Add to Project"**

**Note:** You can only add users who already have an account. To create a new account, use System Users (Admin only).

#### Changing a Role

1. Click on the **role badge** (e.g., "Viewer")
2. A dropdown appears with all available roles
3. Select the new role
4. The change is saved immediately

**Available Roles:**
| Role | Description |
|------|-------------|
| Admin | Full system access |
| Supplier PM | Full access + validates timesheets/expenses |
| Supplier Finance | Financial management (supplier side) |
| Customer PM | Reviews deliverables, validates timesheets |
| Customer Finance | Financial management (customer side) |
| Contributor | Submits timesheets & expenses |
| Viewer | Read-only dashboard access |

#### Linking to a Resource

If a team member does billable work, you can link them to a resource:

1. Click **"Link resource"** in the Linked Resource column
2. Select the resource from the dropdown
3. Click the ✓ button to save

**Why link?** When linked:
- The resource automatically inherits the user's name/email
- Timesheets submitted by the user can be matched to the resource
- Reports show the connection between user and billing rate

#### Unlinking a Resource

1. Find the linked resource name
2. Click the **unlink icon** (broken chain)
3. Confirm the action

#### Removing a Team Member

1. Click the **X button** at the end of the row
2. Confirm in the dialog

**Important:**
- You cannot remove yourself
- Removing someone only removes their access to THIS project
- Their user account remains active for other projects
- Any timesheets/expenses they submitted remain in the system

#### Show/Hide Test Users

1. Click **"Show Test"** button (top right)
2. Test users (marked in the system) will appear with a "Test" badge
3. Click **"Hide Test"** to hide them again

#### Refresh Data

Click the **refresh icon** (🔄) to reload the team member list.

### 3.4 Understanding the Role Legend

At the bottom of the page, a legend shows all available roles and their permissions:

- **Admin:** Full system access to everything
- **Supplier PM:** Can manage team, validate timesheets, full project access
- **Supplier Finance:** Focus on financial data from supplier perspective
- **Customer PM:** Can review deliverables and validate timesheets
- **Customer Finance:** Focus on financial data from customer perspective  
- **Contributor:** Day-to-day work - submits time and expenses
- **Viewer:** Can see dashboards and reports but cannot edit

### 3.5 Empty State

If no team members are assigned to the project, you'll see:
- A friendly message: "No team members assigned to this project yet"
- An **"Add First Team Member"** button

### 3.6 What Happens Behind the Scenes

When you make changes on this page:

| Action | Database Change |
|--------|-----------------|
| Add team member | INSERT into `user_projects` |
| Remove team member | DELETE from `user_projects` |
| Change role | UPDATE `user_projects.role` |
| Link resource | UPDATE `resources.user_id` |
| Unlink resource | SET `resources.user_id` to NULL |

**Key point:** Changing a role here changes the user's role **for this project only**. Their role in other projects is unaffected.

---

## 4. Comparison: Old Users Page vs New Pages

### What Changed

| Old Users Page | New Team Members | New System Users |
|---------------|------------------|------------------|
| Showed ALL users | Shows only current project users | Shows ALL users |
| Could create accounts | Cannot create accounts | Can create accounts |
| Changed `profiles.role` | Changes `user_projects.role` | Views `profiles.role` |
| One page for everything | Project-scoped management | System-wide management |
| Anyone with access | Admin + Supplier PM | Admin only |

### Why the Change?

1. **Multi-project support:** Users can now have different roles in different projects
2. **Clearer separation:** Project access (Team Members) vs Account management (System Users)
3. **Better security:** Only admins can create accounts
4. **Accurate data:** Team Members shows who's actually on YOUR project

---

## 5. Common Workflows

### Workflow 1: Onboarding a New Team Member

**If they already have an account:**
1. Go to Team Members
2. Click "Add Team Member"
3. Select their name and assign a role
4. (Optional) Go to Resources and create/link a resource for billing

**If they need a new account:**
1. Ask an Admin to go to System Users
2. Admin creates the account
3. Then follow steps above to add them to your project

### Workflow 2: Moving Someone to a Different Project

1. In the **old project's** Team Members page, remove them
2. In the **new project's** Team Members page, add them
3. Their account remains unchanged, only project access changes

### Workflow 3: Changing Someone's System-Wide Role

This is rare - the global role is mainly for system administration.
1. Admin goes to System Users
2. Find the user
3. (Currently view-only - global role changes require database access)

### Workflow 4: Setting Up a Contractor (Resource Only)

If someone does work but doesn't need system access:
1. Go to Resources page
2. Add a new resource with their name and rates
3. Leave the user link empty
4. They appear in reports but can't log in

---

## 6. FAQ

**Q: Why can't I see the "Add Team Member" button?**  
A: Only Admin and Supplier PM roles can manage team members.

**Q: I removed someone but they can still log in?**  
A: Removing from Team Members only removes project access. Their account still exists. To fully deactivate an account, contact an Admin.

**Q: Can someone have different roles in different projects?**  
A: Yes! This is a key feature. John might be Admin in Project A but Viewer in Project B.

**Q: What's the difference between Team Member role and Resource rate?**  
A: Role controls what they can DO (permissions). Resource rate controls how they're BILLED (£/day).

**Q: Why don't I see System Users in my navigation?**  
A: System Users is Admin-only. Only users with the Admin role see this menu item.

**Q: I changed someone's role but it didn't work?**  
A: Make sure you're on the right project. Role changes are project-specific. Check the project selector in the header.

---

## 7. Technical Reference

### Database Tables

```sql
-- User accounts (global)
profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT,           -- Global role (for admin purposes)
  is_test_user BOOLEAN
)

-- Project membership (project-scoped)
user_projects (
  id UUID PRIMARY KEY,
  user_id UUID,        -- Links to profiles.id
  project_id UUID,     -- Links to projects.id
  role TEXT,           -- Role FOR THIS PROJECT
  is_default BOOLEAN,
  created_at TIMESTAMP
)

-- Billable resources (project-scoped)
resources (
  id UUID PRIMARY KEY,
  project_id UUID,
  user_id UUID,        -- Optional link to profiles.id
  name TEXT,
  email TEXT,
  sell_price DECIMAL,
  cost_price DECIMAL,
  sfia_level TEXT
)
```

### Role Hierarchy

```
admin (Level 6)
   └── supplier_pm (Level 5)
          ├── supplier_finance (Level 4)
          └── customer_pm (Level 4)
                 └── customer_finance (Level 3)
                        └── contributor (Level 2)
                               └── viewer (Level 1)
```

---

*End of Document*
