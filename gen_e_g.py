"""
gen_e_g.py — Parts E, F, G and References for Streetify DDD Assignment 2 report
"""
import sys
sys.path.insert(0, ".")
from rpt_helpers import *

def build(doc):
    # ════ PART E ════
    H(doc, "Part E: Stored Procedure — usp_ProcessTripPayment", 1)
    P(doc, "This stored procedure encapsulates the complete payment finalization workflow for "
       "Streetify. It enforces ACID compliance through explicit transaction management, validates "
       "business rules before any mutation, and handles driver commission debt tracking for cash "
       "payments. It is the single authoritative entry point for all payment processing.", sz=10.5)

    H(doc, "E.1 Business Logic & Design Rationale", 2)
    TBL(doc, ["Component", "Design Decision", "Justification"], [
        ("Input Validation Guard 1", "Checks trip EXISTS and status = 'COMPLETED'",
         "Prevents payments for in-progress or cancelled trips at the DB level"),
        ("Input Validation Guard 2", "Checks no payment row exists for trip_id",
         "Guarantees idempotency — safe for network retries without double billing"),
        ("15% Commission Rule", "Deducts 15% as platform_commission, 85% to driver_net",
         "Core Streetify business model — immutably recorded at time of payment"),
        ("CASH commission_debt", "Adds 15% to drivers.commission_debt for cash trips",
         "Driver received cash physically; platform records what is owed separately"),
        ("WALLET deduction", "Deducts gross_amount from passenger wallet_balance",
         "Atomic operation — cannot leave wallet in partial state"),
        ("Transaction Reference", "Generates unique TXN_METHOD_random ID",
         "Enables external payment gateway reconciliation and audit tracing"),
        ("SET XACT_ABORT ON", "Auto-rollback entire TX on any T-SQL error",
         "Prevents partial data states without manual ROLLBACK in every error branch"),
        ("TRY...CATCH + XACT_STATE()", "Catches all errors, checks TX state before ROLLBACK",
         "XACT_STATE() = -1 means TX is uncommittable; 0 means no TX active — handle both"),
    ])

    H(doc, "E.2 Complete Stored Procedure Code", 2)
    CODE(doc, """CREATE OR ALTER PROCEDURE usp_ProcessTripPayment
    @TripID      BIGINT,
    @Method      NVARCHAR(20),    -- Accepted: 'CARD' | 'WALLET' | 'CASH'
    @AmountPaid  DECIMAL(10,2)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;   -- Auto-rollback entire TX on any statement-level error

    -- ── Guard 1: Trip must exist and be in COMPLETED state ─────────────────
    IF NOT EXISTS (
        SELECT 1 FROM trips WHERE id = @TripID AND status = 'COMPLETED'
    )
    BEGIN
        ;THROW 50001, 'ERROR: Trip does not exist or is not in COMPLETED state.', 1;
        RETURN;
    END

    -- ── Guard 2: Idempotency check — no duplicate payment allowed ──────────
    IF EXISTS (SELECT 1 FROM payments WHERE trip_id = @TripID)
    BEGIN
        ;THROW 50002, 'ERROR: Payment already processed for this trip.', 1;
        RETURN;
    END

    -- ── Variable Declarations ──────────────────────────────────────────────
    DECLARE @DriverID    BIGINT         = (SELECT driver_id    FROM trips WHERE id = @TripID);
    DECLARE @PassengerID BIGINT         = (SELECT passenger_id FROM trips WHERE id = @TripID);
    DECLARE @Commission  DECIMAL(10,2)  = @AmountPaid * 0.15;   -- 15% platform cut
    DECLARE @NetShare    DECIMAL(10,2)  = @AmountPaid - @Commission;  -- 85% to driver
    DECLARE @TxnRef      NVARCHAR(100)  =
        'TXN_' + @Method + '_' + CAST(ABS(CHECKSUM(NEWID())) AS NVARCHAR(20));

    BEGIN TRY
        BEGIN TRANSACTION;

            -- Step 1: Insert immutable payment record
            INSERT INTO payments (trip_id, passenger_id, driver_id, gross_amount,
                platform_commission, driver_net, payment_method, status,
                transaction_ref, processed_at)
            VALUES (@TripID, @PassengerID, @DriverID, @AmountPaid,
                @Commission, @NetShare, @Method, 'SUCCESS', @TxnRef, GETDATE());

            -- Step 2: Mark trip as paid
            UPDATE trips
            SET is_paid    = 1,
                updated_at = GETDATE()
            WHERE id = @TripID;

            -- Step 3: CASH — driver received physical cash, record commission debt
            IF @Method = 'CASH'
            BEGIN
                UPDATE users
                SET commission_debt = commission_debt + @Commission,
                    updated_at      = GETDATE()
                WHERE id = @DriverID;
            END

            -- Step 4: WALLET — deduct fare from passenger's digital wallet
            IF @Method = 'WALLET'
            BEGIN
                UPDATE users
                SET wallet_balance = wallet_balance - @AmountPaid,
                    updated_at     = GETDATE()
                WHERE id = @PassengerID;
            END

        COMMIT TRANSACTION;

        -- Return payment receipt to the caller (application layer)
        SELECT
            @TripID     AS trip_id,
            @AmountPaid AS gross_paid,
            @Commission AS platform_commission_15pct,
            @NetShare   AS driver_net_85pct,
            @Method     AS payment_method,
            @TxnRef     AS transaction_reference,
            GETDATE()   AS processed_at;

    END TRY
    BEGIN CATCH
        -- XACT_STATE() = -1: uncommittable TX; <> 0: any active TX
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        ;THROW;  -- Re-raise original error to calling application
    END CATCH
END;
GO""", "usp_ProcessTripPayment — ACID-Compliant Payment Procedure")

    H(doc, "E.3 Viva Demonstration Script", 2)
    CODE(doc, """-- ── DEMO: Process a CASH payment for Trip 3 ──────────────────────────────
-- First: Mark Trip 3 as COMPLETED (it is IN_PROGRESS in seeded data)
UPDATE trips SET status = 'COMPLETED', completed_at = GETDATE() WHERE id = 3;
GO

-- Execute the procedure with CASH method (Bambalapitiya -> Dehiwala, LKR 1100)
EXEC usp_ProcessTripPayment
    @TripID     = 3,
    @Method     = 'CASH',
    @AmountPaid = 1100.00;
GO

-- Verify 1: Driver's commission_debt increased by LKR 165 (15% of 1100)
SELECT id, first_name+' '+last_name AS driver_name,
       commission_debt, wallet_balance
FROM users WHERE email = 'driver1@streetify.com';

-- Verify 2: Payment record was created with correct split
SELECT trip_id, gross_amount, platform_commission, driver_net,
       payment_method, status, transaction_ref
FROM payments WHERE trip_id = 3;

-- Verify 3: trips.is_paid flag updated
SELECT id, status, is_paid FROM trips WHERE id = 3;

-- Test Guard: Try to pay Trip 3 AGAIN (should throw error 50002)
BEGIN TRY
    EXEC usp_ProcessTripPayment @TripID=3, @Method='CARD', @AmountPaid=1100.00;
END TRY
BEGIN CATCH
    SELECT ERROR_NUMBER() AS error_no, ERROR_MESSAGE() AS error_msg;
END CATCH;""", "E.3 — Viva Demo Execution Script")

    SCRN(doc, "usp_ProcessTripPayment execution result (receipt table)")
    SCRN(doc, "drivers.commission_debt updated in users table")
    SCRN(doc, "payments table showing new record for trip_id=3")
    SCRN(doc, "Error 50002 on duplicate payment attempt")

    H(doc, "E.4 Viva Q&A — Stored Procedure", 2)
    QA(doc, "What does SET XACT_ABORT ON do and why is it needed?",
       "XACT_ABORT ON tells SQL Server to automatically roll back the entire current transaction "
       "whenever any T-SQL statement raises a run-time error. Without it, a failed UPDATE (e.g., "
       "updating commission_debt) would leave the transaction partially committed with an orphaned "
       "payment record. With XACT_ABORT ON, the entire operation atomically succeeds or fails — "
       "a fundamental ACID Atomicity requirement.")
    QA(doc, "Why do you check XACT_STATE() before rolling back in the CATCH block?",
       "XACT_STATE() returns: 1 (transaction active and committable), -1 (active but uncommittable "
       "due to a constraint violation), or 0 (no active transaction). Calling ROLLBACK when "
       "XACT_STATE() = 0 raises another error. By checking XACT_STATE() <> 0 before rolling back, "
       "the error handler is fully robust for all scenarios.")
    QA(doc, "Why does CASH payment add to commission_debt instead of deducting from wallet?",
       "In a cash trip, the passenger physically hands money to the driver at trip end. The driver "
       "collects the FULL fare in cash. The platform never receives this electronically. Therefore "
       "no digital balance can be deducted. Instead, the 15% commission is recorded as a debt the "
       "driver owes the platform, settled separately through a periodic reconciliation process "
       "(e.g., bank transfer or withheld from future card payments).")
    QA(doc, "How does the procedure prevent double payments on network retries?",
       "Guard 2 (IF EXISTS SELECT 1 FROM payments WHERE trip_id = @TripID) checks for an existing "
       "payment BEFORE the transaction begins. If a payment already exists, THROW 50002 fires and "
       "returns immediately without entering the transaction. Combined with the UNIQUE constraint on "
       "payments.trip_id at the database level, this provides two independent layers of protection "
       "against duplicate charges — one at application logic level and one at storage engine level.")

    doc.add_page_break()

    # ════ PART F ════
    H(doc, "Part F: Trigger — trg_ProtectFinalizedTrips", 1)
    P(doc, "This AFTER UPDATE trigger is the final safety gate protecting financial record integrity. "
       "Once a trip reaches a terminal state (COMPLETED or CANCELLED), its financial data "
       "(total_fare, platform_commission, driver_net, distance_km, status) becomes immutable — "
       "protecting the platform from both accidental corruption and intentional fraud.", sz=10.5)

    H(doc, "F.1 Trigger Design Rationale", 2)
    TBL(doc, ["Design Aspect", "Explanation"], [
        ("AFTER UPDATE (not INSTEAD OF)",
         "An AFTER trigger fires after changes are staged but before commit. It can inspect both "
         "old and new state and issue ROLLBACK to undo the change. INSTEAD OF would require "
         "reimplementing the update logic manually — more complex and error-prone."),
        ("Virtual tables: inserted and deleted",
         "SQL Server auto-populates 'deleted' (before-state) and 'inserted' (after-state) "
         "for every DML operation. We JOIN them on id to compare old vs new field values."),
        ("TRIGGER_NESTLEVEL() guard",
         "Prevents infinite recursion if this trigger fires another trigger. If nest level > 1, "
         "we return immediately to avoid stack overflow."),
        ("Protected columns",
         "total_fare, platform_commission, driver_net, distance_km, status. These are the "
         "fields that constitute the immutable financial record. Administrative notes and "
         "timestamps are not protected."),
        ("THROW 50101 + ROLLBACK pattern",
         "THROW raises a descriptive error with number 50101. ROLLBACK undoes the UPDATE. "
         "The calling application (Spring Boot @Transactional) catches the exception and "
         "surfaces it as an API error response."),
    ])

    H(doc, "F.2 Complete Trigger Code", 2)
    CODE(doc, """CREATE OR ALTER TRIGGER trg_ProtectFinalizedTrips
ON trips
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Guard: prevent recursive trigger execution
    IF TRIGGER_NESTLEVEL(@@PROCID) > 1 RETURN;

    -- Check: Was the ORIGINAL status a terminal state (COMPLETED or CANCELLED)?
    --        AND: Is someone trying to mutate protected financial columns?
    IF EXISTS (
        SELECT 1
        FROM deleted d
        INNER JOIN inserted i ON d.id = i.id
        WHERE d.status IN ('COMPLETED', 'CANCELLED')
          AND (
                d.total_fare           <> i.total_fare
             OR d.platform_commission  <> i.platform_commission
             OR d.driver_net           <> i.driver_net
             OR d.distance_km          <> i.distance_km
             OR d.status               <> i.status
          )
    )
    BEGIN
        ROLLBACK TRANSACTION;
        ;THROW 50101,
            'CRITICAL INTEGRITY VIOLATION: Finalized trips (COMPLETED/CANCELLED) are immutable financial records. Fare, commission, distance, and status cannot be altered after finalization.',
            1;
    END
END;
GO""", "trg_ProtectFinalizedTrips — Immutable Financial Record Guard")

    H(doc, "F.3 Viva Demonstration Script", 2)
    CODE(doc, """-- ── DEMO: Attempt to tamper with a COMPLETED trip ───────────────────────
-- Trip 1 (Colombo Fort -> Nugegoda) is COMPLETED with total_fare = 1925.00

-- Test 1: Attempt to change the fare (SHOULD FAIL with error 50101)
BEGIN TRY
    UPDATE trips SET total_fare = 1.00 WHERE id = 1;   -- Fraudulent edit!
    PRINT 'Update succeeded (UNEXPECTED — trigger failed!)';
END TRY
BEGIN CATCH
    SELECT
        ERROR_NUMBER()   AS error_number,
        ERROR_MESSAGE()  AS error_message,
        ERROR_SEVERITY() AS severity;
END CATCH;
GO

-- Test 2: Attempt to reopen a COMPLETED trip (SHOULD FAIL)
BEGIN TRY
    UPDATE trips SET status = 'REQUESTED' WHERE id = 1;
END TRY
BEGIN CATCH
    SELECT ERROR_MESSAGE() AS error_message;
END CATCH;
GO

-- Test 3: Verify Trip 1 data is completely UNCHANGED after both attempts
SELECT id, pickup_address, dropoff_address, total_fare,
       platform_commission, driver_net, status
FROM trips WHERE id = 1;
GO

-- Test 4: Verify a NON-financial update STILL works (trigger does not over-block)
UPDATE trips SET updated_at = GETDATE() WHERE id = 1;
SELECT id, updated_at FROM trips WHERE id = 1;
GO""", "F.3 — Viva Demo: Testing Trigger Protection")

    SCRN(doc, "Trigger firing with Error 50101 on fare tamper attempt")
    SCRN(doc, "Error message on status change attempt")
    SCRN(doc, "Trip 1 data completely unchanged after both attack attempts")
    SCRN(doc, "Non-financial UPDATE (updated_at) succeeds — trigger precision verified")

    H(doc, "F.4 Viva Q&A — Trigger", 2)
    QA(doc, "What is the difference between the inserted and deleted virtual tables?",
       "In an AFTER UPDATE trigger, SQL Server automatically populates two temporary virtual "
       "tables. 'deleted' contains the BEFORE state of every row that was updated (the original "
       "values before the UPDATE statement ran). 'inserted' contains the AFTER state (the new "
       "values the UPDATE tried to write). By JOINing deleted.id = inserted.id, we can compare "
       "any column's old vs new value and detect tampering attempts.")
    QA(doc, "Why AFTER UPDATE and not INSTEAD OF UPDATE?",
       "INSTEAD OF triggers replace the entire UPDATE operation. The developer must manually "
       "re-implement the update logic inside the trigger body, which is complex and error-prone. "
       "For data protection scenarios, AFTER with ROLLBACK is simpler, clearer, and the industry "
       "standard: allow the operation to stage, inspect the result, reject it if it violates "
       "integrity, and roll back.")
    QA(doc, "What happens to the Spring Boot application when this trigger fires?",
       "The THROW 50101 propagates as a SQL exception through JDBC up to the Spring Boot "
       "data access layer. Since our TripDAO uses @Transactional, Spring catches the DataAccessException, "
       "rolls back the transaction, and the service layer surfaces a 400 Bad Request HTTP response "
       "with the error message to the API caller. The data is never corrupted.")
    QA(doc, "What if a legitimate admin correction is needed on a finalized fare?",
       "The correct approach is a separate stored procedure (e.g., usp_AdminCorrectFare) "
       "that requires SUPER_ADMIN role, first writes an audit_logs entry documenting the "
       "change and its reason, then uses DISABLE TRIGGER trg_ProtectFinalizedTrips ON trips, "
       "applies the correction, re-enables the trigger with ENABLE TRIGGER, and logs the "
       "action again. This preserves the protection for all non-admin operations while "
       "providing a controlled, fully-audited escape hatch for legitimate corrections.")

    doc.add_page_break()

    # ════ PART G ════
    H(doc, "Part G: Viva Preparation & Execution Guide", 1)
    BOX(doc, "This is your personal viva preparation guide. Every team member must understand "
        "their own module's queries AND the shared schema design decisions. Practice running "
        "the demo scripts LIVE in SSMS before the viva day.", "warn")

    H(doc, "G.1 Core Database Concept Q&A", 2)
    core_qa = [
        ("What is the difference between a Primary Key and a UNIQUE constraint?",
         "Both enforce uniqueness but differ in two key ways: (1) A Primary Key guarantees NOT NULL "
         "AND unique, while a UNIQUE constraint allows exactly one NULL value per column. "
         "(2) SQL Server creates a clustered index for the Primary Key by default (unless overridden), "
         "while UNIQUE creates a non-clustered index. A table can have only ONE Primary Key but "
         "multiple UNIQUE constraints. In Streetify, id is the PK (clustered, not null) and "
         "email, number_plate, and trip_id in payments are UNIQUE constraints (candidate keys)."),
        ("Why BIGINT instead of INT for all ID columns?",
         "INT supports roughly 2.1 billion rows. A production ride-hailing platform with millions "
         "of trips per year across all tables would reach this limit. BIGINT supports 9.2 quintillion "
         "rows, making overflow impossible. The cost difference (4 bytes vs 8 bytes per ID column) "
         "is negligible at this scale compared to the operational risk of ID exhaustion."),
        ("What is the dtype column in users and why is it there?",
         "dtype is the Single Table Inheritance (STI) discriminator column used by JPA/Hibernate — "
         "our Spring Boot ORM framework. Since Passengers, Drivers, and Admins all share the same "
         "users table, dtype tells the application which Java class to instantiate for each row "
         "(Driver.class, Passenger.class, etc.). It also enables efficient database filtering: "
         "WHERE dtype='DRIVER' returns only driver rows without joining any other table."),
        ("Why DECIMAL(10,2) for money instead of FLOAT or DOUBLE?",
         "IEEE 754 floating-point (FLOAT/DOUBLE) uses binary fractions internally, which cannot "
         "exactly represent all decimal values. The classic example: 0.1 + 0.2 in binary floating "
         "point equals 0.30000000000000004, not 0.3. In a financial system processing millions of "
         "LKR transactions, these rounding errors would compound into real money discrepancies. "
         "DECIMAL is an exact numeric type — it stores values as scaled integers internally, "
         "giving guaranteed decimal precision. This is a mandatory requirement in any financial system."),
        ("Explain why we used Single Table Inheritance for users instead of separate tables.",
         "STI was chosen for performance. The most frequent database query in Streetify is "
         "authentication (login) — SELECT * FROM users WHERE email = ? — which needs role, active, "
         "and suspended in a single lookup. With separate passengers/drivers/staff tables "
         "(Table-Per-Subtype), every login would require a JOIN. STI eliminates this overhead "
         "completely. The trade-off is NULL columns for role-specific attributes, but this is "
         "acceptable because the application enforces that dtype='PASSENGER' rows never populate "
         "driver-specific columns (license_number, etc.)."),
        ("What is referential integrity and how is it enforced in Streetify?",
         "Referential integrity ensures that FK values in a child table always reference an "
         "existing PK value in the parent table. Streetify enforces this through FOREIGN KEY "
         "constraints on all FK columns. SQL Server prevents inserting a trip with a "
         "passenger_id that does not exist in users.id, and prevents deleting a user who "
         "still has active trips. For vehicles and driver_documents, ON DELETE CASCADE means "
         "deleting a driver also deletes their vehicle and documents automatically."),
        ("Prove the schema is in 3NF.",
         "1NF: All column values are atomic — no arrays, no composite values, no repeating groups. "
         "Composite EER attributes (PickupLocation) are flattened. 2NF: All tables use single-column "
         "surrogate PKs, so partial dependencies on a composite PK are architecturally impossible. "
         "3NF: No non-key attribute determines another non-key attribute. In payments, "
         "platform_commission is stored as a snapshot, not derived from another column at query time. "
         "Therefore, no transitive dependency exists. All 9 tables satisfy 3NF."),
    ]
    for q, a in core_qa:
        QA(doc, q, a)

    H(doc, "G.2 Module-Specific Viva Q&A", 2)
    module_qa = [
        ("Lahiru — How does Streetify prevent duplicate user registrations?",
         "The email column in users has a UNIQUE constraint enforced at the database level. "
         "Even if the application layer fails to check for duplicates, SQL Server raises a "
         "unique constraint violation error (error 2627) when a duplicate INSERT is attempted. "
         "The Spring Boot AuthService also queries for existing email before inserting, "
         "providing a user-friendly error message before the DB constraint fires."),
        ("Chanuka — How does the fare calculation relate to the database schema?",
         "The trips table stores base_fare, per_km_rate, platform_fee, and distance_km as inputs, "
         "with total_fare as the calculated output. The BookingController calls a FareEstimateDTO "
         "calculation service before inserting the trip. The formula is: "
         "total_fare = base_fare + (per_km_rate * distance_km) + platform_fee. "
         "platform_commission = total_fare * 0.15 and driver_net = total_fare * 0.85 are "
         "computed and stored at trip creation time."),
        ("Tharindu — How does the driver verification workflow use the database?",
         "Drivers register and get dtype='DRIVER' with verification_status='PENDING_VERIFICATION'. "
         "They upload documents via the app, stored in driver_documents with status='PENDING'. "
         "An admin reviews documents in the SSMS driver management module and updates "
         "driver_documents.status to 'APPROVED' or 'REJECTED' with a reviewer_note. "
         "After all documents are approved, the admin updates users.verification_status='APPROVED', "
         "which allows the driver to go online (is_online=1) and receive trip assignments."),
        ("Daham — Walk me through a complete CARD payment flow in the database.",
         "1) Trip completes: trips.status='COMPLETED'. 2) App calls usp_ProcessTripPayment "
         "(TripID, 'CARD', amount). 3) Guard 1 validates trip is COMPLETED. 4) Guard 2 confirms "
         "no existing payment. 5) Inside BEGIN TRANSACTION: a payment row is inserted with "
         "status='SUCCESS', platform_commission=15%, driver_net=85%, and a unique transaction_ref. "
         "trips.is_paid=1 is updated. No wallet changes for CARD (handled by payment gateway). "
         "6) COMMIT. 7) Receipt SELECT returned. The entire flow is atomic — all or nothing."),
        ("Mithun — How is a review stored and linked to a driver rating?",
         "After a COMPLETED trip, the passenger submits rating (1-5) + comment. A row is "
         "inserted into reviews with trip_id (UNIQUE FK), passenger_id, driver_id, and rating. "
         "The ReviewController then triggers an UPDATE: UPDATE users SET average_rating = "
         "(SELECT AVG(rating) FROM reviews WHERE driver_id = @DriverID), total_trips = total_trips + 1 "
         "WHERE id = @DriverID. This keeps the denormalized average_rating current without needing "
         "a JOIN on reviews every time a driver's rating is displayed."),
        ("Vidura — What is the purpose of audit_logs and why has it no CASCADE?",
         "audit_logs records every privileged admin action (ADMIN_LOGIN, DISPUTE_RESOLVED, "
         "ACCOUNT_SUSPENDED, etc.) for security and compliance purposes. It intentionally has "
         "NO FOREIGN KEY constraint on performed_by_staff_id. This allows audit records to "
         "survive even if the admin account is deactivated or deleted — critical for forensic "
         "investigations. The performed_by_email column provides a human-readable identity "
         "even after the account is gone."),
    ]
    for q, a in module_qa:
        QA(doc, q, a)

    H(doc, "G.3 Live Demonstration Sequence for Viva Day", 2)
    P(doc, "Follow this exact sequence to deliver a confident, well-paced viva demonstration:", sz=10.5)
    steps = [
        ("1", "Open SSMS, connect to streetify_db",
         "Show Object Explorer with all 9 tables. Say: 'Our schema spans 9 tables across 6 modules.'"),
        ("2", "SELECT * from users, trips, payments",
         "Show seeded data. Identify your own team member record. Point to dtype and role columns."),
        ("3", "Run D.2 (JOIN query)",
         "Most impressive query. Explain INNER JOIN on passenger, LEFT JOIN on driver. "
         "Say: 'This is what Customer Support sees when investigating a dispute.'"),
        ("4", "Run D.3 (Aggregation)",
         "Show payment method revenue breakdown. Explain GROUP BY and SUM aggregate functions."),
        ("5", "Run D.4 (GROUP BY / HAVING)",
         "Explain: 'HAVING filters after GROUP BY. You cannot use WHERE on aggregate functions.'"),
        ("6", "Run D.5 (Subquery)",
         "Explain scalar subquery. 'The inner SELECT runs once and its result is used as a filter.'"),
        ("7", "Execute usp_ProcessTripPayment (CASH)",
         "Run the stored procedure live. Show the receipt result. Show commission_debt updated."),
        ("8", "Test trigger with invalid UPDATE",
         "Run UPDATE trips SET total_fare=1 WHERE id=1. Show error 50101. Show data unchanged."),
        ("9", "Run your module-specific query (D.6)",
         "Each member runs their section. Explain the business purpose before executing."),
        ("10", "Show DB Health Check",
         "Run the record count query from 04_utility_test_scripts.sql. Shows professional completeness."),
    ]
    TBL(doc, ["#", "Action", "What to Say"], steps)

    doc.add_paragraph()
    BOX(doc, "GOLDEN RULE: Always state the business reason BEFORE running a query. "
        "'This query helps the Finance Manager see payment channel performance' scores "
        "far higher than just pressing F5. Examiners award marks for domain understanding, "
        "not just technical execution.", "warn")

    doc.add_page_break()

    # ════ REFERENCES ════
    H(doc, "References", 1)
    refs = [
        "Elmasri, R. & Navathe, S. B. (2015). Fundamentals of Database Systems (7th ed.). Pearson. "
        "[ER-to-Relational Mapping Rules — Chapter 9; Normalization — Chapter 15]",
        "Microsoft Corporation. (2024). Transact-SQL Reference (T-SQL): CREATE TABLE, CREATE INDEX, "
        "CREATE PROCEDURE, CREATE TRIGGER, XACT_ABORT, TRY...CATCH, THROW. "
        "https://learn.microsoft.com/en-us/sql/t-sql/",
        "Codd, E. F. (1970). A Relational Model of Data for Large Shared Data Banks. "
        "Communications of the ACM, 13(6), 377-387.",
        "Fowler, M. (2002). Patterns of Enterprise Application Architecture. Addison-Wesley. "
        "[Single Table Inheritance Pattern — pp. 278-284]",
        "Hibernate ORM Documentation. (2024). Single Table Inheritance (STI) — JPA / Hibernate. "
        "https://docs.jboss.org/hibernate/orm/current/userguide/html_single/Hibernate_User_Guide.html",
        "Streetify Group 24. (2026). Assignment 01 — Enhanced Entity-Relationship (EER) Diagram. "
        "docs/2026-Y2-S1-KU-24 (Group 24)_Assignment01_EER.pdf.",
        "Streetify Group 24. (2026). Assignment 01 — System Requirements Specification. "
        "docs/2026-Y2-S1-KU-24 (Group 24)_Assignment01_Requirements.pdf.",
        "Streetify Group 24. (2026). Project Proposal Report. "
        "docs/2026-Y2-S1-KU-24_Proposal_Report.pdf.",
        "Streetify Group 24. (2026). Source Code & Database Scripts. "
        "database/01_schema_ddl.sql, database/02_seed_data.sql, database/03_team_member_queries.sql, "
        "database/04_utility_test_scripts.sql.",
        "Streetify Group 24. (2026). Project Evaluation Guide. Streetify_Evaluation_Guide.md.",
    ]
    from docx.shared import Cm as DxCm, Pt as DxPt
    for i, ref in enumerate(refs, 1):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent       = DxCm(1.0)
        p.paragraph_format.first_line_indent = DxCm(-1.0)
        p.paragraph_format.space_after       = DxPt(6)
        r = p.add_run(f"[{i}]  {ref}")
        r.font.size = DxPt(10); r.font.name = "Calibri"
        from rpt_helpers import C_GREY
        r.font.color.rgb = C_GREY
