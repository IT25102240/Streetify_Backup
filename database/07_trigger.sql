-- ════════════════════════════════════════════════════════════════════════════════
-- 🛡️ STREETIFY — TRIGGER: trg_ProtectFinalizedTrips (Immutable Audit Guard)
-- Fulfills Part F of Assignment 2
-- ════════════════════════════════════════════════════════════════════════════════

USE streetify_db;
GO

SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER TRIGGER trg_ProtectFinalizedTrips
ON trips
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Guard: prevent recursive trigger execution
    IF TRIGGER_NESTLEVEL(@@PROCID) > 1 RETURN;

    -- Check: Was the ORIGINAL status a terminal state (COMPLETED or CANCELLED)?
    --        AND: Is someone trying to mutate protected financial columns?
    IF EXISTS (
        SELECT 1
        FROM deleted d
        INNER JOIN inserted i ON d.id = i.id
        WHERE d.status IN ('COMPLETED', 'CANCELLED')
          AND (
                d.total_fare           <> i.total_fare
             OR d.platform_commission  <> i.platform_commission
             OR d.driver_net           <> i.driver_net
             OR d.distance_km          <> i.distance_km
             OR d.status               <> i.status
          )
    )
    BEGIN
        ROLLBACK TRANSACTION;
        ;THROW 50101,
            'CRITICAL INTEGRITY VIOLATION: Finalized trips (COMPLETED/CANCELLED) are immutable financial records. Fare, commission, distance, and status cannot be altered after finalization.',
            1;
    END
END;
GO

PRINT '===================================================================';
PRINT '✅ Trigger trg_ProtectFinalizedTrips Created Successfully!';
PRINT '===================================================================';
GO

-- ════════════════════════════════════════════════════════════════════════════════
-- 🧪 VIVA DEMONSTRATION & VERIFICATION SCRIPT
-- ════════════════════════════════════════════════════════════════════════════════

-- Test 1: Attempt to change the fare of a COMPLETED trip (SHOULD FAIL with error 50101)
BEGIN TRY
    UPDATE trips SET total_fare = 1.00 WHERE id = 1;   -- Fraudulent edit!
    PRINT 'Update succeeded (UNEXPECTED — trigger failed!)';
END TRY
BEGIN CATCH
    SELECT
        ERROR_NUMBER()   AS error_number,
        ERROR_MESSAGE()  AS error_message,
        ERROR_SEVERITY() AS severity;
END CATCH;
GO

-- Test 2: Attempt to reopen a COMPLETED trip (SHOULD FAIL with error 50101)
BEGIN TRY
    UPDATE trips SET status = 'REQUESTED' WHERE id = 1;
END TRY
BEGIN CATCH
    SELECT
        ERROR_NUMBER()   AS error_number,
        ERROR_MESSAGE()  AS error_message,
        ERROR_SEVERITY() AS severity;
END CATCH;
GO

-- Test 3: Verify Trip 1 data is completely UNCHANGED after both attempts
SELECT id, pickup_address, dropoff_address, total_fare,
       platform_commission, driver_net, status
FROM trips WHERE id = 1;
GO

-- Test 4: Verify a NON-financial update STILL works (trigger does not over-block)
UPDATE trips SET updated_at = GETDATE() WHERE id = 1;
SELECT id, updated_at FROM trips WHERE id = 1;
GO

