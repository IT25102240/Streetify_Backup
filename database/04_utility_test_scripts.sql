-- ════════════════════════════════════════════════════════════════════════════════
-- 🛠️ STREETIFY DATABASE UTILITY & TESTING SCRIPTS (MSSQL)
-- Handy developer snippets for testing, resetting, and manipulating state
-- ════════════════════════════════════════════════════════════════════════════════

USE streetify_db;
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ⚡ QUICK STATE MODIFIERS FOR TESTING
-- ─────────────────────────────────────────────────────────────────────────────

-- 1.1 Mark all non-completed trips as COMPLETED (useful for testing payment/review screens)
UPDATE trips 
SET status = 'COMPLETED',
    completed_at = ISNULL(completed_at, GETDATE()),
    is_paid = 1,
    updated_at = GETDATE()
WHERE status != 'COMPLETED';
PRINT '✅ All active trips marked as COMPLETED.';
GO

-- 1.2 Set all Drivers to ONLINE so they appear in passenger dispatch searches
UPDATE users
SET is_online = 1,
    updated_at = GETDATE()
WHERE dtype = 'DRIVER' AND verification_status = 'APPROVED';
PRINT '✅ All approved drivers are now set to ONLINE.';
GO

-- 1.3 Add 2,000 LKR test credit to all passenger wallets
UPDATE users
SET wallet_balance = wallet_balance + 2000.00,
    updated_at = GETDATE()
WHERE dtype = 'PASSENGER';
PRINT '✅ Added 2,000 LKR test balance to all passengers.';
GO


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. 🏥 DATABASE HEALTH & RECORD COUNT AUDIT
-- Run this query to inspect row counts across every table in Streetify
-- ─────────────────────────────────────────────────────────────────────────────
SELECT 
    'users' AS table_name, COUNT(*) AS record_count FROM users
UNION ALL
SELECT 'vehicles', COUNT(*) FROM vehicles
UNION ALL
SELECT 'driver_documents', COUNT(*) FROM driver_documents
UNION ALL
SELECT 'trips', COUNT(*) FROM trips
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL
SELECT 'dispute_tickets', COUNT(*) FROM dispute_tickets
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs;
GO


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. 🧹 CLEAN WIPE (Reset Data while keeping Tables & Structure Intact)
-- Run this if you want to clear all test records before running 02_seed_data.sql
-- ─────────────────────────────────────────────────────────────────────────────
/*
-- Uncomment the block below to perform a complete test data wipe:

DELETE FROM audit_logs;
DELETE FROM dispute_tickets;
DELETE FROM reviews;
DELETE FROM payments;
DELETE FROM trips;
DELETE FROM driver_documents;
DELETE FROM vehicles;
DELETE FROM users;

PRINT '🧹 All table records wiped clean.';
*/
GO
