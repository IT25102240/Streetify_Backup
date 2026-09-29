-- ════════════════════════════════════════════════════════════════════════════════
-- ⚡ STREETIFY — STORED PROCEDURE: usp_ProcessTripPayment (ACID Transaction)
-- Fulfills Part E of Assignment 2
-- ════════════════════════════════════════════════════════════════════════════════

USE streetify_db;
GO

SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE usp_ProcessTripPayment
    @TripID      BIGINT,
    @Method      NVARCHAR(20),    -- Accepted: 'CARD' | 'WALLET' | 'CASH'
    @AmountPaid  DECIMAL(10,2)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;   -- Auto-rollback entire TX on any statement-level error

    -- ── Guard 1: Trip must exist and be in COMPLETED state ─────────────────
    IF NOT EXISTS (
        SELECT 1 FROM trips WHERE id = @TripID AND status = 'COMPLETED'
    )
    BEGIN
        ;THROW 50001, 'ERROR: Trip does not exist or is not in COMPLETED state.', 1;
        RETURN;
    END

    -- ── Guard 2: Idempotency check — no duplicate payment allowed ──────────
    IF EXISTS (SELECT 1 FROM payments WHERE trip_id = @TripID)
    BEGIN
        ;THROW 50002, 'ERROR: Payment already processed for this trip.', 1;
        RETURN;
    END

    -- ── Variable Declarations ──────────────────────────────────────────────
    DECLARE @DriverID    BIGINT         = (SELECT driver_id    FROM trips WHERE id = @TripID);
    DECLARE @PassengerID BIGINT         = (SELECT passenger_id FROM trips WHERE id = @TripID);
    DECLARE @Commission  DECIMAL(10,2)  = @AmountPaid * 0.15;   -- 15% platform cut
    DECLARE @NetShare    DECIMAL(10,2)  = @AmountPaid - @Commission;  -- 85% to driver
    DECLARE @TxnRef      NVARCHAR(100)  =
        'TXN_' + @Method + '_' + CAST(ABS(CHECKSUM(NEWID())) AS NVARCHAR(20));

    BEGIN TRY
        BEGIN TRANSACTION;

            -- Step 1: Insert immutable payment record
            INSERT INTO payments (trip_id, passenger_id, driver_id, gross_amount,
                platform_commission, driver_net, payment_method, status,
                transaction_ref, processed_at)
            VALUES (@TripID, @PassengerID, @DriverID, @AmountPaid,
                @Commission, @NetShare, @Method, 'SUCCESS', @TxnRef, GETDATE());

            -- Step 2: Mark trip as paid
            UPDATE trips
            SET is_paid    = 1,
                updated_at = GETDATE()
            WHERE id = @TripID;

            -- Step 3: CASH — driver received physical cash, record commission debt
            IF @Method = 'CASH'
            BEGIN
                UPDATE users
                SET commission_debt = commission_debt + @Commission,
                    updated_at      = GETDATE()
                WHERE id = @DriverID;
            END

            -- Step 4: WALLET — deduct fare from passenger's digital wallet
            IF @Method = 'WALLET'
            BEGIN
                UPDATE users
                SET wallet_balance = wallet_balance - @AmountPaid,
                    updated_at     = GETDATE()
                WHERE id = @PassengerID;
            END

        COMMIT TRANSACTION;

        -- Return payment receipt to the caller (application layer)
        SELECT
            @TripID                    AS trip_id,
            @AmountPaid                AS gross_paid,
            @Commission                AS platform_commission_15pct,
            @NetShare                  AS driver_net_85pct,
            @Method                    AS payment_method,
            @TxnRef                    AS transaction_reference,
            CONVERT(VARCHAR(19), GETDATE(), 120) AS processed_at;

    END TRY
    BEGIN CATCH
        -- XACT_STATE() = -1: uncommittable TX; <> 0: any active TX
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        ;THROW;  -- Re-raise original error to calling application
    END CATCH
END;
GO

PRINT '===================================================================';
PRINT '✅ Stored Procedure usp_ProcessTripPayment Created Successfully!';
PRINT '===================================================================';
GO
