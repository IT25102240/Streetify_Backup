SELECT * FROM users;

SELECT * FROM trips;

-- To view only Drivers:
SELECT * FROM users WHERE role = 'DRIVER';

-- To view only Passengers:
SELECT * FROM users WHERE role = 'PASSENGER';

-- To view only Admins:
SELECT * FROM users WHERE role = 'ADMIN';


SELECT * FROM vehicles;

SELECT * FROM driver_documents;

SELECT * FROM payments;

SELECT * FROM reviews;

SELECT * FROM dispute_tickets;

SELECT * FROM audit_logs;