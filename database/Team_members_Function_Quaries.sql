--DB initialization

USE streetify_db;
GO


--Lahiru

-- View all users in the system (Passengers, Drivers, Admins)
SELECT * FROM users;

--Chanuka

-- View trip summaries (Addresses, Distance, Fare, and Payment Method)
SELECT 
    id, 
    status, 
    pickup_address, 
    dropoff_address, 
    distance_km, 
    total_fare, 
    payment_method, 
    created_at 
FROM trips 
ORDER BY id DESC;


--Tharindu

-- View all raw trip data
SELECT * FROM trips;

-- 1. View all approved driver profiles
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

-- 2. View all driver trips and assignments
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

-- 3. View drivers pending document verification
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

  -- View all payment records, commissions, and driver earnings
SELECT 
    p.id, 
    p.gross_amount, 
    p.platform_commission, 
    p.driver_net, 
    p.payment_method, 
    p.status, 
    p.processed_at
FROM payments p 
ORDER BY p.id DESC;


--Mithun

-- 1. Check all submitted reviews and comments
SELECT 
    r.id, 
    r.rating, 
    r.comment, 
    r.driver_id, 
    r.passenger_id, 
    r.created_at 
FROM reviews r 
ORDER BY r.id DESC;

-- 2. Check the driver's updated average rating & total trips taken
SELECT 
    u.id, 
    u.first_name, 
    u.last_name, 
    u.average_rating, 
    u.total_trips 
FROM users u 
WHERE u.dtype = 'DRIVER' 
ORDER BY u.id DESC;


--Vidura

-- 1. Total users grouped by their role
SELECT 
    role, 
    COUNT(*) AS total_users 
FROM users 
GROUP BY role;

-- 2. Total trips grouped by their current status
SELECT 
    status, 
    COUNT(*) AS total_trips 
FROM trips 
GROUP BY status;

-- 3. Today's total platform revenue (Commission from completed trips)
SELECT 
    SUM(platform_commission) AS today_revenue 
FROM trips 
WHERE status = 'COMPLETED'
  AND CAST(completed_at AS DATE) = CAST(GETDATE() AS DATE);
