-- AMSF001 Project Tracker Database Schema
-- Network Standards and Design Architectural Services
-- GOJ/2025/2409

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE,
  role TEXT CHECK (role IN ('viewer', 'contributor', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  reference TEXT UNIQUE,
  total_budget DECIMAL(10,2),
  start_date DATE,
  end_date DATE,
  allocated_days INTEGER,
  pmo_threshold INTEGER,
  settings JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Milestones Table
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  milestone_ref TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  duration TEXT,
  budget DECIMAL(10,2),
  payment_percent INTEGER,
  status TEXT CHECK (status IN ('Not Started', 'In Progress', 'At Risk', 'Delayed', 'Completed')),
  percent_complete INTEGER DEFAULT 0,
  acceptance_criteria TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, milestone_ref)
);

-- Resources Table
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  resource_ref TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT,
  sfia_level INTEGER,
  daily_rate DECIMAL(10,2),
  discount_percent INTEGER,
  discounted_rate DECIMAL(10,2),
  days_allocated INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, resource_ref)
);

-- Timesheets Table
CREATE TABLE IF NOT EXISTS timesheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  date DATE NOT NULL,
  hours DECIMAL(3,1) CHECK (hours >= 0.5 AND hours <= 12),
  status TEXT CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Rejected')),
  comments TEXT,
  submitted_date TIMESTAMPTZ,
  approved_date TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id),
  user_id UUID REFERENCES auth.users(id),
  expense_date DATE NOT NULL,
  category TEXT,
  description TEXT,
  amount DECIMAL(10,2),
  receipt_url TEXT,
  status TEXT CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Rejected')),
  comments TEXT,
  submitted_date TIMESTAMPTZ,
  approved_date TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- KPIs Table
CREATE TABLE IF NOT EXISTS kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  kpi_ref TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  target DECIMAL(5,2),
  current_value DECIMAL(5,2),
  unit TEXT DEFAULT 'percent',
  last_measured TIMESTAMPTZ,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, kpi_ref)
);

-- Quality Checks Table
CREATE TABLE IF NOT EXISTS quality_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id),
  name TEXT NOT NULL,
  description TEXT,
  expected_outcome TEXT,
  actual_outcome TEXT,
  status TEXT CHECK (status IN ('Pending', 'Passed', 'Failed')),
  evidence_url TEXT,
  comments TEXT,
  checked_date DATE,
  checked_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log Table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_milestones_project_id ON milestones(project_id);
CREATE INDEX idx_resources_project_id ON resources(project_id);
CREATE INDEX idx_timesheets_project_id ON timesheets(project_id);
CREATE INDEX idx_timesheets_resource_id ON timesheets(resource_id);
CREATE INDEX idx_timesheets_milestone_id ON timesheets(milestone_id);
CREATE INDEX idx_timesheets_date ON timesheets(date);
CREATE INDEX idx_expenses_project_id ON expenses(project_id);
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_kpis_project_id ON kpis(project_id);
CREATE INDEX idx_quality_checks_project_id ON quality_checks(project_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Projects policies (all authenticated users can view)
CREATE POLICY "Authenticated users can view projects" ON projects
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage projects" ON projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Milestones policies
CREATE POLICY "Authenticated users can view milestones" ON milestones
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage milestones" ON milestones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Resources policies
CREATE POLICY "Authenticated users can view resources" ON resources
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage resources" ON resources
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Timesheets policies
CREATE POLICY "Users can view all timesheets" ON timesheets
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create own timesheets" ON timesheets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own timesheets" ON timesheets
  FOR UPDATE USING (
    auth.uid() = user_id AND status IN ('Draft', 'Rejected')
  );

CREATE POLICY "Admins can manage all timesheets" ON timesheets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Expenses policies (similar to timesheets)
CREATE POLICY "Users can view all expenses" ON expenses
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create own expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" ON expenses
  FOR UPDATE USING (
    auth.uid() = user_id AND status IN ('Draft', 'Rejected')
  );

CREATE POLICY "Admins can manage all expenses" ON expenses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- KPIs policies
CREATE POLICY "Authenticated users can view KPIs" ON kpis
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage KPIs" ON kpis
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Quality checks policies
CREATE POLICY "Authenticated users can view quality checks" ON quality_checks
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage quality checks" ON quality_checks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Audit log policies
CREATE POLICY "Users can view own audit logs" ON audit_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs" ON audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Functions and Triggers

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamp trigger to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_timesheets_updated_at BEFORE UPDATE ON timesheets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_kpis_updated_at BEFORE UPDATE ON kpis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_quality_checks_updated_at BEFORE UPDATE ON quality_checks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'viewer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
