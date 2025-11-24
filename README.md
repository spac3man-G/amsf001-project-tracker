# AMSF001 Project Tracker - Setup Instructions

## Network Standards and Design Architectural Services
**Project Reference:** GOJ/2025/2409  
**Budget:** £326,829  
**Duration:** 20 weeks  

---

## 🚀 Quick Setup Guide

### Step 1: Upload Files to GitHub

1. **Download all files** from this folder to your computer
2. **Go to your GitHub repository**: https://github.com/spac3man-G/amsf001-project-tracker
3. **Click** "Add file" → "Upload files"
4. **Drag and drop** ALL the files and folders:
   - `package.json`
   - `vite.config.js`
   - `index.html`
   - `src/` folder (with all files inside)
   - `database-schema.sql`
   - This `README.md`
5. **Scroll down**, write commit message: "Initial project setup"
6. **Click** "Commit changes"

### Step 2: Wait for Vercel Deployment

1. **Go to Vercel**: https://vercel.com/dashboard
2. **Find** your amsf001-project-tracker project
3. **Watch** the deployment (should take 1-2 minutes)
4. **Once complete**, click "Visit" to see your app

### Step 3: Set Up Database Tables

1. **Go to Supabase**: https://supabase.com/dashboard
2. **Click** on your amsf001-tracker project
3. **Click** "SQL Editor" in the left sidebar
4. **Click** "New Query"
5. **Copy** the ENTIRE contents of `database-schema.sql`
6. **Paste** into the SQL editor
7. **Click** "Run" (or press Ctrl+Enter)
8. **You should see** "Success. No rows returned"

### Step 4: Create Your Admin User

1. **Go to your app**: https://amsf001-project-tracker.vercel.app
2. **Click** "Don't have an account? Sign Up"
3. **Enter**:
   - Email: glenn@nickols.com (or your preferred email)
   - Password: (choose a strong password)
4. **Click** "Sign Up"
5. **Check your email** for confirmation link
6. **Click** the confirmation link in the email

### Step 5: Make Yourself an Admin

1. **Go back to Supabase SQL Editor**
2. **Run this query** (replace with your email):
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'glenn@nickols.com';
```
3. **Click** "Run"

### Step 6: You're Done! 

**Your app is now live at:** https://amsf001-project-tracker.vercel.app

---

## 📊 What's Included

### Features Available Now:
- ✅ **Dashboard** - Project overview with charts and statistics
- ✅ **Milestones** - All 12 project milestones with budget tracking
- ✅ **Resources** - 8 team members with rates and allocations
- ✅ **KPIs** - 11 performance indicators from SOW
- ✅ **User Authentication** - Secure login system
- ✅ **Real-time Updates** - Changes appear instantly for all users

### Coming Soon:
- 🔄 **Timesheets** - Time entry and approval workflow
- 🔄 **Expenses** - Expense tracking and approvals
- 🔄 **Reports** - Export to Excel/PDF
- 🔄 **User Management** - Add team members with different roles

---

## 👥 Adding Team Members

### To add users:
1. Have them sign up at your app URL
2. Go to Supabase → SQL Editor
3. Run one of these queries:

**For read-only users:**
```sql
UPDATE profiles SET role = 'viewer' WHERE email = 'user@email.com';
```

**For contributors (can add timesheets/expenses):**
```sql
UPDATE profiles SET role = 'contributor' WHERE email = 'user@email.com';
```

**For admins (full access):**
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'user@email.com';
```

---

## 🔧 Troubleshooting

### "Page not found" error
- Wait 2-3 minutes for deployment to complete
- Refresh the page

### Can't log in
- Check email for confirmation link
- Make sure you clicked "Sign Up" first, not "Sign In"

### Database error
- Make sure you ran the database-schema.sql file
- Check Supabase is not paused (free tier pauses after 1 week of inactivity)

### Deployment failed
- Check environment variables in Vercel settings
- Make sure all files were uploaded to GitHub

---

## 📈 Project Data

The application includes all data from your SOW:

### Milestones (12 total)
- M01: JT Assisted Review (£16,341 - 5%)
- M02: Document c.10 Standards (£32,683 - 10%)
- M03: Document c.20 Standards (£65,366 - 20%)
- M04a: TRM - DC & Sites Large (£32,683 - 10%)
- M04b: TRM - Sites Small & Connectivity (£16,341 - 5%)
- M05: Network Health Methodology Sites (£16,341 - 5%)
- M06: Network Health Methodology DCs (£16,341 - 5%)
- M07: Network Health Audit x2 DCs (£16,341 - 5%)
- M08: Network Health Audit Report (£49,024 - 15%)
- M09: Ongoing Architectural Support (£32,683 - 10%)
- M10: Final Deliverables & KT (£16,341 - 5%)
- M11: Project Closure & Review (£16,341 - 5%)

### Resources (8 team members)
- 2 Senior Network Architects (L5)
- 1 Lead Surveyor (L4)
- 2 Senior Infrastructure Engineers (L5)
- 2 Network Consultants (L4)
- 1 Junior Network Engineer (L4)

### KPIs (11 indicators)
- Time Performance (3 KPIs)
- Quality of Collaboration (4 KPIs)
- Delivery Performance (4 KPIs)

---

## 💰 Costs

**Current costs:** £0/month (free tier)

**If you exceed free limits:**
- Supabase Pro: $25/month (8GB database, unlimited users)
- Vercel: Free tier is very generous, unlikely to exceed

---

## 📞 Need Help?

### Quick fixes:
1. **Restart Supabase if paused**: Supabase dashboard → Settings → Restart
2. **Redeploy on Vercel**: Deployments tab → three dots → Redeploy
3. **Check logs**: Vercel dashboard → Functions tab → View logs

### Common issues:
- **Supabase paused**: Free tier pauses after 7 days inactive
- **API key issues**: Check environment variables in Vercel
- **Database not set up**: Re-run the SQL schema file

---

## 🔐 Security Notes

- All data is encrypted in transit and at rest
- Row Level Security (RLS) ensures users only see permitted data
- Regular backups are automatic in Supabase
- No credit card required for current setup

---

**Congratulations! Your AMSF001 Project Tracker is ready to use!** 🎉

For any issues, check the Supabase and Vercel dashboards for error logs.
