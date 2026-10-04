--Default quaries
SELECT * FROM payments;




-- 1. View all successful payment receipts for completed trips
SELECT trip_id, payment_method, gross_amount, driver_net, platform_commission FROM payments WHERE status = 'SUCCESS';

-- 2. Calculate the total platform commission fees earned by Streetify
SELECT SUM(platform_commission) as TotalPlatformProfit FROM payments WHERE status = 'SUCCESS';

-- 3. Analyze transaction volume by Payment Method (Cash, Wallet, Card)
SELECT payment_method, COUNT(*) as TotalTransactions, SUM(gross_amount) as TotalVolume FROM payments WHERE status = 'SUCCESS' GROUP BY payment_method;

-- 4. Check the commission debt owed by drivers to Streetify (Cash trips)
SELECT first_name, commission_debt FROM users WHERE dtype = 'DRIVER' AND commission_debt > 0;

-- 5. View the top 5 most expensive trips ever successfully paid for on the platform
SELECT TOP 5 trip_id, payment_method, gross_amount, created_at FROM payments WHERE status = 'SUCCESS' ORDER BY gross_amount DESC;


--How to use this to get MAXIMUM marks in your presentation:
--This is actually the best way to demonstrate real-time database integration to your lecturers! Here is what you should do during the presentation:

--Show the empty query first: Run the SELECT ... WHERE status = 'CANCELLED'; query and show the panel that it is empty. Tell the lecturer, "Currently, there are no cancelled trips in the system."
--Perform the action in Streetify: Open your React frontend side-by-side. Log in as a passenger, request a ride, and then immediately click the "Cancel Trip" button in the UI. Type in a reason like "Driver took too long".
--Execute the query again: Switch back to your SQL software and run the exact same query again. The row will instantly appear with the cancellation reason!
--This live demonstration proves to the panel that your React frontend is successfully talking to the Spring Boot backend, which is successfully writing to the MS SQL database in real-time. It is the ultimate proof of a fully integrated system!