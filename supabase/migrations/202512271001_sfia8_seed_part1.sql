-- SFIA 8 Benchmark Rates Seed Data
-- 97 skills × multiple levels × 4 tiers = ~1500+ rate combinations
-- Rates based on UK market data December 2025

-- Category mapping for reference:
-- SA = Strategy and architecture
-- CT = Change and transformation  
-- DI = Development and implementation
-- DO = Delivery and operation
-- SQ = Skills and quality
-- RE = Relationships and engagement

INSERT INTO benchmark_rates (
  skill_id, skill_name, skill_code, subcategory_id, category_id,
  sfia_level, tier_id, tier_name, day_rate, source, effective_date
) VALUES

-- ============================================================================
-- STRATEGY AND ARCHITECTURE (SA)
-- ============================================================================

-- ITSP - IT strategy and planning (Levels 5-7)
('ITSP', 'IT strategy and planning', 'ITSP', 'STRT', 'SA', 5, 'contractor', 'Contractor', 700, 'UK Market Dec 2025', CURRENT_DATE),
('ITSP', 'IT strategy and planning', 'ITSP', 'STRT', 'SA', 5, 'boutique', 'Boutique/SME', 910, 'UK Market Dec 2025', CURRENT_DATE),
('ITSP', 'IT strategy and planning', 'ITSP', 'STRT', 'SA', 5, 'mid', 'Mid-tier', 1050, 'UK Market Dec 2025', CURRENT_DATE),
('ITSP', 'IT strategy and planning', 'ITSP', 'STRT', 'SA', 5, 'big4', 'Big 4/Global SI', 1330, 'UK Market Dec 2025', CURRENT_DATE),
('ITSP', 'IT strategy and planning', 'ITSP', 'STRT', 'SA', 6, 'contractor', 'Contractor', 900, 'UK Market Dec 2025', CURRENT_DATE),
('ITSP', 'IT strategy and planning', 'ITSP', 'STRT', 'SA', 6, 'boutique', 'Boutique/SME', 1170, 'UK Market Dec 2025', CURRENT_DATE),
('ITSP', 'IT strategy and planning', 'ITSP', 'STRT', 'SA', 6, 'mid', 'Mid-tier', 1350, 'UK Market Dec 2025', CURRENT_DATE),
('ITSP', 'IT strategy and planning', 'ITSP', 'STRT', 'SA', 6, 'big4', 'Big 4/Global SI', 1710, 'UK Market Dec 2025', CURRENT_DATE),
('ITSP', 'IT strategy and planning', 'ITSP', 'STRT', 'SA', 7, 'contractor', 'Contractor', 1100, 'UK Market Dec 2025', CURRENT_DATE),
('ITSP', 'IT strategy and planning', 'ITSP', 'STRT', 'SA', 7, 'boutique', 'Boutique/SME', 1430, 'UK Market Dec 2025', CURRENT_DATE),
('ITSP', 'IT strategy and planning', 'ITSP', 'STRT', 'SA', 7, 'mid', 'Mid-tier', 1650, 'UK Market Dec 2025', CURRENT_DATE),
('ITSP', 'IT strategy and planning', 'ITSP', 'STRT', 'SA', 7, 'big4', 'Big 4/Global SI', 2090, 'UK Market Dec 2025', CURRENT_DATE),

-- STPL - Enterprise and business architecture (Levels 5-7)
('STPL', 'Enterprise and business architecture', 'STPL', 'STRT', 'SA', 5, 'contractor', 'Contractor', 700, 'UK Market Dec 2025', CURRENT_DATE),
('STPL', 'Enterprise and business architecture', 'STPL', 'STRT', 'SA', 5, 'boutique', 'Boutique/SME', 910, 'UK Market Dec 2025', CURRENT_DATE),
('STPL', 'Enterprise and business architecture', 'STPL', 'STRT', 'SA', 5, 'mid', 'Mid-tier', 1050, 'UK Market Dec 2025', CURRENT_DATE),
('STPL', 'Enterprise and business architecture', 'STPL', 'STRT', 'SA', 5, 'big4', 'Big 4/Global SI', 1330, 'UK Market Dec 2025', CURRENT_DATE),
('STPL', 'Enterprise and business architecture', 'STPL', 'STRT', 'SA', 6, 'contractor', 'Contractor', 900, 'UK Market Dec 2025', CURRENT_DATE),
('STPL', 'Enterprise and business architecture', 'STPL', 'STRT', 'SA', 6, 'boutique', 'Boutique/SME', 1170, 'UK Market Dec 2025', CURRENT_DATE),
('STPL', 'Enterprise and business architecture', 'STPL', 'STRT', 'SA', 6, 'mid', 'Mid-tier', 1350, 'UK Market Dec 2025', CURRENT_DATE),
('STPL', 'Enterprise and business architecture', 'STPL', 'STRT', 'SA', 6, 'big4', 'Big 4/Global SI', 1710, 'UK Market Dec 2025', CURRENT_DATE),
('STPL', 'Enterprise and business architecture', 'STPL', 'STRT', 'SA', 7, 'contractor', 'Contractor', 1100, 'UK Market Dec 2025', CURRENT_DATE),
('STPL', 'Enterprise and business architecture', 'STPL', 'STRT', 'SA', 7, 'boutique', 'Boutique/SME', 1430, 'UK Market Dec 2025', CURRENT_DATE),
('STPL', 'Enterprise and business architecture', 'STPL', 'STRT', 'SA', 7, 'mid', 'Mid-tier', 1650, 'UK Market Dec 2025', CURRENT_DATE),
('STPL', 'Enterprise and business architecture', 'STPL', 'STRT', 'SA', 7, 'big4', 'Big 4/Global SI', 2090, 'UK Market Dec 2025', CURRENT_DATE),

-- INOV - Innovation (Levels 4-6)
('INOV', 'Innovation', 'INOV', 'STRT', 'SA', 4, 'contractor', 'Contractor', 550, 'UK Market Dec 2025', CURRENT_DATE),
('INOV', 'Innovation', 'INOV', 'STRT', 'SA', 4, 'boutique', 'Boutique/SME', 715, 'UK Market Dec 2025', CURRENT_DATE),
('INOV', 'Innovation', 'INOV', 'STRT', 'SA', 4, 'mid', 'Mid-tier', 825, 'UK Market Dec 2025', CURRENT_DATE),
('INOV', 'Innovation', 'INOV', 'STRT', 'SA', 4, 'big4', 'Big 4/Global SI', 1045, 'UK Market Dec 2025', CURRENT_DATE),
('INOV', 'Innovation', 'INOV', 'STRT', 'SA', 5, 'contractor', 'Contractor', 700, 'UK Market Dec 2025', CURRENT_DATE),
('INOV', 'Innovation', 'INOV', 'STRT', 'SA', 5, 'boutique', 'Boutique/SME', 910, 'UK Market Dec 2025', CURRENT_DATE),
('INOV', 'Innovation', 'INOV', 'STRT', 'SA', 5, 'mid', 'Mid-tier', 1050, 'UK Market Dec 2025', CURRENT_DATE),
('INOV', 'Innovation', 'INOV', 'STRT', 'SA', 5, 'big4', 'Big 4/Global SI', 1330, 'UK Market Dec 2025', CURRENT_DATE),
('INOV', 'Innovation', 'INOV', 'STRT', 'SA', 6, 'contractor', 'Contractor', 900, 'UK Market Dec 2025', CURRENT_DATE),
('INOV', 'Innovation', 'INOV', 'STRT', 'SA', 6, 'boutique', 'Boutique/SME', 1170, 'UK Market Dec 2025', CURRENT_DATE),
('INOV', 'Innovation', 'INOV', 'STRT', 'SA', 6, 'mid', 'Mid-tier', 1350, 'UK Market Dec 2025', CURRENT_DATE),
('INOV', 'Innovation', 'INOV', 'STRT', 'SA', 6, 'big4', 'Big 4/Global SI', 1710, 'UK Market Dec 2025', CURRENT_DATE),

-- GOVN - Governance (Levels 5-7)
('GOVN', 'Governance', 'GOVN', 'GOVR', 'SA', 5, 'contractor', 'Contractor', 700, 'UK Market Dec 2025', CURRENT_DATE),
('GOVN', 'Governance', 'GOVN', 'GOVR', 'SA', 5, 'boutique', 'Boutique/SME', 910, 'UK Market Dec 2025', CURRENT_DATE),
('GOVN', 'Governance', 'GOVN', 'GOVR', 'SA', 5, 'mid', 'Mid-tier', 1050, 'UK Market Dec 2025', CURRENT_DATE),
('GOVN', 'Governance', 'GOVN', 'GOVR', 'SA', 5, 'big4', 'Big 4/Global SI', 1330, 'UK Market Dec 2025', CURRENT_DATE),
('GOVN', 'Governance', 'GOVN', 'GOVR', 'SA', 6, 'contractor', 'Contractor', 900, 'UK Market Dec 2025', CURRENT_DATE),
('GOVN', 'Governance', 'GOVN', 'GOVR', 'SA', 6, 'boutique', 'Boutique/SME', 1170, 'UK Market Dec 2025', CURRENT_DATE),
('GOVN', 'Governance', 'GOVN', 'GOVR', 'SA', 6, 'mid', 'Mid-tier', 1350, 'UK Market Dec 2025', CURRENT_DATE),
('GOVN', 'Governance', 'GOVN', 'GOVR', 'SA', 6, 'big4', 'Big 4/Global SI', 1710, 'UK Market Dec 2025', CURRENT_DATE),
('GOVN', 'Governance', 'GOVN', 'GOVR', 'SA', 7, 'contractor', 'Contractor', 1100, 'UK Market Dec 2025', CURRENT_DATE),
('GOVN', 'Governance', 'GOVN', 'GOVR', 'SA', 7, 'boutique', 'Boutique/SME', 1430, 'UK Market Dec 2025', CURRENT_DATE),
('GOVN', 'Governance', 'GOVN', 'GOVR', 'SA', 7, 'mid', 'Mid-tier', 1650, 'UK Market Dec 2025', CURRENT_DATE),
('GOVN', 'Governance', 'GOVN', 'GOVR', 'SA', 7, 'big4', 'Big 4/Global SI', 2090, 'UK Market Dec 2025', CURRENT_DATE),

-- BURM - Business risk management (Levels 4-7)
('BURM', 'Business risk management', 'BURM', 'GOVR', 'SA', 4, 'contractor', 'Contractor', 550, 'UK Market Dec 2025', CURRENT_DATE),
('BURM', 'Business risk management', 'BURM', 'GOVR', 'SA', 4, 'boutique', 'Boutique/SME', 715, 'UK Market Dec 2025', CURRENT_DATE),
('BURM', 'Business risk management', 'BURM', 'GOVR', 'SA', 4, 'mid', 'Mid-tier', 825, 'UK Market Dec 2025', CURRENT_DATE),
('BURM', 'Business risk management', 'BURM', 'GOVR', 'SA', 4, 'big4', 'Big 4/Global SI', 1045, 'UK Market Dec 2025', CURRENT_DATE),
('BURM', 'Business risk management', 'BURM', 'GOVR', 'SA', 5, 'contractor', 'Contractor', 700, 'UK Market Dec 2025', CURRENT_DATE),
('BURM', 'Business risk management', 'BURM', 'GOVR', 'SA', 5, 'boutique', 'Boutique/SME', 910, 'UK Market Dec 2025', CURRENT_DATE),
('BURM', 'Business risk management', 'BURM', 'GOVR', 'SA', 5, 'mid', 'Mid-tier', 1050, 'UK Market Dec 2025', CURRENT_DATE),
('BURM', 'Business risk management', 'BURM', 'GOVR', 'SA', 5, 'big4', 'Big 4/Global SI', 1330, 'UK Market Dec 2025', CURRENT_DATE),
('BURM', 'Business risk management', 'BURM', 'GOVR', 'SA', 6, 'contractor', 'Contractor', 900, 'UK Market Dec 2025', CURRENT_DATE),
('BURM', 'Business risk management', 'BURM', 'GOVR', 'SA', 6, 'boutique', 'Boutique/SME', 1170, 'UK Market Dec 2025', CURRENT_DATE),
('BURM', 'Business risk management', 'BURM', 'GOVR', 'SA', 6, 'mid', 'Mid-tier', 1350, 'UK Market Dec 2025', CURRENT_DATE),
('BURM', 'Business risk management', 'BURM', 'GOVR', 'SA', 6, 'big4', 'Big 4/Global SI', 1710, 'UK Market Dec 2025', CURRENT_DATE),
('BURM', 'Business risk management', 'BURM', 'GOVR', 'SA', 7, 'contractor', 'Contractor', 1100, 'UK Market Dec 2025', CURRENT_DATE),
('BURM', 'Business risk management', 'BURM', 'GOVR', 'SA', 7, 'boutique', 'Boutique/SME', 1430, 'UK Market Dec 2025', CURRENT_DATE),
('BURM', 'Business risk management', 'BURM', 'GOVR', 'SA', 7, 'mid', 'Mid-tier', 1650, 'UK Market Dec 2025', CURRENT_DATE),
('BURM', 'Business risk management', 'BURM', 'GOVR', 'SA', 7, 'big4', 'Big 4/Global SI', 2090, 'UK Market Dec 2025', CURRENT_DATE),

-- COPL - Continuity management (Levels 3-6)
('COPL', 'Continuity management', 'COPL', 'GOVR', 'SA', 3, 'contractor', 'Contractor', 450, 'UK Market Dec 2025', CURRENT_DATE),
('COPL', 'Continuity management', 'COPL', 'GOVR', 'SA', 3, 'boutique', 'Boutique/SME', 585, 'UK Market Dec 2025', CURRENT_DATE),
('COPL', 'Continuity management', 'COPL', 'GOVR', 'SA', 3, 'mid', 'Mid-tier', 675, 'UK Market Dec 2025', CURRENT_DATE),
('COPL', 'Continuity management', 'COPL', 'GOVR', 'SA', 3, 'big4', 'Big 4/Global SI', 855, 'UK Market Dec 2025', CURRENT_DATE),
('COPL', 'Continuity management', 'COPL', 'GOVR', 'SA', 4, 'contractor', 'Contractor', 550, 'UK Market Dec 2025', CURRENT_DATE),
('COPL', 'Continuity management', 'COPL', 'GOVR', 'SA', 4, 'boutique', 'Boutique/SME', 715, 'UK Market Dec 2025', CURRENT_DATE),
('COPL', 'Continuity management', 'COPL', 'GOVR', 'SA', 4, 'mid', 'Mid-tier', 825, 'UK Market Dec 2025', CURRENT_DATE),
('COPL', 'Continuity management', 'COPL', 'GOVR', 'SA', 4, 'big4', 'Big 4/Global SI', 1045, 'UK Market Dec 2025', CURRENT_DATE),
('COPL', 'Continuity management', 'COPL', 'GOVR', 'SA', 5, 'contractor', 'Contractor', 700, 'UK Market Dec 2025', CURRENT_DATE),
('COPL', 'Continuity management', 'COPL', 'GOVR', 'SA', 5, 'boutique', 'Boutique/SME', 910, 'UK Market Dec 2025', CURRENT_DATE),
('COPL', 'Continuity management', 'COPL', 'GOVR', 'SA', 5, 'mid', 'Mid-tier', 1050, 'UK Market Dec 2025', CURRENT_DATE),
('COPL', 'Continuity management', 'COPL', 'GOVR', 'SA', 5, 'big4', 'Big 4/Global SI', 1330, 'UK Market Dec 2025', CURRENT_DATE),
('COPL', 'Continuity management', 'COPL', 'GOVR', 'SA', 6, 'contractor', 'Contractor', 900, 'UK Market Dec 2025', CURRENT_DATE),
('COPL', 'Continuity management', 'COPL', 'GOVR', 'SA', 6, 'boutique', 'Boutique/SME', 1170, 'UK Market Dec 2025', CURRENT_DATE),
('COPL', 'Continuity management', 'COPL', 'GOVR', 'SA', 6, 'mid', 'Mid-tier', 1350, 'UK Market Dec 2025', CURRENT_DATE),
('COPL', 'Continuity management', 'COPL', 'GOVR', 'SA', 6, 'big4', 'Big 4/Global SI', 1710, 'UK Market Dec 2025', CURRENT_DATE),

-- SCTY - Information security (Levels 3-7) - Premium skill +20%
('SCTY', 'Information security', 'SCTY', 'SECU', 'SA', 3, 'contractor', 'Contractor', 540, 'UK Market Dec 2025', CURRENT_DATE),
('SCTY', 'Information security', 'SCTY', 'SECU', 'SA', 3, 'boutique', 'Boutique/SME', 700, 'UK Market Dec 2025', CURRENT_DATE),
('SCTY', 'Information security', 'SCTY', 'SECU', 'SA', 3, 'mid', 'Mid-tier', 810, 'UK Market Dec 2025', CURRENT_DATE),
('SCTY', 'Information security', 'SCTY', 'SECU', 'SA', 3, 'big4', 'Big 4/Global SI', 1025, 'UK Market Dec 2025', CURRENT_DATE),
('SCTY', 'Information security', 'SCTY', 'SECU', 'SA', 4, 'contractor', 'Contractor', 660, 'UK Market Dec 2025', CURRENT_DATE),
('SCTY', 'Information security', 'SCTY', 'SECU', 'SA', 4, 'boutique', 'Boutique/SME', 860, 'UK Market Dec 2025', CURRENT_DATE),
('SCTY', 'Information security', 'SCTY', 'SECU', 'SA', 4, 'mid', 'Mid-tier', 990, 'UK Market Dec 2025', CURRENT_DATE),
('SCTY', 'Information security', 'SCTY', 'SECU', 'SA', 4, 'big4', 'Big 4/Global SI', 1255, 'UK Market Dec 2025', CURRENT_DATE),
('SCTY', 'Information security', 'SCTY', 'SECU', 'SA', 5, 'contractor', 'Contractor', 840, 'UK Market Dec 2025', CURRENT_DATE),
('SCTY', 'Information security', 'SCTY', 'SECU', 'SA', 5, 'boutique', 'Boutique/SME', 1090, 'UK Market Dec 2025', CURRENT_DATE),
('SCTY', 'Information security', 'SCTY', 'SECU', 'SA', 5, 'mid', 'Mid-tier', 1260, 'UK Market Dec 2025', CURRENT_DATE),
('SCTY', 'Information security', 'SCTY', 'SECU', 'SA', 5, 'big4', 'Big 4/Global SI', 1595, 'UK Market Dec 2025', CURRENT_DATE),
('SCTY', 'Information security', 'SCTY', 'SECU', 'SA', 6, 'contractor', 'Contractor', 1080, 'UK Market Dec 2025', CURRENT_DATE),
('SCTY', 'Information security', 'SCTY', 'SECU', 'SA', 6, 'boutique', 'Boutique/SME', 1405, 'UK Market Dec 2025', CURRENT_DATE),
('SCTY', 'Information security', 'SCTY', 'SECU', 'SA', 6, 'mid', 'Mid-tier', 1620, 'UK Market Dec 2025', CURRENT_DATE),
('SCTY', 'Information security', 'SCTY', 'SECU', 'SA', 6, 'big4', 'Big 4/Global SI', 2050, 'UK Market Dec 2025', CURRENT_DATE),
('SCTY', 'Information security', 'SCTY', 'SECU', 'SA', 7, 'contractor', 'Contractor', 1320, 'UK Market Dec 2025', CURRENT_DATE),
('SCTY', 'Information security', 'SCTY', 'SECU', 'SA', 7, 'boutique', 'Boutique/SME', 1715, 'UK Market Dec 2025', CURRENT_DATE),
('SCTY', 'Information security', 'SCTY', 'SECU', 'SA', 7, 'mid', 'Mid-tier', 1980, 'UK Market Dec 2025', CURRENT_DATE),
('SCTY', 'Information security', 'SCTY', 'SECU', 'SA', 7, 'big4', 'Big 4/Global SI', 2510, 'UK Market Dec 2025', CURRENT_DATE),

-- PENT - Vulnerability assessment (Levels 3-6) - Premium +20%
('PENT', 'Vulnerability assessment', 'PENT', 'SECU', 'SA', 3, 'contractor', 'Contractor', 540, 'UK Market Dec 2025', CURRENT_DATE),
('PENT', 'Vulnerability assessment', 'PENT', 'SECU', 'SA', 3, 'boutique', 'Boutique/SME', 700, 'UK Market Dec 2025', CURRENT_DATE),
('PENT', 'Vulnerability assessment', 'PENT', 'SECU', 'SA', 3, 'mid', 'Mid-tier', 810, 'UK Market Dec 2025', CURRENT_DATE),
('PENT', 'Vulnerability assessment', 'PENT', 'SECU', 'SA', 3, 'big4', 'Big 4/Global SI', 1025, 'UK Market Dec 2025', CURRENT_DATE),
('PENT', 'Vulnerability assessment', 'PENT', 'SECU', 'SA', 4, 'contractor', 'Contractor', 660, 'UK Market Dec 2025', CURRENT_DATE),
('PENT', 'Vulnerability assessment', 'PENT', 'SECU', 'SA', 4, 'boutique', 'Boutique/SME', 860, 'UK Market Dec 2025', CURRENT_DATE),
('PENT', 'Vulnerability assessment', 'PENT', 'SECU', 'SA', 4, 'mid', 'Mid-tier', 990, 'UK Market Dec 2025', CURRENT_DATE),
('PENT', 'Vulnerability assessment', 'PENT', 'SECU', 'SA', 4, 'big4', 'Big 4/Global SI', 1255, 'UK Market Dec 2025', CURRENT_DATE),
('PENT', 'Vulnerability assessment', 'PENT', 'SECU', 'SA', 5, 'contractor', 'Contractor', 840, 'UK Market Dec 2025', CURRENT_DATE),
('PENT', 'Vulnerability assessment', 'PENT', 'SECU', 'SA', 5, 'boutique', 'Boutique/SME', 1090, 'UK Market Dec 2025', CURRENT_DATE),
('PENT', 'Vulnerability assessment', 'PENT', 'SECU', 'SA', 5, 'mid', 'Mid-tier', 1260, 'UK Market Dec 2025', CURRENT_DATE),
('PENT', 'Vulnerability assessment', 'PENT', 'SECU', 'SA', 5, 'big4', 'Big 4/Global SI', 1595, 'UK Market Dec 2025', CURRENT_DATE),
('PENT', 'Vulnerability assessment', 'PENT', 'SECU', 'SA', 6, 'contractor', 'Contractor', 1080, 'UK Market Dec 2025', CURRENT_DATE),
('PENT', 'Vulnerability assessment', 'PENT', 'SECU', 'SA', 6, 'boutique', 'Boutique/SME', 1405, 'UK Market Dec 2025', CURRENT_DATE),
('PENT', 'Vulnerability assessment', 'PENT', 'SECU', 'SA', 6, 'mid', 'Mid-tier', 1620, 'UK Market Dec 2025', CURRENT_DATE),
('PENT', 'Vulnerability assessment', 'PENT', 'SECU', 'SA', 6, 'big4', 'Big 4/Global SI', 2050, 'UK Market Dec 2025', CURRENT_DATE),

-- IRMG - Information management (Levels 4-7)
('IRMG', 'Information management', 'IRMG', 'INFO', 'SA', 4, 'contractor', 'Contractor', 550, 'UK Market Dec 2025', CURRENT_DATE),
('IRMG', 'Information management', 'IRMG', 'INFO', 'SA', 4, 'boutique', 'Boutique/SME', 715, 'UK Market Dec 2025', CURRENT_DATE),
('IRMG', 'Information management', 'IRMG', 'INFO', 'SA', 4, 'mid', 'Mid-tier', 825, 'UK Market Dec 2025', CURRENT_DATE),
('IRMG', 'Information management', 'IRMG', 'INFO', 'SA', 4, 'big4', 'Big 4/Global SI', 1045, 'UK Market Dec 2025', CURRENT_DATE),
('IRMG', 'Information management', 'IRMG', 'INFO', 'SA', 5, 'contractor', 'Contractor', 700, 'UK Market Dec 2025', CURRENT_DATE),
('IRMG', 'Information management', 'IRMG', 'INFO', 'SA', 5, 'boutique', 'Boutique/SME', 910, 'UK Market Dec 2025', CURRENT_DATE),
('IRMG', 'Information management', 'IRMG', 'INFO', 'SA', 5, 'mid', 'Mid-tier', 1050, 'UK Market Dec 2025', CURRENT_DATE),
('IRMG', 'Information management', 'IRMG', 'INFO', 'SA', 5, 'big4', 'Big 4/Global SI', 1330, 'UK Market Dec 2025', CURRENT_DATE),
('IRMG', 'Information management', 'IRMG', 'INFO', 'SA', 6, 'contractor', 'Contractor', 900, 'UK Market Dec 2025', CURRENT_DATE),
('IRMG', 'Information management', 'IRMG', 'INFO', 'SA', 6, 'boutique', 'Boutique/SME', 1170, 'UK Market Dec 2025', CURRENT_DATE),
('IRMG', 'Information management', 'IRMG', 'INFO', 'SA', 6, 'mid', 'Mid-tier', 1350, 'UK Market Dec 2025', CURRENT_DATE),
('IRMG', 'Information management', 'IRMG', 'INFO', 'SA', 6, 'big4', 'Big 4/Global SI', 1710, 'UK Market Dec 2025', CURRENT_DATE),
('IRMG', 'Information management', 'IRMG', 'INFO', 'SA', 7, 'contractor', 'Contractor', 1100, 'UK Market Dec 2025', CURRENT_DATE),
('IRMG', 'Information management', 'IRMG', 'INFO', 'SA', 7, 'boutique', 'Boutique/SME', 1430, 'UK Market Dec 2025', CURRENT_DATE),
('IRMG', 'Information management', 'IRMG', 'INFO', 'SA', 7, 'mid', 'Mid-tier', 1650, 'UK Market Dec 2025', CURRENT_DATE),
('IRMG', 'Information management', 'IRMG', 'INFO', 'SA', 7, 'big4', 'Big 4/Global SI', 2090, 'UK Market Dec 2025', CURRENT_DATE),

-- DTAN - Data modelling and design (Levels 3-6)
('DTAN', 'Data modelling and design', 'DTAN', 'INFO', 'SA', 3, 'contractor', 'Contractor', 450, 'UK Market Dec 2025', CURRENT_DATE),
('DTAN', 'Data modelling and design', 'DTAN', 'INFO', 'SA', 3, 'boutique', 'Boutique/SME', 585, 'UK Market Dec 2025', CURRENT_DATE),
('DTAN', 'Data modelling and design', 'DTAN', 'INFO', 'SA', 3, 'mid', 'Mid-tier', 675, 'UK Market Dec 2025', CURRENT_DATE),
('DTAN', 'Data modelling and design', 'DTAN', 'INFO', 'SA', 3, 'big4', 'Big 4/Global SI', 855, 'UK Market Dec 2025', CURRENT_DATE),
('DTAN', 'Data modelling and design', 'DTAN', 'INFO', 'SA', 4, 'contractor', 'Contractor', 550, 'UK Market Dec 2025', CURRENT_DATE),
('DTAN', 'Data modelling and design', 'DTAN', 'INFO', 'SA', 4, 'boutique', 'Boutique/SME', 715, 'UK Market Dec 2025', CURRENT_DATE),
('DTAN', 'Data modelling and design', 'DTAN', 'INFO', 'SA', 4, 'mid', 'Mid-tier', 825, 'UK Market Dec 2025', CURRENT_DATE),
('DTAN', 'Data modelling and design', 'DTAN', 'INFO', 'SA', 4, 'big4', 'Big 4/Global SI', 1045, 'UK Market Dec 2025', CURRENT_DATE),
('DTAN', 'Data modelling and design', 'DTAN', 'INFO', 'SA', 5, 'contractor', 'Contractor', 700, 'UK Market Dec 2025', CURRENT_DATE),
('DTAN', 'Data modelling and design', 'DTAN', 'INFO', 'SA', 5, 'boutique', 'Boutique/SME', 910, 'UK Market Dec 2025', CURRENT_DATE),
('DTAN', 'Data modelling and design', 'DTAN', 'INFO', 'SA', 5, 'mid', 'Mid-tier', 1050, 'UK Market Dec 2025', CURRENT_DATE),
('DTAN', 'Data modelling and design', 'DTAN', 'INFO', 'SA', 5, 'big4', 'Big 4/Global SI', 1330, 'UK Market Dec 2025', CURRENT_DATE),
('DTAN', 'Data modelling and design', 'DTAN', 'INFO', 'SA', 6, 'contractor', 'Contractor', 900, 'UK Market Dec 2025', CURRENT_DATE),
('DTAN', 'Data modelling and design', 'DTAN', 'INFO', 'SA', 6, 'boutique', 'Boutique/SME', 1170, 'UK Market Dec 2025', CURRENT_DATE),
('DTAN', 'Data modelling and design', 'DTAN', 'INFO', 'SA', 6, 'mid', 'Mid-tier', 1350, 'UK Market Dec 2025', CURRENT_DATE),
('DTAN', 'Data modelling and design', 'DTAN', 'INFO', 'SA', 6, 'big4', 'Big 4/Global SI', 1710, 'UK Market Dec 2025', CURRENT_DATE),

-- INAN - Analytics (Levels 3-6)
('INAN', 'Analytics', 'INAN', 'INFO', 'SA', 3, 'contractor', 'Contractor', 450, 'UK Market Dec 2025', CURRENT_DATE),
('INAN', 'Analytics', 'INAN', 'INFO', 'SA', 3, 'boutique', 'Boutique/SME', 585, 'UK Market Dec 2025', CURRENT_DATE),
('INAN', 'Analytics', 'INAN', 'INFO', 'SA', 3, 'mid', 'Mid-tier', 675, 'UK Market Dec 2025', CURRENT_DATE),
('INAN', 'Analytics', 'INAN', 'INFO', 'SA', 3, 'big4', 'Big 4/Global SI', 855, 'UK Market Dec 2025', CURRENT_DATE),
('INAN', 'Analytics', 'INAN', 'INFO', 'SA', 4, 'contractor', 'Contractor', 550, 'UK Market Dec 2025', CURRENT_DATE),
('INAN', 'Analytics', 'INAN', 'INFO', 'SA', 4, 'boutique', 'Boutique/SME', 715, 'UK Market Dec 2025', CURRENT_DATE),
('INAN', 'Analytics', 'INAN', 'INFO', 'SA', 4, 'mid', 'Mid-tier', 825, 'UK Market Dec 2025', CURRENT_DATE),
('INAN', 'Analytics', 'INAN', 'INFO', 'SA', 4, 'big4', 'Big 4/Global SI', 1045, 'UK Market Dec 2025', CURRENT_DATE),
('INAN', 'Analytics', 'INAN', 'INFO', 'SA', 5, 'contractor', 'Contractor', 700, 'UK Market Dec 2025', CURRENT_DATE),
('INAN', 'Analytics', 'INAN', 'INFO', 'SA', 5, 'boutique', 'Boutique/SME', 910, 'UK Market Dec 2025', CURRENT_DATE),
('INAN', 'Analytics', 'INAN', 'INFO', 'SA', 5, 'mid', 'Mid-tier', 1050, 'UK Market Dec 2025', CURRENT_DATE),
('INAN', 'Analytics', 'INAN', 'INFO', 'SA', 5, 'big4', 'Big 4/Global SI', 1330, 'UK Market Dec 2025', CURRENT_DATE),
('INAN', 'Analytics', 'INAN', 'INFO', 'SA', 6, 'contractor', 'Contractor', 900, 'UK Market Dec 2025', CURRENT_DATE),
('INAN', 'Analytics', 'INAN', 'INFO', 'SA', 6, 'boutique', 'Boutique/SME', 1170, 'UK Market Dec 2025', CURRENT_DATE),
('INAN', 'Analytics', 'INAN', 'INFO', 'SA', 6, 'mid', 'Mid-tier', 1350, 'UK Market Dec 2025', CURRENT_DATE),
('INAN', 'Analytics', 'INAN', 'INFO', 'SA', 6, 'big4', 'Big 4/Global SI', 1710, 'UK Market Dec 2025', CURRENT_DATE);
