-- ════════════════════════════════════════════════════════════════════════════════
-- 📄 STREETIFY — DRIVER DOCUMENTS SEED & VERIFICATION SCRIPT (MSSQL)
-- Run this in SQL Server Management Studio (SSMS) to immediately populate
-- and view driver verification documents for past and pending drivers.
-- ════════════════════════════════════════════════════════════════════════════════

USE streetify_db;
GO

SET QUOTED_IDENTIFIER ON;

-- 1. Ensure clean state for driver_documents
DELETE FROM driver_documents;
GO

-- 2. Resolve Driver IDs from users table
DECLARE @D1_Doc_Id BIGINT = (SELECT TOP 1 id FROM users WHERE email = 'driver1@streetify.com');
DECLARE @D2_Doc_Id BIGINT = (SELECT TOP 1 id FROM users WHERE email = 'driver2@streetify.com');
DECLARE @D3_Doc_Id BIGINT = (SELECT TOP 1 id FROM users WHERE email = 'driver3@streetify.com');

-- If driver3 doesn't exist, create Sunil Shantha as pending driver
IF @D3_Doc_Id IS NULL
BEGIN
    INSERT INTO users (dtype, active, suspended, email, first_name, last_name, password_hash, phone, role, wallet_balance, average_rating, license_number, nic, total_trips, commission_debt, verification_status, is_online, current_lat, current_lng, created_at, updated_at)
    VALUES ('DRIVER', 0, 0, 'driver3@streetify.com', 'Sunil', 'Shantha', '$2a$10$cbbzAnogt7aHXIkFuSH/MezEMCiOfZuxH2Q4pDbRv8nUVfe.MJY8m', '+94776666666', 'DRIVER', 0.00, 5.0, 'B5554321', '981234567V', 0, 0.00, 'PENDING_VERIFICATION', 0, 6.9147, 79.9729, GETDATE(), GETDATE());
    
    SET @D3_Doc_Id = SCOPE_IDENTITY();
END

-- 3. Populate past & pending driver documents
INSERT INTO driver_documents (driver_id, doc_type, original_filename, file_path, file_size_bytes, content_type, status, reviewer_note, uploaded_at, reviewed_at)
VALUES
-- ════════════════════════════════════════════════════════════════════════════════
-- Driver 1: Kamal Perera (Approved Car Driver) — Fully Approved Past Submissions
-- ════════════════════════════════════════════════════════════════════════════════
(@D1_Doc_Id, 'license',   'kamal_driving_license.pdf',   'uploads/documents/driver-kamal/license.pdf',   1420500, 'application/pdf', 'APPROVED', 'Verified by Tharindu (Driver Admin) - Valid until 2029', DATEADD(day, -10, GETDATE()), DATEADD(day, -9, GETDATE())),
(@D1_Doc_Id, 'reg',       'kamal_prius_cr_book.pdf',     'uploads/documents/driver-kamal/reg.pdf',       2104000, 'application/pdf', 'APPROVED', 'Revenue license valid until 2027 (Tharindu)',            DATEADD(day, -10, GETDATE()), DATEADD(day, -9, GETDATE())),
(@D1_Doc_Id, 'insurance', 'kamal_prius_insurance.pdf',   'uploads/documents/driver-kamal/insurance.pdf', 1820000, 'application/pdf', 'APPROVED', 'Comprehensive commercial insurance policy verified',      DATEADD(day, -10, GETDATE()), DATEADD(day, -9, GETDATE())),

-- ════════════════════════════════════════════════════════════════════════════════
-- Driver 2: Nimal Silva (Approved Tuk Driver) — Fully Approved Past Submissions
-- ════════════════════════════════════════════════════════════════════════════════
(@D2_Doc_Id, 'license',   'nimal_tuk_license.jpg',       'uploads/documents/driver-nimal/license.jpg',    950000, 'image/jpeg',       'APPROVED', 'Tuk-tuk commercial license verified (Tharindu)',         DATEADD(day, -5, GETDATE()),  DATEADD(day, -4, GETDATE())),
(@D2_Doc_Id, 'reg',       'nimal_cr_certificate.pdf',    'uploads/documents/driver-nimal/reg.pdf',       1240000, 'application/pdf', 'APPROVED', 'Western Province revenue license confirmed',            DATEADD(day, -5, GETDATE()),  DATEADD(day, -4, GETDATE())),
(@D2_Doc_Id, 'insurance', 'nimal_thirdparty_policy.pdf', 'uploads/documents/driver-nimal/insurance.pdf',1510000, 'application/pdf', 'APPROVED', 'Third-party commercial insurance verified',             DATEADD(day, -5, GETDATE()),  DATEADD(day, -4, GETDATE())),

-- ════════════════════════════════════════════════════════════════════════════════
-- Driver 3: Sunil Shantha (Pending Verification Driver) — Awaiting Admin Approval
-- ════════════════════════════════════════════════════════════════════════════════
(@D3_Doc_Id, 'license',   'sunil_van_license.pdf',       'uploads/documents/driver-sunil/license.pdf',   1120000, 'application/pdf', 'PENDING',  'Awaiting review by Driver Admin Tharindu',               DATEADD(hour, -2, GETDATE()), NULL),
(@D3_Doc_Id, 'reg',       'sunil_caravan_cr.pdf',        'uploads/documents/driver-sunil/reg.pdf',       1640000, 'application/pdf', 'PENDING',  'Awaiting review by Driver Admin Tharindu',               DATEADD(hour, -2, GETDATE()), NULL),
(@D3_Doc_Id, 'insurance', 'sunil_insurance_cert.pdf',    'uploads/documents/driver-sunil/insurance.pdf', 1380000, 'application/pdf', 'PENDING',  'Awaiting review by Driver Admin Tharindu',               DATEADD(hour, -2, GETDATE()), NULL);
GO

-- ════════════════════════════════════════════════════════════════════════════════
-- 4. Immediate Verification Query (Run this to see table data in SSMS)
-- ════════════════════════════════════════════════════════════════════════════════
SELECT 
    d.id,
    d.driver_id,
    u.first_name + ' ' + u.last_name AS driver_name,
    u.email AS driver_email,
    d.doc_type,
    d.original_filename,
    d.file_path,
    d.file_size_bytes,
    d.content_type,
    d.status,
    d.reviewer_note,
    d.uploaded_at,
    d.reviewed_at
FROM driver_documents d
INNER JOIN users u ON d.driver_id = u.id
ORDER BY d.id ASC;
GO
