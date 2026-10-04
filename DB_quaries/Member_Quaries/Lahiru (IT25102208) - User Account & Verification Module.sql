--Default quaries

SELECT * FROM users;

-- To view only Passengers:
SELECT * FROM users WHERE role = 'PASSENGER';



-- 1. View all active passenger accounts
SELECT first_name, last_name, email, phone FROM users WHERE dtype = 'USER' AND active = 1;

-- 2. View pending driver accounts waiting for verification
SELECT first_name, nic, license_number, verification_status FROM users WHERE dtype = 'DRIVER' AND verification_status = 'PENDING_VERIFICATION';

-- 3. Check for any accounts that are currently suspended from the platform
SELECT email, role, suspension_reason, suspended_until FROM users WHERE suspended = 1;

-- 4. View the status of all uploaded verification documents for drivers
SELECT driver_id, doc_type, status, uploaded_at FROM driver_documents;

-- 5. Count the total number of accounts grouped by type (Driver vs Passenger)
SELECT dtype as AccountType, COUNT(*) as TotalAccounts FROM users GROUP BY dtype;





--How to use this to get MAXIMUM marks in your presentation:
--This is actually the best way to demonstrate real-time database integration to your lecturers! Here is what you should do during the presentation:

--Show the empty query first: Run the SELECT ... WHERE status = 'CANCELLED'; query and show the panel that it is empty. Tell the lecturer, "Currently, there are no cancelled trips in the system."
--Perform the action in Streetify: Open your React frontend side-by-side. Log in as a passenger, request a ride, and then immediately click the "Cancel Trip" button in the UI. Type in a reason like "Driver took too long".
--Execute the query again: Switch back to your SQL software and run the exact same query again. The row will instantly appear with the cancellation reason!
--This live demonstration proves to the panel that your React frontend is successfully talking to the Spring Boot backend, which is successfully writing to the MS SQL database in real-time. It is the ultimate proof of a fully integrated system!