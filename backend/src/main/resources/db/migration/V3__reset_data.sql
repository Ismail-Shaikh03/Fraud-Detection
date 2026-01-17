-- This migration can be used to reset all data while keeping the schema
-- To use: Run manually via Flyway or use the admin endpoint instead
-- Note: RESTART IDENTITY resets auto-increment sequences
TRUNCATE TABLE transactions, alerts, user_baselines RESTART IDENTITY CASCADE;
