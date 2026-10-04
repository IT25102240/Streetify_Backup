--Default quary

SELECT * FROM trips;


-- 1. View all active booking requests that are searching for a driver or accepted
SELECT id, pickup_address, dropoff_address, total_fare FROM trips WHERE status IN ('REQUESTED', 'ACCEPTED');

-- 2. View the complete booking history for a specific passenger (e.g., Passenger ID 1)
SELECT id, pickup_address, dropoff_address, status FROM trips WHERE passenger_id = 1;

-- 3. View bookings that were cancelled by the passenger and their reasons
SELECT id, pickup_address, cancellation_reason FROM trips WHERE status = 'CANCELLED';

-- 4. Find high-value bookings where the estimated fare is greater than 1000 LKR
SELECT pickup_address, dropoff_address, total_fare FROM trips WHERE total_fare > 1000;

-- 5. Calculate the total number of bookings grouped by their current status
SELECT status, COUNT(*) as TotalBookings FROM trips GROUP BY status;


--How to use this to get MAXIMUM marks in your presentation:
--This is actually the best way to demonstrate real-time database integration to your lecturers! Here is what you should do during the presentation:

--Show the empty query first: Run the SELECT ... WHERE status = 'CANCELLED'; query and show the panel that it is empty. Tell the lecturer, "Currently, there are no cancelled trips in the system."
--Perform the action in Streetify: Open your React frontend side-by-side. Log in as a passenger, request a ride, and then immediately click the "Cancel Trip" button in the UI. Type in a reason like "Driver took too long".
--Execute the query again: Switch back to your SQL software and run the exact same query again. The row will instantly appear with the cancellation reason!
--This live demonstration proves to the panel that your React frontend is successfully talking to the Spring Boot backend, which is successfully writing to the MS SQL database in real-time. It is the ultimate proof of a fully integrated system!