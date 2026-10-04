--Default quaries

SELECT * FROM reviews;

SELECT * FROM dispute_tickets;


-- 1. Analyze passenger complaints by counting the total number of disputes grouped by their type
SELECT dispute_type, COUNT(*) as TotalDisputes FROM dispute_tickets GROUP BY dispute_type;

-- 2. View all resolved disputes and their final resolution notes and refunds
SELECT id, dispute_type, resolution_note, approved_refund_amount FROM dispute_tickets WHERE status = 'RESOLVED';

-- 3. Analyze the overall platform sentiment by counting how many reviews exist for each star rating
SELECT rating, COUNT(*) as TotalReviews FROM reviews GROUP BY rating ORDER BY rating DESC;

-- 4. View the most recent 5-star reviews submitted by happy passengers
SELECT passenger_id, driver_id, comment, created_at FROM reviews WHERE rating = 5 ORDER BY created_at DESC;

-- 5. Calculate the average star rating for each driver on the platform
SELECT driver_id, AVG(rating) as AverageRating FROM reviews GROUP BY driver_id;


--How to use this to get MAXIMUM marks in your presentation:
--This is actually the best way to demonstrate real-time database integration to your lecturers! Here is what you should do during the presentation:

--Show the empty query first: Run the SELECT ... WHERE status = 'CANCELLED'; query and show the panel that it is empty. Tell the lecturer, "Currently, there are no cancelled trips in the system."
--Perform the action in Streetify: Open your React frontend side-by-side. Log in as a passenger, request a ride, and then immediately click the "Cancel Trip" button in the UI. Type in a reason like "Driver took too long".
--Execute the query again: Switch back to your SQL software and run the exact same query again. The row will instantly appear with the cancellation reason!
--This live demonstration proves to the panel that your React frontend is successfully talking to the Spring Boot backend, which is successfully writing to the MS SQL database in real-time. It is the ultimate proof of a fully integrated system!