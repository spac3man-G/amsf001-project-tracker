-- Seed data for benchmark_rates table
-- Run this after the migration to populate initial rate data
-- Source: ITJobsWatch, G-Cloud, UK market research Dec 2025

-- Clear existing data (optional - comment out if you want to preserve)
-- DELETE FROM benchmark_rates;

INSERT INTO benchmark_rates (
  role_id, role_name, role_family_id, role_family_name,
  skill_id, skill_name, sfia_level,
  contractor_rate, associate_rate, top4_rate,
  source, effective_date
) VALUES
  -- Software Engineering
  ('DEV', 'Software Developer', 'SE', 'Software Engineering', 'JAVA', 'Java', 3, 525, 750, 1100, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('DEV', 'Software Developer', 'SE', 'Software Engineering', 'JAVA', 'Java', 4, 600, 850, 1250, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('DEV', 'Software Developer', 'SE', 'Software Engineering', 'PYTHON', 'Python', 3, 500, 720, 1050, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('DEV', 'Software Developer', 'SE', 'Software Engineering', 'PYTHON', 'Python', 4, 575, 820, 1200, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('DEV', 'Software Developer', 'SE', 'Software Engineering', 'DOTNET', '.NET/C#', 3, 500, 700, 1000, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('DEV', 'Software Developer', 'SE', 'Software Engineering', 'DOTNET', '.NET/C#', 4, 575, 800, 1150, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('DEV', 'Software Developer', 'SE', 'Software Engineering', 'JS', 'JavaScript/TypeScript', 3, 475, 680, 980, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('DEV', 'Software Developer', 'SE', 'Software Engineering', 'JS', 'JavaScript/TypeScript', 4, 550, 780, 1120, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('SDEV', 'Senior Developer', 'SE', 'Software Engineering', 'JAVA', 'Java', 4, 650, 920, 1350, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('SDEV', 'Senior Developer', 'SE', 'Software Engineering', 'JAVA', 'Java', 5, 750, 1050, 1550, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('SDEV', 'Senior Developer', 'SE', 'Software Engineering', 'PYTHON', 'Python', 4, 625, 880, 1300, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('SDEV', 'Senior Developer', 'SE', 'Software Engineering', 'PYTHON', 'Python', 5, 725, 1000, 1480, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('LDEV', 'Lead Developer', 'SE', 'Software Engineering', 'JAVA', 'Java', 5, 800, 1150, 1700, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('LDEV', 'Lead Developer', 'SE', 'Software Engineering', 'JAVA', 'Java', 6, 900, 1300, 1950, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('ARCH', 'Solutions Architect', 'SE', 'Software Engineering', 'AWS', 'AWS', 5, 850, 1200, 1800, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('ARCH', 'Solutions Architect', 'SE', 'Software Engineering', 'AWS', 'AWS', 6, 950, 1400, 2100, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('ARCH', 'Solutions Architect', 'SE', 'Software Engineering', 'AZURE', 'Azure', 5, 825, 1150, 1750, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('ARCH', 'Solutions Architect', 'SE', 'Software Engineering', 'AZURE', 'Azure', 6, 925, 1350, 2050, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),

  -- Data & Analytics
  ('DATASCI', 'Data Scientist', 'DA', 'Data & Analytics', 'PYTHON', 'Python', 4, 600, 850, 1300, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('DATASCI', 'Data Scientist', 'DA', 'Data & Analytics', 'PYTHON', 'Python', 5, 700, 1000, 1500, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('DATASCI', 'Data Scientist', 'DA', 'Data & Analytics', 'ML', 'Machine Learning', 4, 650, 920, 1400, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('DATASCI', 'Data Scientist', 'DA', 'Data & Analytics', 'ML', 'Machine Learning', 5, 775, 1100, 1650, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('DATAENG', 'Data Engineer', 'DA', 'Data & Analytics', 'SPARK', 'Spark/Big Data', 4, 575, 820, 1220, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('DATAENG', 'Data Engineer', 'DA', 'Data & Analytics', 'SPARK', 'Spark/Big Data', 5, 675, 950, 1420, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('DATAENG', 'Data Engineer', 'DA', 'Data & Analytics', 'SQL', 'SQL/Databases', 4, 525, 750, 1100, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('MLENG', 'ML Engineer', 'DA', 'Data & Analytics', 'ML', 'Machine Learning', 4, 700, 1000, 1500, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('MLENG', 'ML Engineer', 'DA', 'Data & Analytics', 'ML', 'Machine Learning', 5, 825, 1180, 1750, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  
  -- DevOps & Cloud
  ('DEVOPS', 'DevOps Engineer', 'DEVOPS', 'DevOps & Cloud', 'K8S', 'Kubernetes', 4, 600, 850, 1280, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('DEVOPS', 'DevOps Engineer', 'DEVOPS', 'DevOps & Cloud', 'K8S', 'Kubernetes', 5, 700, 1000, 1500, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('DEVOPS', 'DevOps Engineer', 'DEVOPS', 'DevOps & Cloud', 'AWS', 'AWS', 4, 575, 820, 1220, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('DEVOPS', 'DevOps Engineer', 'DEVOPS', 'DevOps & Cloud', 'AWS', 'AWS', 5, 675, 950, 1420, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('DEVOPS', 'DevOps Engineer', 'DEVOPS', 'DevOps & Cloud', 'TERRAFORM', 'Terraform', 4, 550, 780, 1160, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('SRE', 'Site Reliability Engineer', 'DEVOPS', 'DevOps & Cloud', 'K8S', 'Kubernetes', 5, 725, 1030, 1550, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('CLOUD', 'Cloud Engineer', 'DEVOPS', 'DevOps & Cloud', 'AWS', 'AWS', 4, 600, 850, 1280, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('CLOUD', 'Cloud Engineer', 'DEVOPS', 'DevOps & Cloud', 'AZURE', 'Azure', 4, 580, 820, 1240, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('PLAT', 'Platform Engineer', 'DEVOPS', 'DevOps & Cloud', 'K8S', 'Kubernetes', 5, 700, 1000, 1500, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  
  -- Security
  ('SECENG', 'Security Engineer', 'SEC', 'Security', 'AWS', 'AWS', 4, 625, 880, 1320, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('SECENG', 'Security Engineer', 'SEC', 'Security', 'AWS', 'AWS', 5, 725, 1020, 1540, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('SECARCH', 'Security Architect', 'SEC', 'Security', 'AWS', 'AWS', 5, 800, 1140, 1720, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('SECARCH', 'Security Architect', 'SEC', 'Security', 'AWS', 'AWS', 6, 925, 1320, 2000, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('PENT', 'Penetration Tester', 'SEC', 'Security', 'AWS', 'AWS', 4, 650, 920, 1380, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),

  -- Business Analysis
  ('BA', 'Business Analyst', 'BA', 'Business Analysis', 'AGILE', 'Agile/Scrum', 3, 450, 640, 960, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('BA', 'Business Analyst', 'BA', 'Business Analysis', 'AGILE', 'Agile/Scrum', 4, 525, 750, 1120, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('SBA', 'Senior Business Analyst', 'BA', 'Business Analysis', 'AGILE', 'Agile/Scrum', 4, 575, 820, 1220, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('SBA', 'Senior Business Analyst', 'BA', 'Business Analysis', 'AGILE', 'Agile/Scrum', 5, 650, 920, 1380, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('PO', 'Product Owner', 'BA', 'Business Analysis', 'AGILE', 'Agile/Scrum', 4, 600, 850, 1280, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('PO', 'Product Owner', 'BA', 'Business Analysis', 'AGILE', 'Agile/Scrum', 5, 700, 1000, 1500, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  
  -- Project Management
  ('PM', 'Project Manager', 'PM', 'Project Management', 'AGILE', 'Agile/Scrum', 4, 550, 780, 1180, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('PM', 'Project Manager', 'PM', 'Project Management', 'AGILE', 'Agile/Scrum', 5, 650, 920, 1380, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('SPM', 'Senior Project Manager', 'PM', 'Project Management', 'AGILE', 'Agile/Scrum', 5, 700, 1000, 1500, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('SPM', 'Senior Project Manager', 'PM', 'Project Management', 'AGILE', 'Agile/Scrum', 6, 800, 1150, 1720, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('DELM', 'Delivery Manager', 'PM', 'Project Management', 'AGILE', 'Agile/Scrum', 5, 725, 1030, 1550, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('PROG', 'Programme Manager', 'PM', 'Project Management', 'AGILE', 'Agile/Scrum', 6, 900, 1300, 1950, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE),
  ('PROG', 'Programme Manager', 'PM', 'Project Management', 'AGILE', 'Agile/Scrum', 7, 1050, 1500, 2250, 'ITJobsWatch/G-Cloud Dec 2025', CURRENT_DATE)

ON CONFLICT (role_id, skill_id, sfia_level) 
DO UPDATE SET
  role_name = EXCLUDED.role_name,
  role_family_id = EXCLUDED.role_family_id,
  role_family_name = EXCLUDED.role_family_name,
  skill_name = EXCLUDED.skill_name,
  contractor_rate = EXCLUDED.contractor_rate,
  associate_rate = EXCLUDED.associate_rate,
  top4_rate = EXCLUDED.top4_rate,
  source = EXCLUDED.source,
  effective_date = EXCLUDED.effective_date,
  updated_at = NOW();

-- Verify seed data
-- SELECT COUNT(*) as total_rates FROM benchmark_rates;
-- SELECT role_family_id, COUNT(*) as count FROM benchmark_rates GROUP BY role_family_id ORDER BY role_family_id;
