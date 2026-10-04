--Default quaries

-- To view only Admins:
SELECT * FROM users WHERE role = 'ADMIN';

SELECT * FROM audit_logs;


-- 1. View all system administrators and their designated access modules
SELECT first_name, last_name, email, admin_role FROM users WHERE role = 'ADMIN';

-- 2. View the system audit logs to track exactly what Admins have been doing
SELECT performed_by_email, action_type, description, created_at FROM audit_logs ORDER BY created_at DESC;

-- 3. Track staff productivity by counting the total number of actions performed by each Administrator
SELECT performed_by_email, COUNT(*) as TotalActionsPerformed 
FROM audit_logs 
GROUP BY performed_by_email 
ORDER BY TotalActionsPerformed DESC;

-- 4. View a top-level financial summary of the entire platform's operations
SELECT COUNT(*) as TotalPaymentsProcessed, SUM(gross_amount) as TotalGrossVolume, SUM(platform_commission) as TotalNetRevenue FROM payments WHERE status = 'SUCCESS';

-- 5. View a comprehensive system health check grouping accounts by active/suspended status
SELECT role, active, suspended, COUNT(*) as TotalCount FROM users GROUP BY role, active, suspended;


--How to use this to get MAXIMUM marks in your presentation:
--This is actually the best way to demonstrate real-time database integration to your lecturers! Here is what you should do during the presentation:

--Show the empty query first: Run the SELECT ... WHERE status = 'CANCELLED'; query and show the panel that it is empty. Tell the lecturer, "Currently, there are no cancelled trips in the system."
--Perform the action in Streetify: Open your React frontend side-by-side. Log in as a passenger, request a ride, and then immediately click the "Cancel Trip" button in the UI. Type in a reason like "Driver took too long".
--Execute the query again: Switch back to your SQL software and run the exact same query again. The row will instantly appear with the cancellation reason!
--This live demonstration proves to the panel that your React frontend is successfully talking to the Spring Boot backend, which is successfully writing to the MS SQL database in real-time. It is the ultimate proof of a fully integrated system!