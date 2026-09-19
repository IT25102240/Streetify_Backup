CREATE DATABASE streetify_db;

--lahiru 
SELECT * FROM users;

--Chanuka 
SELECT id, status, pickup_address, dropoff_address, 
       distance_km, total_fare, payment_method, created_at 
FROM trips ORDER BY id DESC;

--Tharindu 
SELECT * FROM trips;
--1
SELECT 
    id, 
    first_name, 
    last_name, 
    email, 
    phone, 
    active, 
    verification_status
FROM users 
WHERE dtype = 'DRIVER';

--2
SELECT 
    id AS trip_id, 
    status, 
    driver_id, 
    passenger_id, 
    pickup_address, 
    dropoff_address, 
    created_at
FROM trips
ORDER BY created_at DESC;

--3
SELECT 
    id AS driver_id, 
    first_name, 
    last_name, 
    email, 
    nic, 
    license_number, 
    verification_status
FROM users 
WHERE dtype = 'DRIVER' 
  AND verification_status = 'PENDING_VERIFICATION';



--Daham 

SELECT p.id, p.gross_amount, p.platform_commission, p.driver_net, 
       p.payment_method, p.status, p.processed_at
FROM payments p ORDER BY p.id DESC;

--Mithun

-- 1. Check the reviews table (This works perfectly!)
SELECT r.id, r.rating, r.comment, r.driver_id, r.passenger_id, r.created_at 
FROM reviews r ORDER BY r.id DESC;

-- 2. Check the driver's updated average rating (Corrected for Single-Table Inheritance)
SELECT u.id, u.first_name, u.last_name, u.average_rating, u.total_trips 
FROM users u 
WHERE u.dtype = 'DRIVER' 
ORDER BY u.id DESC;


--Vidura

-- Total users by role
SELECT role, COUNT(*) AS total FROM users GROUP BY role;

-- Total trips by status
SELECT status, COUNT(*) AS count FROM trips GROUP BY status;

-- Today's platform revenue
SELECT SUM(platform_commission) AS today_revenue 
FROM trips 
WHERE status = 'COMPLETED'
  AND CAST(completed_at AS DATE) = CAST(GETDATE() AS DATE);



