# 🎓 Streetify — 30-Minute Database Viva & Live Coding Defense Guide
**SLIIT Faculty of Computing | IT2140 Database Design & Development**  
**Group ID:** `2026-Y2-S1-KU-24` (Group 24)  
**Document Reference:** `2026-Y2-S1-KU-24_Assignment01_Part02.docx` (40 Pages)

---

## 📌 Executive Summary: How the 30-Minute Viva Works

Examiners evaluate your group in 3 distinct phases within the 30-minute window:
1. **Phase 1: Architecture & Normalization Defense (8–10 Mins)**
   - Checking the Relational Schema Mapping (Part A).
   - Asking why you picked Single Table Inheritance (STI), why `DECIMAL(10,2)` for money, why `ON DELETE CASCADE` is on vehicles but **not** on trips/payments.
2. **Phase 2: Live SQL Coding Test — "Create Table in New DB" (12–15 Mins)**
   - *The Rumor Confirmed:* Examiners often tell each member:
     > *"Open a new query window in SSMS. Create a new database. Look at your module's table in your Part A schema table. Type the CREATE TABLE statement with Primary Key and constraints. Now INSERT 2 rows, UPDATE a value, and DELETE a row."*
3. **Phase 3: Advanced Queries, Aggregations, & Trigger/Stored Procedure (7–10 Mins)**
   - Demonstrating `AVG`, `MIN`, `MAX`, `SUM`, `COUNT`.
   - Explaining `WHERE` vs `HAVING`.
   - Running subqueries and multi-table `JOIN`s.
   - Demonstrating Stored Procedure `usp_ProcessTripPayment` and Trigger `trg_ProtectFinalizedTrips`.

---

## ⚡ Step 0: The Universal Live-Coding Starter Script
When the examiner asks you to create a new database on the spot:
```sql
-- Step 0.1: Create fresh database
CREATE DATABASE streetify_viva_test;
GO
USE streetify_viva_test;
GO
```

---

## 👥 Member-by-Member Defense & Live-Coding Blueprints

### 1. 👤 LAHIRU (IT25102208) — User Account & Verification
- **Table Assigned:** `users`
- **Core Architecture:** Single Table Inheritance (STI), Candidate Key (`email UNIQUE`), Password Hashing (BCrypt), Wallet Balance.

#### 🎯 Viva Theory Defense:
- **Q: Why Single Table Inheritance (STI) instead of separate Passenger and Driver tables?**
  > *A:* Authentication is the most frequent query in Streetify. With STI, a user login is a single indexed scan on `users.email` without needing a multi-table `JOIN`. Role-specific attributes have NULLs, which are strictly managed by application business logic.
- **Q: Why is `wallet_balance` `DECIMAL(10,2)` and not `FLOAT`?**
  > *A:* `FLOAT` uses IEEE 754 binary floating-point representation, causing rounding errors (`0.1 + 0.2 != 0.3`). In financial systems, `DECIMAL(10,2)` is an exact numeric data type mandatory for financial precision.

#### 💻 Live Coding Queries:
```sql
-- 1. CREATE TABLE
CREATE TABLE users (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    dtype VARCHAR(31) NOT NULL,            -- Discriminator: 'PASSENGER', 'DRIVER', 'USER'
    email NVARCHAR(150) NOT NULL UNIQUE,   -- Candidate key (prevents duplicates)
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
GO

-- 2. INSERT (DML)
INSERT INTO users (dtype, email, password_hash, first_name, last_name, phone, role, wallet_balance)
VALUES 
('PASSENGER', 'lahiru.demo@streetify.lk', '$2a$10$demoHashBcryptValue...', 'Lahiru', 'Peris', '+94771111111', 'PASSENGER', 5000.00),
('DRIVER', 'kamal.demo@streetify.lk', '$2a$10$demoHashBcryptValue...', 'Kamal', 'Perera', '+94774444444', 'DRIVER', 0.00);

-- 3. UPDATE
UPDATE users 
SET wallet_balance = wallet_balance + 1500.00 
WHERE email = 'lahiru.demo@streetify.lk';

-- 4. DELETE
DELETE FROM users WHERE email = 'kamal.demo@streetify.lk';

-- 5. ADVANCED QUERY: AVG, MIN, MAX + SUBQUERY
-- Aggregation by role:
SELECT 
    role,
    COUNT(*) AS total_users,
    AVG(wallet_balance) AS avg_wallet_balance,
    MIN(wallet_balance) AS min_wallet_balance,
    MAX(wallet_balance) AS max_wallet_balance
FROM users
GROUP BY role;

-- Subquery (Above average wallet balances):
SELECT id, first_name + ' ' + last_name AS passenger_name, email, wallet_balance
FROM users
WHERE dtype = 'PASSENGER'
  AND wallet_balance > (SELECT AVG(wallet_balance) FROM users WHERE dtype = 'PASSENGER');
```

---

### 2. 🚖 CHANUKA (IT25102207) — Ride Booking & Dispatch Engine
- **Table Assigned:** `trips`
- **Core Architecture:** Central Transactional Entity, Foreign Keys to `users`, 7-State Lifecycle, Composite Attribute Flattening.

#### 🎯 Viva Theory Defense:
- **Q: How did you map the composite EER attribute PickupLocation?**
  > *A:* Per Rule 2 of EER-to-Relational mapping, composite attributes are flattened into atomic columns: `pickup_lat`, `pickup_lng`, `pickup_address`, `dropoff_lat`, `dropoff_lng`, `dropoff_address`. This maintains First Normal Form (1NF) and avoids extra joins.
- **Q: Why is driver_id in trips nullable?**
  > *A:* When a passenger first books a ride, the trip is in the `REQUESTED` state and has no driver assigned yet. The `driver_id` remains NULL until a driver accepts the trip.

#### 💻 Live Coding Queries:
```sql
-- 1. CREATE TABLE
CREATE TABLE trips (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    passenger_id BIGINT NOT NULL,
    driver_id BIGINT NULL,                 -- NULLable until driver accepts
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
    status VARCHAR(20) NOT NULL DEFAULT 'REQUESTED',
    is_paid BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    completed_at DATETIME2 NULL,
    CONSTRAINT FK_trips_passenger FOREIGN KEY (passenger_id) REFERENCES users(id),
    CONSTRAINT FK_trips_driver FOREIGN KEY (driver_id) REFERENCES users(id)
);
GO

-- 2. INSERT (DML)
INSERT INTO trips (passenger_id, driver_id, pickup_address, dropoff_address, distance_km, ride_type, base_fare, per_km_rate, total_fare, platform_commission, driver_net, status)
VALUES 
(1, 2, 'Colombo Fort', 'Nugegoda Junction', 10.5, 'CAR', 300.0, 150.0, 1925.00, 288.75, 1636.25, 'COMPLETED');

-- 3. UPDATE
UPDATE trips 
SET status = 'COMPLETED', is_paid = 1, completed_at = GETDATE() 
WHERE id = 1;

-- 4. DELETE
DELETE FROM trips WHERE id = 1 AND status = 'CANCELLED';

-- 5. ADVANCED QUERY: JOIN (D.2) & GROUP BY / HAVING (D.4)
-- Multi-table JOIN with ISNULL fallback:
SELECT 
    t.id AS trip_id,
    p.first_name + ' ' + p.last_name AS passenger_name,
    ISNULL(d.first_name + ' ' + d.last_name, 'UNASSIGNED') AS driver_name,
    t.pickup_address, t.dropoff_address, t.distance_km, t.total_fare, t.status
FROM trips t
INNER JOIN users p ON t.passenger_id = p.id
LEFT JOIN users d ON t.driver_id = d.id;

-- GROUP BY with HAVING:
SELECT 
    ride_type,
    COUNT(*) AS total_trips,
    AVG(distance_km) AS avg_distance_km,
    SUM(total_fare) AS total_revenue
FROM trips
GROUP BY ride_type
HAVING COUNT(*) >= 1;
```

---

### 3. 🚗 THARINDU (IT25102241) — Driver Management & Verification
- **Table Assigned:** `vehicles` & `driver_documents`
- **Core Architecture:** 1:1 Relationship via `UNIQUE FK`, `ON DELETE CASCADE` Existential Dependency, Number Plate candidate key.

#### 🎯 Viva Theory Defense:
- **Q: Why does vehicles have ON DELETE CASCADE while trips does not?**
  > *A:* Vehicles and driver documents have an **existential dependency** on the driver—a vehicle registration has no meaning if the driver account is purged. In contrast, `trips` and `payments` are core financial ledgers that must never be deleted even if a user account is removed.
- **Q: How is the 1:1 relationship between Driver and Vehicle enforced?**
  > *A:* By placing a `UNIQUE` constraint on `vehicles.driver_id`. A standard Foreign Key allows many vehicles per driver; the `UNIQUE` constraint strictly enforces a 1:1 relationship at the database engine level.

#### 💻 Live Coding Queries:
```sql
-- 1. CREATE TABLE
CREATE TABLE vehicles (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    driver_id BIGINT NOT NULL UNIQUE,     -- UNIQUE constraint enforces 1:1
    vehicle_type VARCHAR(20) NOT NULL,    -- 'CAR', 'TUK', 'VAN', 'BIKE'
    number_plate NVARCHAR(20) NOT NULL UNIQUE,
    year_of_manufacture INT NOT NULL,
    make NVARCHAR(100) NULL,
    model NVARCHAR(100) NULL,
    color NVARCHAR(20) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_vehicles_driver FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
);
GO

-- 2. INSERT (DML)
INSERT INTO vehicles (driver_id, vehicle_type, number_plate, year_of_manufacture, make, model, color)
VALUES (2, 'CAR', 'WP CAB-1234', 2018, 'Toyota', 'Prius', 'Pearl White');

-- 3. UPDATE
UPDATE vehicles 
SET color = 'Silver', number_plate = 'WP CAB-9999' 
WHERE driver_id = 2;

-- 4. DELETE
DELETE FROM vehicles WHERE number_plate = 'WP CAB-9999';

-- 5. ADVANCED QUERY: Fleet Operations Dashboard (D.1 from doc)
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
ORDER BY u.is_online DESC, u.average_rating DESC;
```

---

### 4. 💳 DAHAM (IT25102225) — Payment & Financial Settlement
- **Table Assigned:** `payments`
- **Core Architecture:** 1:1 Enforcement with Trips, Financial Snapshots (15% platform commission / 85% driver payout), Exact `DECIMAL(10,2)` Precision.

#### 🎯 Viva Theory Defense:
- **Q: Why store platform_commission and driver_net as snapshots if they can be calculated?**
  > *A:* If Streetify modifies its commission policy in the future (e.g. from 15% to 12%), calculating past earnings dynamically would corrupt historical accounting. Storing immutable financial snapshots at payment time preserves financial integrity for legal audits.
- **Q: How does the schema prevent double-charging a passenger?**
  > *A:* The column `trip_id` in `payments` has a `UNIQUE FOREIGN KEY` constraint. If a network retry attempts to insert a second payment for the same `trip_id`, SQL Server immediately rejects it with a unique constraint violation.

#### 💻 Live Coding Queries:
```sql
-- 1. CREATE TABLE
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
GO

-- 2. INSERT (DML)
INSERT INTO payments (trip_id, passenger_id, driver_id, gross_amount, platform_commission, driver_net, payment_method, status, transaction_ref, processed_at)
VALUES 
(1, 1, 2, 1925.00, 288.75, 1636.25, 'CARD', 'SUCCESS', 'TXN_CARD_894312', GETDATE());

-- 3. UPDATE
UPDATE payments 
SET retry_count = retry_count + 1, status = 'FAILED' 
WHERE id = 1;

-- 4. DELETE
DELETE FROM payments WHERE id = 1 AND status = 'FAILED';

-- 5. ADVANCED QUERY: Revenue Aggregation with AVG, MIN, MAX (D.3 from doc)
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
ORDER BY total_gross_revenue DESC;
```

---

### 5. ⭐ MITHUN (IT25102193) — Review & Dispute Management
- **Table Assigned:** `reviews` & `dispute_tickets`
- **Core Architecture:** Domain Integrity with `CHECK (rating BETWEEN 1 AND 5)`, 1:1 Review per Trip, Customer Dispute Resolution.

#### 🎯 Viva Theory Defense:
- **Q: How did you enforce that ratings must be between 1 and 5?**
  > *A:* Using a table-level or column-level `CHECK` constraint: `CHECK (rating >= 1 AND rating <= 5)`. Any attempt to insert ratings of 0 or 6 is blocked at the database engine level.
- **Q: Why can a passenger only review a trip once?**
  > *A:* Because `trip_id` in the `reviews` table has a `UNIQUE FOREIGN KEY` constraint, guaranteeing exactly one review per completed trip.

#### 💻 Live Coding Queries:
```sql
-- 1. CREATE TABLE
CREATE TABLE reviews (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    trip_id BIGINT NOT NULL UNIQUE,       -- Exactly 1 review per trip
    passenger_id BIGINT NOT NULL,
    driver_id BIGINT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5), -- Domain constraint
    comment NVARCHAR(1000) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_reviews_trip FOREIGN KEY (trip_id) REFERENCES trips(id),
    CONSTRAINT FK_reviews_passenger FOREIGN KEY (passenger_id) REFERENCES users(id),
    CONSTRAINT FK_reviews_driver FOREIGN KEY (driver_id) REFERENCES users(id)
);
GO

-- 2. INSERT (DML)
INSERT INTO reviews (trip_id, passenger_id, driver_id, rating, comment)
VALUES (1, 1, 2, 5, 'Super clean car, friendly driver and arrived right on time!');

-- 3. PROVING CHECK CONSTRAINT (Examiner Test):
-- Show examiner what happens when an invalid rating is inserted:
-- INSERT INTO reviews (trip_id, passenger_id, driver_id, rating) VALUES (2, 1, 2, 6);
-- Returns: "The INSERT statement conflicted with the CHECK constraint..."

-- 4. UPDATE
UPDATE reviews 
SET comment = 'Updated: Excellent driving and navigation skills.' 
WHERE id = 1;

-- 5. DELETE
DELETE FROM reviews WHERE id = 1;

-- 6. ADVANCED QUERY: Driver Performance Classification (CASE Statement)
SELECT 
    id AS driver_id,
    first_name + ' ' + last_name AS driver_name,
    average_rating,
    total_trips,
    CASE 
        WHEN average_rating >= 4.8 THEN '⭐ Top Rated'
        WHEN average_rating >= 4.0 THEN '👍 Good'
        ELSE '⚠️ Needs Attention'
    END AS driver_performance_tier
FROM users
WHERE dtype = 'DRIVER'
ORDER BY average_rating DESC;
```

---

### 6. 🛡️ VIDURA (IT25102240) — Super Admin & Governance
- **Table Assigned:** `audit_logs`
- **Core Architecture:** Security Audit Trail, ACID Transactions (`usp_ProcessTripPayment`), Anti-Fraud Trigger (`trg_ProtectFinalizedTrips`), RBAC Governance.

#### 🎯 Viva Theory Defense:
- **Q: How does your Stored Procedure ensure ACID compliance?**
  > *A:* It uses explicit transaction management (`BEGIN TRANSACTION`, `COMMIT`, `ROLLBACK`), guards against invalid states with `THROW 50001/50002`, enables `SET XACT_ABORT ON` to auto-rollback on any statement-level error, and uses `TRY...CATCH` with `XACT_STATE()` to cleanly undo partial writes.
- **Q: Why is trg_ProtectFinalizedTrips an AFTER UPDATE trigger and what does it protect?**
  > *A:* It is an AFTER UPDATE trigger that inspects SQL Server's virtual `inserted` and `deleted` tables. If a trip's status was already 'COMPLETED' or 'CANCELLED' and any user tries to alter financial columns (`total_fare`, `driver_net`, `platform_commission`, `distance_km`), it executes `ROLLBACK TRANSACTION` with error 50101 to prevent fraud.

#### 💻 Live Coding Queries:
```sql
-- 1. CREATE TABLE
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
GO

-- 2. INSERT (DML)
INSERT INTO audit_logs (performed_by_staff_id, performed_by_email, action_type, description, target_user_id, target_entity_type, target_entity_id)
VALUES (1, 'admin@streetify.com', 'DISPUTE_RESOLVED', 'Approved partial refund of LKR 100 to passenger.', 9, 'DISPUTE_TICKET', 1);

-- 3. UPDATE
UPDATE audit_logs 
SET description = description + ' [Verified by Super Admin]' 
WHERE id = 1;

-- 4. DELETE
DELETE FROM audit_logs WHERE id = 1;

-- 5. ADVANCED QUERY: Conditional Aggregations (Active vs Suspended)
SELECT 
    role,
    COUNT(*) AS total_count,
    SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) AS active_count,
    SUM(CASE WHEN suspended = 1 THEN 1 ELSE 0 END) AS suspended_count
FROM users
GROUP BY role;

-- 6. LIVE TRIGGER FRAUD TEST (Proves Anti-Fraud Protection to Examiner):
BEGIN TRY
    UPDATE trips SET total_fare = 1.00 WHERE id = 1; -- Attempt fraudulent fare alteration
    PRINT 'UNEXPECTED: Trigger failed to block mutation!';
END TRY
BEGIN CATCH
    SELECT ERROR_NUMBER() AS error_number, ERROR_MESSAGE() AS error_message;
    -- Returns Error 50101: CRITICAL INTEGRITY VIOLATION: Finalized trips are immutable...
END CATCH;
```

---

## 💡 The Top 5 Examiner "Trap" Questions & Model Answers

1. **Examiner: "What is the difference between WHERE and HAVING?"**
   - **Answer:** `WHERE` filters individual rows **BEFORE** grouping. It cannot contain aggregate functions (`WHERE SUM(total_fare) > 1000` is illegal syntax). `HAVING` filters grouped rows **AFTER** aggregation (e.g., `HAVING COUNT(*) > 5`).
2. **Examiner: "What is the difference between a Scalar Subquery and a Correlated Subquery?"**
   - **Answer:** A Scalar Subquery returns a single value (1 row, 1 column) and is evaluated once (e.g. `WHERE total_fare > (SELECT AVG(total_fare) FROM trips)`). A Correlated Subquery references a column from the outer query and executes repeatedly for each row evaluated by the outer query.
3. **Examiner: "Why did you use BIGINT IDENTITY(1,1) instead of using email as the Primary Key?"**
   - **Answer:** Surrogate integer keys are 8-byte integers that provide superior B-tree index traversal performance, compact foreign key storage in child tables, and insulate database relationships if a user updates their email. The natural key (`email`) is protected with a `UNIQUE` candidate key constraint.
4. **Examiner: "How did you verify Boyce-Codd Normal Form (BCNF)?"**
   - **Answer:** A relation is in BCNF if for every functional dependency $X \rightarrow Y$, $X$ is a superkey. In Streetify, all non-key attributes depend only on surrogate primary keys, and all secondary functional determinants (`email`, `number_plate`, `trip_id` in payments) are enforced as `UNIQUE` constraints, satisfying BCNF.
5. **Examiner: "Why did you use an AFTER trigger instead of an INSTEAD OF trigger?"**
   - **Answer:** An `AFTER UPDATE` trigger fires after changes are staged in the transaction but before commit. It allows us to compare the `deleted` table (original state) and `inserted` table (new state). If finalized fields were modified, we issue `ROLLBACK TRANSACTION`. An `INSTEAD OF` trigger would require reimplementing the entire update statement manually.

---

## 📁 Files in Your Repository to Reference
- **Word Document (.docx) Ready for Sharing:** [`Streetify_DB_Viva_Master_Guide.docx`](file:///e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/database/Streetify_DB_Viva_Master_Guide.docx)
- **Complete Schema DDL:** [`01_schema_ddl.sql`](file:///e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/database/01_schema_ddl.sql)
- **Seed Data:** [`02_seed_data.sql`](file:///e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/database/02_seed_data.sql)
- **Team Module Verification Queries:** [`03_team_member_queries.sql`](file:///e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/database/03_team_member_queries.sql)
- **ACID Stored Procedure:** [`06_stored_procedure.sql`](file:///e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/database/06_stored_procedure.sql)
- **Anti-Fraud Trigger:** [`07_trigger.sql`](file:///e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/database/07_trigger.sql)
