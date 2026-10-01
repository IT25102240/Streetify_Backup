import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_code_block(doc, code_text):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, "0F172A") # Dark Navy Slate
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(code_text.strip())
    run.font.name = "Consolas"
    run.font.size = Pt(9.5)
    run.font.color.rgb = RGBColor(74, 222, 128) # Emerald Green

def build_viva_guide_docx(filepath):
    doc = Document()

    # Page Margins
    sections = doc.sections
    for s in sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(0.8)
        s.right_margin = Inches(0.8)

    # Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(30, 41, 59)

    # Document Header
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = p_title.add_run("SLIIT Faculty of Computing — IT2140 Database Design & Development\n")
    r_sub.font.size = Pt(12)
    r_sub.font.bold = True
    r_sub.font.color.rgb = RGBColor(100, 116, 139)

    r_main = p_title.add_run("STREETIFY — 30-MINUTE DATABASE VIVA & LIVE CODING DEFENSE MASTER GUIDE\n")
    r_main.font.size = Pt(18)
    r_main.font.bold = True
    r_main.font.color.rgb = RGBColor(15, 23, 42)

    r_grp = p_title.add_run("Group ID: 2026-Y2-S1-KU-24 (Group 24) | 6 Members Module Defense Blueprint")
    r_grp.font.size = Pt(11)
    r_grp.font.italic = True
    r_grp.font.color.rgb = RGBColor(16, 185, 129)

    doc.add_paragraph()

    # Section 1: Executive Briefing
    h1 = doc.add_heading("1. Executive Briefing: What Examiners Test in the 30-Minute Viva", level=1)
    h1.style.font.color.rgb = RGBColor(15, 23, 42)

    p_intro = doc.add_paragraph(
        "Examiners conduct this session to verify whether every group member genuinely understands their database schema, "
        "relational mapping rules, constraints, and can live-type SQL queries on demand. The evaluation usually tests 3 core stages:"
    )

    tbl_stages = doc.add_table(rows=4, cols=3)
    tbl_stages.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Stage", "Time Allotment", "Examiner Expectations & Tasks"]
    for i, h in enumerate(headers):
        cell = tbl_stages.cell(0, i)
        set_cell_background(cell, "1E293B")
        p = cell.paragraphs[0]
        run = p.add_run(h)
        run.font.bold = True
        run.font.color.rgb = RGBColor(255, 255, 255)
        run.font.size = Pt(10)

    stages_data = [
        ("Stage 1: Architecture Defense & Schema Checks", "8 - 10 Mins", "Examiners verify Part A: Normalization (1NF->BCNF), STI vs Table-per-Subtype decision, 1:1 unique foreign keys, and CASCADE justifications."),
        ("Stage 2: Live SQL Coding Test (On Demand)", "12 - 15 Mins", "Each member will be asked to create a new database in SSMS, write a CREATE TABLE script for their module, perform INSERT, UPDATE, and DELETE operations, and explain constraints."),
        ("Stage 3: Advanced Queries, Aggregations & Stored Proc/Trigger", "7 - 10 Mins", "Writing AVG/MIN/MAX queries, GROUP BY with HAVING, subqueries, and executing the ACID Stored Procedure and Anti-Fraud Trigger.")
    ]

    for row_idx, data in enumerate(stages_data, start=1):
        for col_idx, text in enumerate(data):
            cell = tbl_stages.cell(row_idx, col_idx)
            set_cell_background(cell, "F8FAFC" if row_idx % 2 == 1 else "FFFFFF")
            p = cell.paragraphs[0]
            p.add_run(text).font.size = Pt(9.5)

    doc.add_paragraph()

    # Section 2: Universal Live Coding Script
    h2 = doc.add_heading("2. Universal Live-Coding Starter: Creating a Clean Test Database", level=1)
    p_db = doc.add_paragraph("When the examiner says: 'Create a new database and demonstrate your table': Run this clean script first:")
    add_code_block(doc, """-- Step 1: Create a fresh testing database in SSMS
CREATE DATABASE streetify_viva_test;
GO
USE streetify_viva_test;
GO
PRINT 'Fresh viva testing database created and ready.';""")

    doc.add_paragraph()

    # Section 3: Individual Member Blueprints
    h3 = doc.add_heading("3. Individual Member Blueprints (6 Modules / 6 Members)", level=1)

    members = [
        {
            "name": "Lahiru (IT25102208) — Nayanamina A.R.L.P.",
            "module": "User Account & Verification",
            "table": "users",
            "concept": "Single Table Inheritance (STI), Candidate Key (email UNIQUE), BCrypt Passwords, Wallet Balances",
            "theory_qa": [
                ("Why Single Table Inheritance (STI) instead of separate Passenger and Driver tables?", 
                 "Authentication is the most frequent query in Streetify. With STI, a user login is a single indexed scan on users.email without needing a multi-table JOIN. The trade-off of NULL columns for role-specific attributes is handled at the application layer."),
                ("Why is wallet_balance DECIMAL(10,2) and not FLOAT?",
                 "FLOAT is an approximate binary numeric type (IEEE 754) which introduces floating point rounding errors (0.1 + 0.2 != 0.3). In financial systems, DECIMAL(10,2) is mandatory for exact penny precision.")
            ],
            "create_sql": """-- Lahiru: Table 'users' (STI Architecture)
CREATE TABLE users (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    dtype VARCHAR(31) NOT NULL,            -- 'USER', 'PASSENGER', 'DRIVER'
    email NVARCHAR(150) NOT NULL UNIQUE,   -- Candidate Key (prevents duplicate accounts)
    password_hash NVARCHAR(255) NOT NULL,
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(100) NOT NULL,
    phone NVARCHAR(20) NULL,
    role VARCHAR(20) NOT NULL,             -- 'PASSENGER', 'DRIVER', 'ADMIN'
    wallet_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    active BIT NOT NULL DEFAULT 1,
    suspended BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO""",
            "crud_sql": """-- Insert 2 test users (1 Passenger, 1 Driver)
INSERT INTO users (dtype, email, password_hash, first_name, last_name, phone, role, wallet_balance)
VALUES 
('PASSENGER', 'lahiru.demo@streetify.lk', '$2a$10$demoHashBcryptValue...', 'Lahiru', 'Peris', '+94771111111', 'PASSENGER', 5000.00),
('DRIVER', 'kamal.demo@streetify.lk', '$2a$10$demoHashBcryptValue...', 'Kamal', 'Perera', '+94774444444', 'DRIVER', 0.00);

-- Update: Top-up passenger wallet
UPDATE users 
SET wallet_balance = wallet_balance + 1500.00 
WHERE email = 'lahiru.demo@streetify.lk';

-- Delete: Remove test user
DELETE FROM users WHERE email = 'kamal.demo@streetify.lk';""",
            "query_sql": """-- Lahiru's Aggregation & Subquery Defense:
-- 1. Aggregation (AVG, MIN, MAX wallet balance)
SELECT 
    role,
    COUNT(*) AS total_users,
    AVG(wallet_balance) AS avg_wallet_balance,
    MIN(wallet_balance) AS min_wallet_balance,
    MAX(wallet_balance) AS max_wallet_balance
FROM users
GROUP BY role;

-- 2. Subquery: Find passengers with above-average wallet balance
SELECT id, first_name + ' ' + last_name AS passenger_name, email, wallet_balance
FROM users
WHERE dtype = 'PASSENGER'
  AND wallet_balance > (SELECT AVG(wallet_balance) FROM users WHERE dtype = 'PASSENGER');"""
        },
        {
            "name": "Chanuka (IT25102207) — Dharmakeerthi W.A.C.B.",
            "module": "Ride Booking & Dispatch Engine",
            "table": "trips",
            "concept": "Transactional Entity, Foreign Keys to Users, 7-State Lifecycle, Composite Attribute Flattening",
            "theory_qa": [
                ("How did you map the composite EER attribute PickupLocation?", 
                 "Per Rule 2 of EER-to-Relational Mapping, composite attributes (PickupLocation and DropoffLocation) were flattened into atomic columns: pickup_lat, pickup_lng, pickup_address, dropoff_lat, dropoff_lng, dropoff_address. This preserves 1NF without requiring extra lookup joins."),
                ("Why is driver_id in trips nullable?",
                 "When a trip is first requested, no driver has accepted it yet. The driver_id remains NULL until a driver accepts the trip, at which point it is populated.")
            ],
            "create_sql": """-- Chanuka: Table 'trips' (Core Transactional Table)
CREATE TABLE trips (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    passenger_id BIGINT NOT NULL,
    driver_id BIGINT NULL,
    pickup_address NVARCHAR(500) NOT NULL,
    dropoff_address NVARCHAR(500) NOT NULL,
    distance_km FLOAT NOT NULL,
    ride_type VARCHAR(20) NOT NULL,        -- 'TUK', 'CAR', 'VAN', 'MOTO'
    base_fare FLOAT NOT NULL,
    per_km_rate FLOAT NOT NULL,
    platform_fee FLOAT NOT NULL DEFAULT 4.0,
    total_fare FLOAT NOT NULL,
    platform_commission FLOAT NULL,       -- 15%
    driver_net FLOAT NULL,                -- 85%
    status VARCHAR(20) NOT NULL DEFAULT 'REQUESTED', -- REQUESTED, ACCEPTED, EN_ROUTE, ARRIVED, IN_PROGRESS, COMPLETED, CANCELLED
    is_paid BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    completed_at DATETIME2 NULL,
    CONSTRAINT FK_trips_passenger FOREIGN KEY (passenger_id) REFERENCES users(id),
    CONSTRAINT FK_trips_driver FOREIGN KEY (driver_id) REFERENCES users(id)
);
GO""",
            "crud_sql": """-- Insert sample trip
INSERT INTO trips (passenger_id, driver_id, pickup_address, dropoff_address, distance_km, ride_type, base_fare, per_km_rate, total_fare, platform_commission, driver_net, status)
VALUES 
(1, 2, 'Colombo Fort', 'Nugegoda Junction', 10.5, 'CAR', 300.0, 150.0, 1925.00, 288.75, 1636.25, 'COMPLETED');

-- Update: Mark trip completed and paid
UPDATE trips 
SET status = 'COMPLETED', is_paid = 1, completed_at = GETDATE()
WHERE id = 1;

-- Delete: Delete cancelled trip
DELETE FROM trips WHERE id = 1 AND status = 'CANCELLED';""",
            "query_sql": """-- Chanuka's JOIN & Aggregation Defense:
-- 1. Multi-Table JOIN (Passenger + Driver info with ISNULL fallback)
SELECT 
    t.id AS trip_id,
    p.first_name + ' ' + p.last_name AS passenger_name,
    ISNULL(d.first_name + ' ' + d.last_name, 'UNASSIGNED') AS driver_name,
    t.pickup_address, t.dropoff_address, t.distance_km, t.total_fare, t.status
FROM trips t
INNER JOIN users p ON t.passenger_id = p.id
LEFT JOIN users d ON t.driver_id = d.id;

-- 2. Aggregations with GROUP BY & HAVING (High revenue ride categories)
SELECT 
    ride_type,
    COUNT(*) AS trip_count,
    AVG(total_fare) AS avg_fare,
    MIN(total_fare) AS min_fare,
    MAX(total_fare) AS max_fare,
    SUM(total_fare) AS total_revenue
FROM trips
GROUP BY ride_type
HAVING COUNT(*) >= 1;"""
        },
        {
            "name": "Tharindu (IT25102241) — Senaka K.A.T.",
            "module": "Driver Management & Verification",
            "table": "vehicles & driver_documents",
            "concept": "1:1 Relationship Modeling, ON DELETE CASCADE Existential Dependency, Vehicle Unique Plate",
            "theory_qa": [
                ("Why do vehicles and driver_documents have ON DELETE CASCADE while trips and payments do not?", 
                 "Vehicles and driver documents have an existential dependency on the driver. If a driver account is completely purged, their vehicle registration and license photos have no meaning. However, trips and payments are financial audit trails: even if an account is deleted, financial history must never be destroyed!"),
                ("How is the 1:1 relationship between Driver and Vehicle enforced?",
                 "By applying a UNIQUE constraint on vehicles.driver_id. While a normal Foreign Key allows multiple vehicles per driver, making it UNIQUE strictly restricts each driver to exactly one active registered vehicle.")
            ],
            "create_sql": """-- Tharindu: Table 'vehicles' (1:1 with Driver via UNIQUE FK)
CREATE TABLE vehicles (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    driver_id BIGINT NOT NULL UNIQUE,     -- UNIQUE constraint enforces 1:1 relationship
    vehicle_type VARCHAR(20) NOT NULL,    -- 'CAR', 'TUK', 'VAN', 'BIKE'
    number_plate NVARCHAR(20) NOT NULL UNIQUE,
    year_of_manufacture INT NOT NULL,
    make NVARCHAR(100) NULL,
    model NVARCHAR(100) NULL,
    color NVARCHAR(20) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_vehicles_driver FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
);
GO""",
            "crud_sql": """-- Insert a driver vehicle
INSERT INTO vehicles (driver_id, vehicle_type, number_plate, year_of_manufacture, make, model, color)
VALUES (2, 'CAR', 'WP CAB-1234', 2018, 'Toyota', 'Prius', 'Pearl White');

-- Update: Update vehicle color and plate
UPDATE vehicles 
SET color = 'Silver', number_plate = 'WP CAB-9999' 
WHERE driver_id = 2;

-- Delete: Delete vehicle record
DELETE FROM vehicles WHERE number_plate = 'WP CAB-9999';""",
            "query_sql": """-- Tharindu's Fleet Operations Dashboard Query (D.1 from doc):
SELECT 
    u.id AS driver_id,
    u.first_name + ' ' + u.last_name AS driver_name,
    u.phone,
    u.license_number,
    u.verification_status,
    u.average_rating,
    u.total_trips,
    CASE WHEN u.is_online = 1 THEN 'ONLINE' ELSE 'OFFLINE' END AS availability,
    v.vehicle_type,
    v.make + ' ' + v.model + ' (' + v.number_plate + ')' AS vehicle
FROM users u
LEFT JOIN vehicles v ON v.driver_id = u.id
WHERE u.dtype = 'DRIVER' AND u.verification_status = 'APPROVED'
ORDER BY u.is_online DESC, u.average_rating DESC;"""
        },
        {
            "name": "Daham (IT25102225) — Edirisinghe E.A.R.N.D.",
            "module": "Payment & Financial Settlement",
            "table": "payments",
            "concept": "1:1 Enforcement with Trips, Financial Snapshots, Exact DECIMAL Precision, Revenue Aggregation",
            "theory_qa": [
                ("Why store platform_commission and driver_net as snapshots if they can be calculated (15% / 85%)?", 
                 "If Streetify changes its commission rate in the future (e.g. from 15% to 12%), calculating past earnings dynamically would corrupt historical financial accounting. Storing immutable snapshots ensures past audit records remain legally accurate."),
                ("How does the schema prevent a trip from being charged twice?",
                 "The column trip_id in payments is defined with a UNIQUE FOREIGN KEY constraint. If an application or network glitch attempts to insert a second payment for the same trip_id, SQL Server immediately rejects it with a unique constraint violation.")
            ],
            "create_sql": """-- Daham: Table 'payments' (Financial Ledger Table)
CREATE TABLE payments (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    trip_id BIGINT NOT NULL UNIQUE,        -- 1:1 with trips; UNIQUE prevents double billing
    passenger_id BIGINT NOT NULL,
    driver_id BIGINT NOT NULL,
    gross_amount DECIMAL(10,2) NOT NULL,
    platform_commission DECIMAL(10,2) NOT NULL, -- 15% company cut
    driver_net DECIMAL(10,2) NOT NULL,          -- 85% driver payout
    payment_method VARCHAR(20) NOT NULL,        -- 'CARD', 'WALLET', 'CASH'
    status VARCHAR(20) NOT NULL,                -- 'SUCCESS', 'FAILED', 'PENDING'
    retry_count INT NOT NULL DEFAULT 0,
    transaction_ref NVARCHAR(100) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    processed_at DATETIME2 NULL,
    CONSTRAINT FK_payments_trip FOREIGN KEY (trip_id) REFERENCES trips(id),
    CONSTRAINT FK_payments_passenger FOREIGN KEY (passenger_id) REFERENCES users(id),
    CONSTRAINT FK_payments_driver FOREIGN KEY (driver_id) REFERENCES users(id)
);
GO""",
            "crud_sql": """-- Insert completed payment
INSERT INTO payments (trip_id, passenger_id, driver_id, gross_amount, platform_commission, driver_net, payment_method, status, transaction_ref, processed_at)
VALUES 
(1, 1, 2, 1925.00, 288.75, 1636.25, 'CARD', 'SUCCESS', 'TXN_CARD_894312', GETDATE());

-- Update: Update retry count on failure
UPDATE payments 
SET retry_count = retry_count + 1, status = 'FAILED' 
WHERE id = 1;

-- Delete: Delete failed transaction
DELETE FROM payments WHERE id = 1 AND status = 'FAILED';""",
            "query_sql": """-- Daham's Revenue Aggregation (D.3 from doc):
SELECT 
    payment_method,
    COUNT(*) AS total_transactions,
    SUM(gross_amount) AS total_gross_revenue,
    SUM(platform_commission) AS total_platform_profit,
    SUM(driver_net) AS total_driver_payouts,
    AVG(gross_amount) AS avg_fare_per_trip,
    MIN(gross_amount) AS min_fare,
    MAX(gross_amount) AS max_fare
FROM payments
WHERE status = 'SUCCESS'
GROUP BY payment_method
ORDER BY total_gross_revenue DESC;"""
        },
        {
            "name": "Mithun (IT25102193) — Weerasingha W.A.M.B.",
            "module": "Review & Dispute Management",
            "table": "reviews & dispute_tickets",
            "concept": "Domain Integrity via CHECK Constraints, 1:1 Review per Trip, Customer Dispute Resolution",
            "theory_qa": [
                ("How did you enforce that ratings must be between 1 and 5?", 
                 "Using a column-level CHECK constraint: `CHECK (rating >= 1 AND rating <= 5)` or `CHECK (rating BETWEEN 1 AND 5)`. Any attempt to insert ratings of 0 or 6 is blocked at the database engine level."),
                ("Why can a passenger only review a trip once?",
                 "Because `trip_id` in the `reviews` table is constrained as UNIQUE FOREIGN KEY, ensuring a 1:1 relationship between completed trips and reviews.")
            ],
            "create_sql": """-- Mithun: Table 'reviews' (Domain Integrity with CHECK constraint)
CREATE TABLE reviews (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    trip_id BIGINT NOT NULL UNIQUE,       -- Exactly 1 review per trip
    passenger_id BIGINT NOT NULL,
    driver_id BIGINT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5), -- CHECK constraint
    comment NVARCHAR(1000) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_reviews_trip FOREIGN KEY (trip_id) REFERENCES trips(id),
    CONSTRAINT FK_reviews_passenger FOREIGN KEY (passenger_id) REFERENCES users(id),
    CONSTRAINT FK_reviews_driver FOREIGN KEY (driver_id) REFERENCES users(id)
);
GO""",
            "crud_sql": """-- Insert review
INSERT INTO reviews (trip_id, passenger_id, driver_id, rating, comment)
VALUES (1, 1, 2, 5, 'Super clean car, friendly driver and arrived right on time!');

-- Test CHECK constraint failure (Examiner loves this demonstration!):
-- This query will intentionally fail with CHECK constraint violation:
-- INSERT INTO reviews (trip_id, passenger_id, driver_id, rating) VALUES (2, 1, 2, 6);

-- Update: Edit passenger feedback comment
UPDATE reviews 
SET comment = 'Updated comment: Excellent driving skills!' 
WHERE id = 1;

-- Delete: Delete review
DELETE FROM reviews WHERE id = 1;""",
            "query_sql": """-- Mithun's Driver Rating Performance Classification:
SELECT 
    id AS driver_id,
    first_name + ' ' + last_name AS driver_name,
    average_rating,
    total_trips,
    CASE 
        WHEN average_rating >= 4.8 THEN '⭐ Top Rated'
        WHEN average_rating >= 4.0 THEN '👍 Good'
        ELSE '⚠️ Needs Attention'
    END AS performance_tier
FROM users
WHERE dtype = 'DRIVER'
ORDER BY average_rating DESC;"""
        },
        {
            "name": "Vidura (IT25102240) — Rammandalagedara R.V.S.",
            "module": "Super Admin & Governance",
            "table": "audit_logs",
            "concept": "Security Audit Trail, ACID Transactions, Stored Procedure usp_ProcessTripPayment, Trigger trg_ProtectFinalizedTrips",
            "theory_qa": [
                ("How does your Stored Procedure ensure ACID compliance?", 
                 "It uses explicit transaction blocks (`BEGIN TRANSACTION`, `COMMIT`, `ROLLBACK`), guards against invalid states with THROW 50001/50002, enables `SET XACT_ABORT ON` to auto-rollback on T-SQL errors, and uses `TRY...CATCH` with `XACT_STATE()` to cleanly undo partial writes."),
                ("Why is trg_ProtectFinalizedTrips an AFTER UPDATE trigger and what does it protect?",
                 "It is an AFTER UPDATE trigger that inspects SQL Server's virtual `inserted` and `deleted` tables. If a trip's status was already 'COMPLETED' or 'CANCELLED' and any user tries to alter financial columns (`total_fare`, `driver_net`, `platform_commission`, `distance_km`), it executes `ROLLBACK TRANSACTION` with error 50101 to prevent fraud.")
            ],
            "create_sql": """-- Vidura: Table 'audit_logs' (Weak Entity with Surrogate PK)
CREATE TABLE audit_logs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    performed_by_staff_id BIGINT NOT NULL,
    performed_by_email NVARCHAR(255) NOT NULL,
    action_type VARCHAR(50) NOT NULL,    -- 'ADMIN_LOGIN', 'DISPUTE_RESOLVED', 'USER_SUSPENDED'
    description NVARCHAR(1000) NOT NULL,
    target_user_id BIGINT NULL,
    target_entity_type VARCHAR(50) NULL,
    target_entity_id BIGINT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO""",
            "crud_sql": """-- Insert administrative audit trail entry
INSERT INTO audit_logs (performed_by_staff_id, performed_by_email, action_type, description, target_user_id, target_entity_type, target_entity_id)
VALUES (1, 'admin@streetify.com', 'DISPUTE_RESOLVED', 'Approved partial refund of LKR 100 to passenger.', 9, 'DISPUTE_TICKET', 1);

-- Update: Update audit record notes
UPDATE audit_logs 
SET description = description + ' (Audited by Senior Admin)' 
WHERE id = 1;

-- Delete: Delete test audit row
DELETE FROM audit_logs WHERE id = 1;""",
            "query_sql": """-- Vidura's Executive Governance & Trigger Live Demonstration:
-- 1. Conditional Aggregation Query (Active vs Suspended accounts)
SELECT 
    role,
    COUNT(*) AS total_count,
    SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) AS active_count,
    SUM(CASE WHEN suspended = 1 THEN 1 ELSE 0 END) AS suspended_count
FROM users
GROUP BY role;

-- 2. LIVE TRIGGER FRAUD TEST (Run in front of examiner to prove error 50101):
BEGIN TRY
    UPDATE trips SET total_fare = 1.00 WHERE id = 1; -- Attempt fraud on completed trip
    PRINT 'ERROR: Trigger failed to block update!';
END TRY
BEGIN CATCH
    SELECT ERROR_NUMBER() AS error_number, ERROR_MESSAGE() AS error_message;
END CATCH;"""
        }
    ]

    for m in members:
        h_mem = doc.add_heading(m["name"], level=2)
        h_mem.style.font.color.rgb = RGBColor(16, 185, 129)

        p_info = doc.add_paragraph()
        r1 = p_info.add_run(f"Module: {m['module']} | Table: {m['table']}\n")
        r1.font.bold = True
        r2 = p_info.add_run(f"Core Concepts: {m['concept']}")
        r2.font.italic = True
        r2.font.color.rgb = RGBColor(100, 116, 139)

        # Theory Q&A
        doc.add_heading("Examiner Viva Defense Questions (Why & How):", level=3)
        for q, a in m["theory_qa"]:
            p_qa = doc.add_paragraph()
            r_q = p_qa.add_run(f"Q: {q}\n")
            r_q.font.bold = True
            r_q.font.color.rgb = RGBColor(30, 41, 59)
            r_a = p_qa.add_run(f"A: {a}")
            r_a.font.color.rgb = RGBColor(71, 85, 105)

        # DDL Create Table
        doc.add_heading("1. Live Coding CREATE TABLE Script:", level=3)
        add_code_block(doc, m["create_sql"])

        # CRUD DML
        doc.add_heading("2. Live Coding INSERT / UPDATE / DELETE Script:", level=3)
        add_code_block(doc, m["crud_sql"])

        # Select & Aggregations
        doc.add_heading("3. Advanced Demonstration Query (Aggregation / JOIN / Subquery):", level=3)
        add_code_block(doc, m["query_sql"])

        doc.add_paragraph()

    # Section 4: Viva Trap Questions & Answers
    h4 = doc.add_heading("4. Common Examiner Trap Questions & Model Answers", level=1)
    traps = [
        ("Examiner: 'What is the exact difference between WHERE and HAVING?'",
         "WHERE filters individual rows BEFORE grouping and aggregation. It CANNOT contain aggregate functions. HAVING filters grouped rows AFTER aggregation (e.g. HAVING COUNT(*) > 5 or HAVING SUM(fare) > 1000)."),
        ("Examiner: 'What is the difference between a Scalar Subquery and a Correlated Subquery?'",
         "A Scalar Subquery returns a single value (1 row, 1 column) and is evaluated once (e.g., WHERE fare > (SELECT AVG(fare) FROM trips)). A Correlated Subquery references columns from the outer query and executes repeatedly for each row evaluated by the outer query."),
        ("Examiner: 'Why did you use BIGINT IDENTITY(1,1) instead of using email as the Primary Key?'",
         "Surrogate integer keys are 8-byte integers that provide superior B-tree index traversal performance, compact foreign key storage in child tables, and insulate the database relationships if a user changes their email address. Natural keys (email) are preserved with UNIQUE candidate key constraints."),
        ("Examiner: 'How did you verify Boyce-Codd Normal Form (BCNF)?'",
         "A relation is in BCNF if for every functional dependency X -> Y, X is a superkey. In Streetify, all non-key attributes depend only on surrogate primary keys, and all secondary functional determinants (email, number_plate, trip_id in payments) are enforced as UNIQUE constraints, making them candidate superkeys.")
    ]

    for q, a in traps:
        p_trap = doc.add_paragraph()
        rq = p_trap.add_run(f"{q}\n")
        rq.font.bold = True
        rq.font.color.rgb = RGBColor(220, 38, 38)
        ra = p_trap.add_run(f"Defense Answer: {a}")
        ra.font.color.rgb = RGBColor(30, 41, 59)

    doc.save(filepath)
    print(f"Word Document generated successfully at {filepath}")

if __name__ == "__main__":
    out_path = r"e:\2Y1S\2Y1S_Projects\SE_project\Streetify\Streetify_Backup\database\Streetify_DB_Viva_Master_Guide.docx"
    build_viva_guide_docx(out_path)
