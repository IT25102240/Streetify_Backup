-- ════════════════════════════════════════════════════════════════════════════════
-- 🚦 STREETIFY MASTER TEST DATA SEED SCRIPT (MSSQL)
-- Populates the database with realistic sample data for all 6 team modules
--
-- Passwords:
--   • All Admins:  'admin123'  (or '1111' for admin@streetify.com)
--   • All Users:   '1111'      (or 'admin123')
-- ════════════════════════════════════════════════════════════════════════════════

USE streetify_db;
GO

SET QUOTED_IDENTIFIER ON;

-- 0. Clean slate to prevent duplicate key or foreign key violations
DELETE FROM audit_logs;
DELETE FROM dispute_tickets;
DELETE FROM reviews;
DELETE FROM payments;
DELETE FROM trips;
DELETE FROM driver_documents;
DELETE FROM vehicles;
DELETE FROM users;
GO

-- ════════════════════════════════════════════════════════════════════════════════
-- 1. Insert Team Admins & Platform Governance
-- BCrypt for 'admin123': $2a$10$56.JCXgXdfdKH7ZCidwXB.is7VBKrxmtHdO7v7bXa631qUqtYSI06
-- BCrypt for '1111':     $2a$10$cbbzAnogt7aHXIkFuSH/MezEMCiOfZuxH2Q4pDbRv8nUVfe.MJY8m
-- ════════════════════════════════════════════════════════════════════════════════
INSERT INTO users (dtype, active, suspended, email, first_name, last_name, password_hash, phone, role, admin_role, created_at, updated_at)
VALUES 
('USER', 1, 0, 'admin@streetify.com',   'System',   'Admin',            '$2a$10$cbbzAnogt7aHXIkFuSH/MezEMCiOfZuxH2Q4pDbRv8nUVfe.MJY8m', '0112000000', 'ADMIN', 'SUPER_ADMIN',  GETDATE(), GETDATE()),
('USER', 1, 0, 'vidura@streetify.lk',    'Vidura',   'Rammandalagedara', '$2a$10$56.JCXgXdfdKH7ZCidwXB.is7VBKrxmtHdO7v7bXa631qUqtYSI06', '0711000001', 'ADMIN', 'SUPER_ADMIN',  GETDATE(), GETDATE()),
('USER', 1, 0, 'lahiru@streetify.lk',    'Lahiru',   'Nayanamina',       '$2a$10$56.JCXgXdfdKH7ZCidwXB.is7VBKrxmtHdO7v7bXa631qUqtYSI06', '0711000002', 'ADMIN', 'USER_MGMT',    GETDATE(), GETDATE()),
('USER', 1, 0, 'chanuka@streetify.lk',   'Chanuka',  'Dharmakeerthi',    '$2a$10$56.JCXgXdfdKH7ZCidwXB.is7VBKrxmtHdO7v7bXa631qUqtYSI06', '0711000003', 'ADMIN', 'BOOKING_MGMT', GETDATE(), GETDATE()),
('USER', 1, 0, 'tharindu@streetify.lk',  'Tharindu', 'Senaka',           '$2a$10$56.JCXgXdfdKH7ZCidwXB.is7VBKrxmtHdO7v7bXa631qUqtYSI06', '0711000004', 'ADMIN', 'DRIVER_MGMT',  GETDATE(), GETDATE()),
('USER', 1, 0, 'daham@streetify.lk',     'Daham',    'Edirisinghe',      '$2a$10$56.JCXgXdfdKH7ZCidwXB.is7VBKrxmtHdO7v7bXa631qUqtYSI06', '0711000005', 'ADMIN', 'PAYMENT_MGMT', GETDATE(), GETDATE()),
('USER', 1, 0, 'mithun@streetify.lk',    'Mithun',   'Weerasingha',      '$2a$10$56.JCXgXdfdKH7ZCidwXB.is7VBKrxmtHdO7v7bXa631qUqtYSI06', '0711000006', 'ADMIN', 'REVIEW_MGMT',  GETDATE(), GETDATE());
GO

-- ════════════════════════════════════════════════════════════════════════════════
-- 2. Insert Dummy Passengers
-- ════════════════════════════════════════════════════════════════════════════════
INSERT INTO users (dtype, active, suspended, email, first_name, last_name, password_hash, phone, role, wallet_balance, preferred_payment_method, created_at, updated_at)
VALUES 
('PASSENGER', 1, 0, 'passenger1@streetify.com', 'Lahiru', 'Peris',    '$2a$10$cbbzAnogt7aHXIkFuSH/MezEMCiOfZuxH2Q4pDbRv8nUVfe.MJY8m', '+94771111111', 'PASSENGER', 5000.00, 'WALLET', GETDATE(), GETDATE()),
('PASSENGER', 1, 0, 'passenger2@streetify.com', 'Gihan',  'Devis',    '$2a$10$cbbzAnogt7aHXIkFuSH/MezEMCiOfZuxH2Q4pDbRv8nUVfe.MJY8m', '+94772222222', 'PASSENGER', 1500.00, 'CARD',   GETDATE(), GETDATE()),
('PASSENGER', 1, 0, 'kasun@streetify.com',      'Kasun', 'Fernando', '$2a$10$cbbzAnogt7aHXIkFuSH/MezEMCiOfZuxH2Q4pDbRv8nUVfe.MJY8m', '+94773333333', 'PASSENGER', 250.00,  'CASH',   GETDATE(), GETDATE());
GO

-- ════════════════════════════════════════════════════════════════════════════════
-- 3. Insert Dummy Drivers
-- ════════════════════════════════════════════════════════════════════════════════
INSERT INTO users (dtype, active, suspended, email, first_name, last_name, password_hash, phone, role, wallet_balance, average_rating, license_number, nic, total_trips, commission_debt, verification_status, is_online, current_lat, current_lng, created_at, updated_at)
VALUES 
('DRIVER', 1, 0, 'driver1@streetify.com', 'Kamal',  'Perera',  '$2a$10$cbbzAnogt7aHXIkFuSH/MezEMCiOfZuxH2Q4pDbRv8nUVfe.MJY8m', '+94774444444', 'DRIVER', 8500.00, 4.9, 'B1234567', '901234567V', 142, 0.00, 'APPROVED',             1, 6.9271, 79.8612, GETDATE(), GETDATE()),
('DRIVER', 1, 0, 'driver2@streetify.com', 'Nimal',  'Silva',   '$2a$10$cbbzAnogt7aHXIkFuSH/MezEMCiOfZuxH2Q4pDbRv8nUVfe.MJY8m', '+94775555555', 'DRIVER', 3200.00, 4.4, 'B9876543', '851234567V', 48,  450.00, 'APPROVED',             1, 6.8649, 79.8997, GETDATE(), GETDATE()),
('DRIVER', 1, 0, 'driver3@streetify.com', 'Sunil',  'Shantha', '$2a$10$cbbzAnogt7aHXIkFuSH/MezEMCiOfZuxH2Q4pDbRv8nUVfe.MJY8m', '+94776666666', 'DRIVER', 0.00,    5.0, 'B5554321', '981234567V', 0,   0.00, 'PENDING_VERIFICATION', 0, 6.9147, 79.9729, GETDATE(), GETDATE());
GO

-- ════════════════════════════════════════════════════════════════════════════════
-- 4. Insert Vehicles for Drivers
-- ════════════════════════════════════════════════════════════════════════════════
DECLARE @Driver1_Id BIGINT = (SELECT TOP 1 id FROM users WHERE email = 'driver1@streetify.com');
DECLARE @Driver2_Id BIGINT = (SELECT TOP 1 id FROM users WHERE email = 'driver2@streetify.com');
DECLARE @Driver3_Id BIGINT = (SELECT TOP 1 id FROM users WHERE email = 'driver3@streetify.com');

INSERT INTO vehicles (driver_id, make, model, year_of_manufacture, color, number_plate, vehicle_type, created_at)
VALUES
(@Driver1_Id, 'Toyota', 'Prius', 2018, 'Pearl White', 'WP CAB-1234', 'CAR', GETDATE()),
(@Driver2_Id, 'Bajaj',  'RE 4S', 2021, 'Black/Yellow', 'WP ABF-5678', 'TUK', GETDATE()),
(@Driver3_Id, 'Nissan', 'Caravan', 2019, 'Silver',     'WP ND-9012',  'VAN', GETDATE());
GO

-- ════════════════════════════════════════════════════════════════════════════════
-- 5. Insert Sample Trips (Completed, In-Progress, Requested)
-- ════════════════════════════════════════════════════════════════════════════════
DECLARE @Pass1_Id BIGINT = (SELECT TOP 1 id FROM users WHERE email = 'passenger1@streetify.com');
DECLARE @Pass2_Id BIGINT = (SELECT TOP 1 id FROM users WHERE email = 'passenger2@streetify.com');
DECLARE @Pass3_Id BIGINT = (SELECT TOP 1 id FROM users WHERE email = 'kasun@streetify.com');
DECLARE @D1_Id    BIGINT = (SELECT TOP 1 id FROM users WHERE email = 'driver1@streetify.com');
DECLARE @D2_Id    BIGINT = (SELECT TOP 1 id FROM users WHERE email = 'driver2@streetify.com');

INSERT INTO trips (passenger_id, driver_id, pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng, distance_km, ride_type, base_fare, per_km_rate, platform_fee, total_fare, platform_commission, driver_net, status, payment_method, is_paid, created_at, updated_at, completed_at)
VALUES
-- Trip 1: Completed Car Trip
(@Pass1_Id, @D1_Id, 'Colombo Fort', 6.9344, 79.8428, 'Nugegoda Junction', 6.8649, 79.8997, 10.5, 'CAR', 300.00, 150.00, 50.00, 1925.00, 288.75, 1636.25, 'COMPLETED', 'CARD', 1, DATEADD(hour, -3, GETDATE()), DATEADD(hour, -2, GETDATE()), DATEADD(hour, -2, GETDATE())),

-- Trip 2: Completed Tuk Trip
(@Pass2_Id, @D2_Id, 'SLIIT Malabe', 6.9147, 79.9729, 'Kottawa Bus Stand', 6.8415, 79.9654, 11.2, 'TUK', 150.00, 80.00,  30.00, 1076.00, 161.40, 914.60,  'COMPLETED', 'WALLET', 1, DATEADD(hour, -1, GETDATE()), GETDATE(), GETDATE()),

-- Trip 3: Active Ongoing Trip
(@Pass3_Id, @D1_Id, 'Bambalapitiya', 6.8938, 79.8558, 'Dehiwala Zoo', 6.8573, 79.8732, 5.0,  'CAR', 300.00, 150.00, 50.00, 1100.00, 165.00, 935.00,  'IN_PROGRESS', 'CASH', 0, DATEADD(minute, -15, GETDATE()), GETDATE(), NULL),

-- Trip 4: Requested Trip Waiting for Driver
(@Pass1_Id, NULL, 'Mount Lavinia Hotel', 6.8301, 79.8639, 'Galle Face Green', 6.9271, 79.8428, 12.0, 'CAR', 300.00, 150.00, 50.00, 2150.00, 322.50, 1827.50, 'REQUESTED', 'CARD', 0, GETDATE(), GETDATE(), NULL);
GO

-- ════════════════════════════════════════════════════════════════════════════════
-- 6. Insert Payments
-- ════════════════════════════════════════════════════════════════════════════════
DECLARE @Trip1_Id BIGINT = (SELECT TOP 1 id FROM trips WHERE dropoff_address = 'Nugegoda Junction');
DECLARE @Trip2_Id BIGINT = (SELECT TOP 1 id FROM trips WHERE dropoff_address = 'Kottawa Bus Stand');
DECLARE @P1_Id BIGINT = (SELECT TOP 1 passenger_id FROM trips WHERE id = @Trip1_Id);
DECLARE @P2_Id BIGINT = (SELECT TOP 1 passenger_id FROM trips WHERE id = @Trip2_Id);
DECLARE @Dr1_Id BIGINT = (SELECT TOP 1 driver_id FROM trips WHERE id = @Trip1_Id);
DECLARE @Dr2_Id BIGINT = (SELECT TOP 1 driver_id FROM trips WHERE id = @Trip2_Id);

INSERT INTO payments (trip_id, passenger_id, driver_id, gross_amount, platform_commission, driver_net, payment_method, status, transaction_ref, retry_count, processed_at, created_at)
VALUES
(@Trip1_Id, @P1_Id, @Dr1_Id, 1925.00, 288.75, 1636.25, 'CARD',   'SUCCESS', 'TXN_CARD_894312', 0, DATEADD(hour, -2, GETDATE()), DATEADD(hour, -2, GETDATE())),
(@Trip2_Id, @P2_Id, @Dr2_Id, 1076.00, 161.40, 914.60,  'WALLET', 'SUCCESS', 'TXN_WLT_110294',  0, GETDATE(), GETDATE());
GO

-- ════════════════════════════════════════════════════════════════════════════════
-- 7. Insert Reviews & Ratings
-- ════════════════════════════════════════════════════════════════════════════════
DECLARE @T1_Id BIGINT = (SELECT TOP 1 id FROM trips WHERE dropoff_address = 'Nugegoda Junction');
DECLARE @T2_Id BIGINT = (SELECT TOP 1 id FROM trips WHERE dropoff_address = 'Kottawa Bus Stand');
DECLARE @Pass1 BIGINT = (SELECT TOP 1 passenger_id FROM trips WHERE id = @T1_Id);
DECLARE @Pass2 BIGINT = (SELECT TOP 1 passenger_id FROM trips WHERE id = @T2_Id);
DECLARE @Driv1 BIGINT = (SELECT TOP 1 driver_id FROM trips WHERE id = @T1_Id);
DECLARE @Driv2 BIGINT = (SELECT TOP 1 driver_id FROM trips WHERE id = @T2_Id);

INSERT INTO reviews (trip_id, passenger_id, driver_id, rating, comment, created_at)
VALUES
(@T1_Id, @Pass1, @Driv1, 5, 'Super clean car, friendly driver and arrived right on time!', DATEADD(hour, -2, GETDATE())),
(@T2_Id, @Pass2, @Driv2, 4, 'Quick tuk ride, navigated through Kottawa traffic nicely.', GETDATE());
GO

-- ════════════════════════════════════════════════════════════════════════════════
-- 8. Insert Dispute Ticket & Audit Log Sample
-- ════════════════════════════════════════════════════════════════════════════════
DECLARE @DisputeTrip_Id BIGINT = (SELECT TOP 1 id FROM trips WHERE dropoff_address = 'Kottawa Bus Stand');
DECLARE @DisputeUser_Id BIGINT = (SELECT TOP 1 passenger_id FROM trips WHERE id = @DisputeTrip_Id);
DECLARE @Admin_Id       BIGINT = (SELECT TOP 1 id FROM users WHERE email = 'admin@streetify.com');

INSERT INTO dispute_tickets (passenger_id, trip_id, subject, description, dispute_type, requested_refund_amount, status, resolution_note, approved_refund_amount, resolved_by_staff_id, created_at, resolved_at)
VALUES
(@DisputeUser_Id, @DisputeTrip_Id, 'Overcharged Fare', 'Driver took a longer scenic route near Malabe.', 'OVERCHARGED', 100.00, 'RESOLVED', 'Refunded 100 LKR wallet credit to passenger.', 100.00, @Admin_Id, DATEADD(day, -1, GETDATE()), GETDATE());

INSERT INTO audit_logs (performed_by_staff_id, performed_by_email, action_type, description, target_user_id, target_entity_type, target_entity_id, created_at)
VALUES
(@Admin_Id, 'admin@streetify.com', 'ADMIN_LOGIN', 'Super Admin logged in successfully.', @Admin_Id, 'USER', @Admin_Id, GETDATE()),
(@Admin_Id, 'admin@streetify.com', 'DISPUTE_RESOLVED', 'Approved partial refund of 100 LKR.', @DisputeUser_Id, 'DISPUTE_TICKET', 1, GETDATE());
GO

PRINT '===================================================================';
PRINT '✅ Streetify Master Test Data Seeded Successfully!';
PRINT '===================================================================';
