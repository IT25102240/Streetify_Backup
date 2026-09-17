-- ════════════════════════════════════════════════════════════════════════════════
-- 🚦 STREETIFY TEST DATA SEED SCRIPT (MSSQL)
-- Run this script in your MSSQL Server to populate the admin dashboard!
-- ════════════════════════════════════════════════════════════════════════════════

-- 0. Clear existing dummy data to prevent duplicate key errors
SET QUOTED_IDENTIFIER ON;
DELETE FROM reviews;
DELETE FROM payments;
DELETE FROM trips;
DELETE FROM users;

-- 1. Insert Dummy Admins (Password for all: admin123)
-- BCrypt hash for admin123: $2a$10$56.JCXgXdfdKH7ZCidwXB.is7VBKrxmtHdO7v7bXa631qUqtYSI06
INSERT INTO users (dtype, active, suspended, email, first_name, last_name, password_hash, role, admin_role, created_at, updated_at)
VALUES 
('USER', 1, 0, 'admin@streetify.lk', 'Vidura', 'Super', '$2a$10$56.JCXgXdfdKH7ZCidwXB.is7VBKrxmtHdO7v7bXa631qUqtYSI06', 'ADMIN', 'SUPER_ADMIN', GETDATE(), GETDATE()),
('USER', 1, 0, 'user_mgmt@streetify.lk', 'Lahiru', 'Admin', '$2a$10$56.JCXgXdfdKH7ZCidwXB.is7VBKrxmtHdO7v7bXa631qUqtYSI06', 'ADMIN', 'USER_MGMT', GETDATE(), GETDATE()),
('USER', 1, 0, 'booking_mgmt@streetify.lk', 'Chanuka', 'Admin', '$2a$10$56.JCXgXdfdKH7ZCidwXB.is7VBKrxmtHdO7v7bXa631qUqtYSI06', 'ADMIN', 'BOOKING_MGMT', GETDATE(), GETDATE()),
('USER', 1, 0, 'driver_mgmt@streetify.lk', 'Tharindu', 'Admin', '$2a$10$56.JCXgXdfdKH7ZCidwXB.is7VBKrxmtHdO7v7bXa631qUqtYSI06', 'ADMIN', 'DRIVER_MGMT', GETDATE(), GETDATE()),
('USER', 1, 0, 'payment_mgmt@streetify.lk', 'Daham', 'Admin', '$2a$10$56.JCXgXdfdKH7ZCidwXB.is7VBKrxmtHdO7v7bXa631qUqtYSI06', 'ADMIN', 'PAYMENT_MGMT', GETDATE(), GETDATE()),
('USER', 1, 0, 'review_mgmt@streetify.lk', 'Mithun', 'Admin', '$2a$10$56.JCXgXdfdKH7ZCidwXB.is7VBKrxmtHdO7v7bXa631qUqtYSI06', 'ADMIN', 'REVIEW_MGMT', GETDATE(), GETDATE());

-- 2. Insert Dummy Users (Passengers)
INSERT INTO users (dtype, active, suspended, email, first_name, last_name, password_hash, phone, role, created_at, updated_at, wallet_balance, is_online)
VALUES 
('PASSENGER', 1, 0, 'passenger1@test.com', 'John', 'Doe', 'hashedpass', '+94771111111', 'PASSENGER', GETDATE(), GETDATE(), 5000.0, 0),
('PASSENGER', 1, 0, 'passenger2@test.com', 'Jane', 'Smith', 'hashedpass', '+94772222222', 'PASSENGER', GETDATE(), GETDATE(), 150.0, 1);

-- 3. Insert Dummy Users (Drivers)
INSERT INTO users (dtype, active, suspended, email, first_name, last_name, password_hash, phone, role, created_at, updated_at, wallet_balance, average_rating, license_number, nic, total_trips, verification_status, is_online)
VALUES 
('DRIVER', 1, 0, 'driver1@test.com', 'Kamal', 'Perera', 'hashedpass', '+94773333333', 'DRIVER', GETDATE(), GETDATE(), 2000.0, 4.8, 'B1234567', '901234567V', 125, 'APPROVED', 1),
('DRIVER', 1, 0, 'driver2@test.com', 'Nimal', 'Silva', 'hashedpass', '+94774444444', 'DRIVER', GETDATE(), GETDATE(), 500.0, 4.2, 'B9876543', '851234567V', 32, 'PENDING_VERIFICATION', 0);

-- Get IDs of inserted users to use in foreign keys
DECLARE @Pass1 BIGINT = (SELECT TOP 1 id FROM users WHERE email = 'passenger1@test.com');
DECLARE @Pass2 BIGINT = (SELECT TOP 1 id FROM users WHERE email = 'passenger2@test.com');
DECLARE @Driver1 BIGINT = (SELECT TOP 1 id FROM users WHERE email = 'driver1@test.com');
DECLARE @Driver2 BIGINT = (SELECT TOP 1 id FROM users WHERE email = 'driver2@test.com');

-- 4. Insert Dummy Trips
INSERT INTO trips (passenger_id, driver_id, pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng, distance_km, ride_type, base_fare, per_km_rate, platform_fee, total_fare, platform_commission, driver_net, status, payment_method, is_paid, created_at, updated_at)
VALUES 
(@Pass1, @Driver1, 'Colombo 03', 6.9271, 79.8612, 'Nugegoda', 6.8649, 79.8997, 8.5, 'CAR', 300.0, 150.0, 4.0, 1575.0, 157.5, 1417.5, 'COMPLETED', 'CASH', 1, GETDATE(), GETDATE()),
(@Pass2, @Driver1, 'Malabe (SLIIT)', 6.9147, 79.9729, 'Kottawa', 6.8415, 79.9654, 12.0, 'TUK', 150.0, 80.0, 4.0, 1110.0, 111.0, 999.0, 'COMPLETED', 'CARD', 1, GETDATE(), GETDATE()),
(@Pass1, NULL, 'Mount Lavinia', 6.8301, 79.8639, 'Dehiwala', 6.8480, 79.8732, 2.5, 'BIKE', 100.0, 50.0, 4.0, 225.0, 0.0, 0.0, 'REQUESTED', 'CASH', 0, GETDATE(), GETDATE());

-- Get IDs of inserted trips
DECLARE @Trip1 BIGINT = (SELECT TOP 1 id FROM trips WHERE dropoff_address = 'Nugegoda');
DECLARE @Trip2 BIGINT = (SELECT TOP 1 id FROM trips WHERE dropoff_address = 'Kottawa');

-- 5. Insert Dummy Payments
INSERT INTO payments (trip_id, passenger_id, driver_id, gross_amount, platform_commission, driver_net, payment_method, status, processed_at, created_at, retry_count)
VALUES 
(@Trip1, @Pass1, @Driver1, 1575.0, 157.5, 1417.5, 'CASH', 'SUCCESS', GETDATE(), GETDATE(), 0),
(@Trip2, @Pass2, @Driver1, 1110.0, 111.0, 999.0, 'CARD', 'SUCCESS', GETDATE(), GETDATE(), 0);

-- 6. Insert Dummy Reviews
INSERT INTO reviews (trip_id, passenger_id, driver_id, rating, comment, created_at)
VALUES 
(@Trip1, @Pass1, @Driver1, 5, 'Great driver, very fast!', GETDATE()),
(@Trip2, @Pass2, @Driver1, 4, 'Good ride, AC was a bit slow.', GETDATE());

PRINT '✅ Dummy Data Seeded Successfully!';
