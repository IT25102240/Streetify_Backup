-- ════════════════════════════════════════════════════════════════════════════════
-- 👥 STREETIFY TEAM MODULE VERIFICATION QUERIES (MSSQL)
-- Individual SQL queries grouped by team member responsibilities for viva/evaluations
-- ════════════════════════════════════════════════════════════════════════════════

USE streetify_db;
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. 👤 LAHIRU — USER MANAGEMENT MODULE
-- ─────────────────────────────────────────────────────────────────────────────

-- 1.1 View all registered users in the platform (Admins, Passengers, Drivers)
SELECT 
    id, 
    dtype, 
    first_name + ' ' + last_name AS full_name, 
    email, 
    phone, 
    role, 
    admin_role, 
    active, 
    suspended, 
    wallet_balance, 
    created_at
FROM users
ORDER BY id ASC;

-- 1.2 View all Passengers with their preferred payment methods and wallet balances
SELECT 
    id AS passenger_id, 
    first_name + ' ' + last_name AS passenger_name, 
    email, 
    phone, 
    wallet_balance, 
    preferred_payment_method, 
    created_at
FROM users
WHERE dtype = 'PASSENGER'
ORDER BY wallet_balance DESC;

-- 1.3 Check for any suspended or banned user accounts
SELECT 
    id, 
    email, 
    role, 
    suspended, 
    suspension_reason, 
    suspended_until
FROM users
WHERE suspended = 1;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. 🚖 CHANUKA — BOOKING & TRIP MANAGEMENT MODULE
-- ─────────────────────────────────────────────────────────────────────────────

-- 2.1 View all trip requests and their current statuses
SELECT 
    t.id AS trip_id, 
    t.status, 
    t.ride_type,
    p.first_name + ' ' + p.last_name AS passenger_name,
    ISNULL(d.first_name + ' ' + d.last_name, 'NOT_ASSIGNED') AS driver_name,
    t.pickup_address, 
    t.dropoff_address, 
    t.distance_km, 
    t.total_fare, 
    t.payment_method, 
    t.is_paid, 
    t.created_at
FROM trips t
INNER JOIN users p ON t.passenger_id = p.id
LEFT JOIN users d ON t.driver_id = d.id
ORDER BY t.id DESC;

-- 2.2 Filter active ongoing trips that require live tracking
SELECT 
    id AS trip_id, 
    pickup_address, 
    dropoff_address, 
    pickup_lat, 
    pickup_lng, 
    dropoff_lat, 
    dropoff_lng, 
    status, 
    created_at
FROM trips
WHERE status IN ('REQUESTED', 'ACCEPTED', 'DRIVER_ARRIVED', 'IN_PROGRESS');

-- 2.3 Trip summary breakdown by ride type (Tuk, Car, Van, Bike)
SELECT 
    ride_type, 
    COUNT(*) AS total_trips, 
    AVG(distance_km) AS avg_distance_km, 
    SUM(total_fare) AS total_revenue
FROM trips
GROUP BY ride_type;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. 🚗 THARINDU — DRIVER MANAGEMENT & VERIFICATION MODULE
-- ─────────────────────────────────────────────────────────────────────────────

-- 3.1 View all approved & active driver profiles with ratings
SELECT 
    u.id AS driver_id, 
    u.first_name + ' ' + u.last_name AS driver_name, 
    u.email, 
    u.phone, 
    u.nic, 
    u.license_number, 
    u.verification_status, 
    u.average_rating, 
    u.total_trips, 
    u.is_online,
    v.make + ' ' + v.model + ' (' + v.number_plate + ')' AS assigned_vehicle
FROM users u
LEFT JOIN vehicles v ON v.driver_id = u.id
WHERE u.dtype = 'DRIVER' AND u.verification_status = 'APPROVED';

-- 3.2 View drivers waiting for document verification (Review Queue)
SELECT 
    id AS driver_id, 
    first_name + ' ' + last_name AS driver_name, 
    email, 
    phone, 
    nic, 
    license_number, 
    verification_status, 
    created_at
FROM users
WHERE dtype = 'DRIVER' AND verification_status = 'PENDING_VERIFICATION';

-- 3.3 Inspect uploaded driver verification documents
SELECT 
    d.id AS doc_id, 
    u.first_name + ' ' + u.last_name AS driver_name, 
    d.doc_type, 
    d.file_path, 
    d.status, 
    d.reviewer_note, 
    d.uploaded_at
FROM driver_documents d
INNER JOIN users u ON d.driver_id = u.id
ORDER BY d.uploaded_at DESC;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. 💳 DAHAM — PAYMENT & FINANCIAL SETTLEMENT MODULE
-- ─────────────────────────────────────────────────────────────────────────────

-- 4.1 View full payment transaction ledger with 15% commission breakdown
SELECT 
    p.id AS payment_id, 
    p.trip_id, 
    pass.first_name + ' ' + pass.last_name AS passenger,
    drv.first_name + ' ' + drv.last_name AS driver,
    p.gross_amount AS trip_fare, 
    p.platform_commission AS commission_15_pct, 
    p.driver_net AS driver_payout_85_pct, 
    p.payment_method, 
    p.status, 
    p.transaction_ref, 
    p.processed_at
FROM payments p
INNER JOIN users pass ON p.passenger_id = pass.id
LEFT JOIN users drv ON p.driver_id = drv.id
ORDER BY p.id DESC;

-- 4.2 Total company commission collected vs total paid out to drivers
SELECT 
    COUNT(*) AS total_settled_payments, 
    SUM(gross_amount) AS total_gross_fare, 
    SUM(platform_commission) AS total_streetify_revenue, 
    SUM(driver_net) AS total_driver_earnings
FROM payments
WHERE status = 'SUCCESS';

-- 4.3 Payment count and total value grouped by payment method (Card, Wallet, Cash)
SELECT 
    payment_method, 
    COUNT(*) AS transaction_count, 
    SUM(gross_amount) AS total_amount
FROM payments
GROUP BY payment_method;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ⭐ MITHUN — FEEDBACK & REVIEW MANAGEMENT MODULE
-- ─────────────────────────────────────────────────────────────────────────────

-- 5.1 View all customer reviews, ratings, and driver feedback comments
SELECT 
    r.id AS review_id, 
    r.trip_id, 
    pass.first_name + ' ' + pass.last_name AS passenger_name, 
    drv.first_name + ' ' + drv.last_name AS driver_name, 
    r.rating, 
    r.comment, 
    r.created_at
FROM reviews r
INNER JOIN users pass ON r.passenger_id = pass.id
INNER JOIN users drv ON r.driver_id = drv.id
ORDER BY r.id DESC;

-- 5.2 Compare driver ratings and total completed trips
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

-- 5.3 Rating distribution across all trips (5 stars down to 1 star)
SELECT 
    rating, 
    COUNT(*) AS count, 
    CAST(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reviews) AS DECIMAL(5,1)) AS percentage
FROM reviews
GROUP BY rating
ORDER BY rating DESC;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. 🛡️ VIDURA — SUPER ADMIN & GOVERNANCE MODULE
-- ─────────────────────────────────────────────────────────────────────────────

-- 6.1 Platform Executive Summary (Total Users by Role)
SELECT 
    role, 
    COUNT(*) AS total_count,
    SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) AS active_count,
    SUM(CASE WHEN suspended = 1 THEN 1 ELSE 0 END) AS suspended_count
FROM users
GROUP BY role;

-- 6.2 Trip Pipeline Overview (Grouped by status)
SELECT 
    status, 
    COUNT(*) AS total_trips,
    ISNULL(SUM(total_fare), 0.00) AS volume_lkr
FROM trips
GROUP BY status;

-- 6.3 Today's platform earnings summary
SELECT 
    CAST(GETDATE() AS DATE) AS report_date,
    COUNT(*) AS completed_trips_today,
    ISNULL(SUM(total_fare), 0) AS gross_fares_today,
    ISNULL(SUM(platform_commission), 0) AS net_streetify_commission_today
FROM trips
WHERE status = 'COMPLETED'
  AND CAST(completed_at AS DATE) = CAST(GETDATE() AS DATE);

-- 6.4 Inspect Customer Dispute Tickets and resolutions
SELECT 
    dt.id AS dispute_id, 
    dt.subject,
    dt.dispute_type, 
    dt.description, 
    dt.status, 
    dt.requested_refund_amount,
    dt.approved_refund_amount, 
    dt.resolution_note, 
    reporter.email AS reported_by, 
    dt.created_at
FROM dispute_tickets dt
INNER JOIN users reporter ON dt.passenger_id = reporter.id
ORDER BY dt.id DESC;

-- 6.5 View System Audit Logs (Security & Compliance trail)
SELECT TOP 20 
    id, 
    performed_by_staff_id,
    performed_by_email,
    action_type, 
    description, 
    target_user_id,
    target_entity_type, 
    target_entity_id, 
    created_at
FROM audit_logs
ORDER BY created_at DESC;
GO
