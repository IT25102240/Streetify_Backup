-- ════════════════════════════════════════════════════════════════════════════════
-- 🚗 STREETIFY DATABASE SCHEMA (MSSQL DDL)
-- Complete schema creation script with relational integrity & indexes
-- ════════════════════════════════════════════════════════════════════════════════

-- 1. Create Database (Run if database does not already exist)
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'streetify_db')
BEGIN
    CREATE DATABASE streetify_db;
    PRINT '✅ Database streetify_db created successfully.';
END
GO

USE streetify_db;
GO

-- ════════════════════════════════════════════════════════════════════════════════
-- 2. Drop existing foreign keys and tables (for clean migration if needed)
-- ════════════════════════════════════════════════════════════════════════════════
IF OBJECT_ID(N'audit_logs', N'U') IS NOT NULL DROP TABLE audit_logs;
IF OBJECT_ID(N'dispute_tickets', N'U') IS NOT NULL DROP TABLE dispute_tickets;
IF OBJECT_ID(N'reviews', N'U') IS NOT NULL DROP TABLE reviews;
IF OBJECT_ID(N'payments', N'U') IS NOT NULL DROP TABLE payments;
IF OBJECT_ID(N'trips', N'U') IS NOT NULL DROP TABLE trips;
IF OBJECT_ID(N'driver_documents', N'U') IS NOT NULL DROP TABLE driver_documents;
IF OBJECT_ID(N'vehicles', N'U') IS NOT NULL DROP TABLE vehicles;
IF OBJECT_ID(N'users', N'U') IS NOT NULL DROP TABLE users;
GO

-- ════════════════════════════════════════════════════════════════════════════════
-- 3. Users Table (Single Table Inheritance for Users, Passengers, and Drivers)
-- ════════════════════════════════════════════════════════════════════════════════
CREATE TABLE users (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    dtype                   VARCHAR(31) NOT NULL,               -- 'USER', 'PASSENGER', 'DRIVER'
    first_name              NVARCHAR(100) NOT NULL,
    last_name               NVARCHAR(100) NOT NULL,
    email                   NVARCHAR(150) NOT NULL UNIQUE,
    password_hash           NVARCHAR(255) NOT NULL,
    phone                   NVARCHAR(20),
    role                    VARCHAR(20) NOT NULL,               -- 'PASSENGER', 'DRIVER', 'ADMIN'
    admin_role              VARCHAR(30) NULL,                   -- 'SUPER_ADMIN', 'USER_MGMT', 'BOOKING_MGMT', 'DRIVER_MGMT', 'PAYMENT_MGMT', 'REVIEW_MGMT'
    active                  BIT NOT NULL DEFAULT 1,
    suspended               BIT NOT NULL DEFAULT 0,
    suspension_reason       NVARCHAR(500) NULL,
    suspended_until         DATETIME2 NULL,
    wallet_balance          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    
    -- Passenger-specific fields
    preferred_payment_method VARCHAR(20) NULL,                 -- 'CASH', 'CARD', 'WALLET'
    
    -- Driver-specific fields
    license_number          NVARCHAR(50) NULL,
    nic                     NVARCHAR(20) NULL,
    verification_status     VARCHAR(30) NULL DEFAULT 'PENDING_VERIFICATION', -- 'PENDING_VERIFICATION', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'
    average_rating          FLOAT NULL DEFAULT 5.0,
    total_trips             INT NULL DEFAULT 0,
    commission_debt         DECIMAL(10,2) NULL DEFAULT 0.00,
    is_online               BIT NULL DEFAULT 0,
    current_lat             FLOAT NULL,
    current_lng             FLOAT NULL,
    
    created_at              DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at              DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_dtype ON users(dtype);
GO

-- ════════════════════════════════════════════════════════════════════════════════
-- 4. Vehicles Table
-- ════════════════════════════════════════════════════════════════════════════════
CREATE TABLE vehicles (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    driver_id               BIGINT NOT NULL FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
    make                    NVARCHAR(50) NOT NULL,
    model                   NVARCHAR(50) NOT NULL,
    year                    INT NOT NULL,
    color                   NVARCHAR(30) NOT NULL,
    license_plate           NVARCHAR(20) NOT NULL UNIQUE,
    vehicle_type            VARCHAR(20) NOT NULL,               -- 'TUK', 'CAR', 'VAN', 'BIKE'
    capacity                INT NOT NULL,
    is_active               BIT NOT NULL DEFAULT 1
);
CREATE INDEX idx_vehicles_driver ON vehicles(driver_id);
GO

-- ════════════════════════════════════════════════════════════════════════════════
-- 5. Driver Documents Table
-- ════════════════════════════════════════════════════════════════════════════════
CREATE TABLE driver_documents (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    driver_id               BIGINT NOT NULL FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
    document_type           VARCHAR(50) NOT NULL,               -- 'DRIVING_LICENSE', 'REVENUE_LICENSE', 'VEHICLE_INSURANCE', 'NIC_FRONT', 'NIC_BACK'
    file_path               NVARCHAR(500) NOT NULL,
    status                  VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'VERIFIED', 'REJECTED'
    rejection_reason        NVARCHAR(500) NULL,
    uploaded_at             DATETIME2 NOT NULL DEFAULT GETDATE(),
    verified_at             DATETIME2 NULL,
    verified_by             BIGINT NULL FOREIGN KEY REFERENCES users(id)
);
CREATE INDEX idx_driver_docs_driver ON driver_documents(driver_id);
GO

-- ════════════════════════════════════════════════════════════════════════════════
-- 6. Trips Table
-- ════════════════════════════════════════════════════════════════════════════════
CREATE TABLE trips (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    passenger_id            BIGINT NOT NULL FOREIGN KEY REFERENCES users(id),
    driver_id               BIGINT NULL FOREIGN KEY REFERENCES users(id),
    vehicle_id              BIGINT NULL FOREIGN KEY REFERENCES vehicles(id),
    pickup_address          NVARCHAR(255) NOT NULL,
    pickup_lat              FLOAT NOT NULL,
    pickup_lng              FLOAT NOT NULL,
    dropoff_address         NVARCHAR(255) NOT NULL,
    dropoff_lat             FLOAT NOT NULL,
    dropoff_lng             FLOAT NOT NULL,
    distance_km             DECIMAL(6,2) NOT NULL,
    ride_type               VARCHAR(20) NOT NULL,               -- 'TUK', 'CAR', 'VAN', 'BIKE'
    base_fare               DECIMAL(10,2) NOT NULL,
    per_km_rate             DECIMAL(10,2) NOT NULL,
    platform_fee            DECIMAL(10,2) NOT NULL,
    total_fare              DECIMAL(10,2) NOT NULL,
    platform_commission     DECIMAL(10,2) NOT NULL,             -- 15% platform commission
    driver_net              DECIMAL(10,2) NOT NULL,             -- 85% driver earnings
    status                  VARCHAR(30) NOT NULL,               -- 'REQUESTED', 'ACCEPTED', 'DRIVER_ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
    payment_method          VARCHAR(20) NOT NULL,               -- 'CASH', 'CARD', 'WALLET'
    is_paid                 BIT NOT NULL DEFAULT 0,
    cancellation_reason     NVARCHAR(500) NULL,
    cancelled_by            VARCHAR(20) NULL,
    created_at              DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at              DATETIME2 NOT NULL DEFAULT GETDATE(),
    completed_at            DATETIME2 NULL
);
CREATE INDEX idx_trips_passenger ON trips(passenger_id);
CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_created ON trips(created_at);
GO

-- ════════════════════════════════════════════════════════════════════════════════
-- 7. Payments Table
-- ════════════════════════════════════════════════════════════════════════════════
CREATE TABLE payments (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    trip_id                 BIGINT NOT NULL FOREIGN KEY REFERENCES trips(id),
    passenger_id            BIGINT NOT NULL FOREIGN KEY REFERENCES users(id),
    driver_id               BIGINT NULL FOREIGN KEY REFERENCES users(id),
    gross_amount            DECIMAL(10,2) NOT NULL,
    platform_commission     DECIMAL(10,2) NOT NULL,
    driver_net              DECIMAL(10,2) NOT NULL,
    payment_method          VARCHAR(20) NOT NULL,               -- 'CASH', 'CARD', 'WALLET'
    status                  VARCHAR(30) NOT NULL,               -- 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'
    transaction_ref         NVARCHAR(100) NULL,
    retry_count             INT NOT NULL DEFAULT 0,
    processed_at            DATETIME2 NULL,
    created_at              DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_payments_trip ON payments(trip_id);
CREATE INDEX idx_payments_status ON payments(status);
GO

-- ════════════════════════════════════════════════════════════════════════════════
-- 8. Reviews Table
-- ════════════════════════════════════════════════════════════════════════════════
CREATE TABLE reviews (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    trip_id                 BIGINT NOT NULL FOREIGN KEY REFERENCES trips(id),
    passenger_id            BIGINT NOT NULL FOREIGN KEY REFERENCES users(id),
    driver_id               BIGINT NOT NULL FOREIGN KEY REFERENCES users(id),
    rating                  INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment                 NVARCHAR(1000) NULL,
    created_at              DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_reviews_driver ON reviews(driver_id);
CREATE INDEX idx_reviews_trip ON reviews(trip_id);
GO

-- ════════════════════════════════════════════════════════════════════════════════
-- 9. Dispute Tickets Table
-- ════════════════════════════════════════════════════════════════════════════════
CREATE TABLE dispute_tickets (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    trip_id                 BIGINT NULL FOREIGN KEY REFERENCES trips(id),
    reported_by_id          BIGINT NOT NULL FOREIGN KEY REFERENCES users(id),
    category                VARCHAR(50) NOT NULL,               -- 'OVERCHARGED', 'DRIVER_BEHAVIOR', 'LOST_ITEM', 'VEHICLE_CONDITION', 'CANCELLATION_FEE'
    description             NVARCHAR(1000) NOT NULL,
    status                  VARCHAR(30) NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'REJECTED'
    resolution_notes        NVARCHAR(1000) NULL,
    refund_amount           DECIMAL(10,2) NULL,
    resolved_by_id          BIGINT NULL FOREIGN KEY REFERENCES users(id),
    created_at              DATETIME2 NOT NULL DEFAULT GETDATE(),
    resolved_at             DATETIME2 NULL
);
CREATE INDEX idx_disputes_status ON dispute_tickets(status);
GO

-- ════════════════════════════════════════════════════════════════════════════════
-- 10. Audit Logs Table
-- ════════════════════════════════════════════════════════════════════════════════
CREATE TABLE audit_logs (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    action                  NVARCHAR(100) NOT NULL,
    entity_type             NVARCHAR(50) NOT NULL,
    entity_id               BIGINT NULL,
    performed_by_id         BIGINT NULL FOREIGN KEY REFERENCES users(id),
    details                 NVARCHAR(MAX) NULL,
    ip_address              NVARCHAR(50) NULL,
    timestamp               DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
GO

PRINT '===================================================================';
PRINT '✅ Streetify MSSQL Schema Created Successfully with All Constraints!';
PRINT '===================================================================';
