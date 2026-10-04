--Default quaries

-- To view only Drivers:
SELECT * FROM users WHERE role = 'DRIVER';

SELECT * FROM vehicles;

SELECT * FROM driver_documents;



-- 1. View all trips currently 'IN_PROGRESS' (Passengers currently inside the vehicle)
SELECT id, driver_id, passenger_id, pickup_address FROM trips WHERE status = 'IN_PROGRESS';

-- 2. View online drivers waiting for ride dispatch (Telemetry check)
SELECT first_name, current_lat, current_lng FROM users WHERE dtype = 'DRIVER' AND is_online = 1;

-- 3. JOIN Query: See the Driver's Name alongside their assigned Vehicle Details
SELECT u.first_name, v.vehicle_type, v.number_plate 
FROM users u 
JOIN vehicles v ON u.id = v.driver_id;

-- 4. View completed trips, the distance traveled, and the final fare charged
SELECT id, driver_id, distance_km, total_fare FROM trips WHERE status = 'COMPLETED';

-- 5. Find the busiest drivers (Count the total number of completed trips per driver)
SELECT driver_id, COUNT(*) as TotalTrips FROM trips WHERE status = 'COMPLETED' GROUP BY driver_id;



--How to use this to get MAXIMUM marks in your presentation:
--This is actually the best way to demonstrate real-time database integration to your lecturers! Here is what you should do during the presentation:

--Show the empty query first: Run the SELECT ... WHERE status = 'CANCELLED'; query and show the panel that it is empty. Tell the lecturer, "Currently, there are no cancelled trips in the system."
--Perform the action in Streetify: Open your React frontend side-by-side. Log in as a passenger, request a ride, and then immediately click the "Cancel Trip" button in the UI. Type in a reason like "Driver took too long".
--Execute the query again: Switch back to your SQL software and run the exact same query again. The row will instantly appear with the cancellation reason!
--This live demonstration proves to the panel that your React frontend is successfully talking to the Spring Boot backend, which is successfully writing to the MS SQL database in real-time. It is the ultimate proof of a fully integrated system!