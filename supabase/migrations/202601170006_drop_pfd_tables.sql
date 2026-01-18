-- Migration: Drop PFD (Personal Finance Dashboard) tables accidentally created in Tracker database
-- These tables belong to a different project and should not be in this database

-- First, drop views (they depend on tables)
DROP VIEW IF EXISTS budget_status CASCADE;
DROP VIEW IF EXISTS crypto_wallet_summary CASCADE;
DROP VIEW IF EXISTS pension_summary CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS is_family_member(uuid) CASCADE;
DROP FUNCTION IF EXISTS is_family_owner(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_user_family_id(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_budget_spending(uuid, date, date) CASCADE;
DROP FUNCTION IF EXISTS get_family_crypto_total(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_family_pension_total(uuid) CASCADE;
DROP FUNCTION IF EXISTS calculate_projection(uuid) CASCADE;

-- Drop tables in correct order (respecting foreign key constraints)
-- Tables with foreign keys to other PFD tables must be dropped first

-- Level 3: Tables with FK to level 2 tables
DROP TABLE IF EXISTS budget_alerts CASCADE;
DROP TABLE IF EXISTS pension_values CASCADE;
DROP TABLE IF EXISTS crypto_balances CASCADE;

-- Level 2: Tables with FK to level 1 tables
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS category_rules CASCADE;
DROP TABLE IF EXISTS bank_accounts CASCADE;
DROP TABLE IF EXISTS crypto_wallets CASCADE;
DROP TABLE IF EXISTS crypto_price_cache CASCADE;
DROP TABLE IF EXISTS pensions CASCADE;
DROP TABLE IF EXISTS forecast_scenarios CASCADE;

-- Level 1: Parent tables
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS supported_coins CASCADE;
DROP TABLE IF EXISTS family_members CASCADE;

-- Level 0: Root table
DROP TABLE IF EXISTS families CASCADE;

-- Verify cleanup (this will show remaining objects if any)
-- Run this query manually to confirm:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
-- AND table_name IN ('families', 'family_members', 'bank_accounts', 'transactions',
-- 'categories', 'category_rules', 'budgets', 'budget_alerts', 'crypto_wallets',
-- 'crypto_balances', 'crypto_price_cache', 'supported_coins', 'pensions',
-- 'pension_values', 'forecast_scenarios');
