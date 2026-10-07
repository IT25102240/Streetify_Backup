# Streetify Project - Validation Files Analysis by Member

This document tracks and outlines the full project structure specifically identifying where validation logic (both Backend constraints/DTOs and Frontend form/state validations) resides for each module, assigned to the 6 team members.

---

## 1. User Account Management & Verification Module
**Assigned To:** Lahiru (IT25102208)

**Backend Validation Files:**
* `streetify-backend/src/main/java/com/streetify/controller/AuthController.java` (Authentication & registration request validation)
* `streetify-backend/src/main/java/com/streetify/dto/LoginDTO.java` (`@NotBlank`, `@Email` validations)
* `streetify-backend/src/main/java/com/streetify/dto/UserRegistrationDTO.java` (Passenger form input validation constraints)
* `streetify-backend/src/main/java/com/streetify/dto/DriverRegistrationDTO.java` (Driver-specific requirements like NIC, License validations)
* `streetify-backend/src/main/java/com/streetify/entity/User.java` (JPA Entity constraints and database-level validations)

**Frontend Validation Files:**
* `streetify-frontend/src/screens/Login.tsx` (Form data parsing, email regex, and password length checks)
* `streetify-frontend/src/screens/Profile.tsx` (Profile update form validations)
* `streetify-frontend/src/components/LahiruUserDashboard.tsx` (User component data checks)
* `streetify-frontend/src/utils/validators.ts` (Reusable client-side validation logic functions)

---

## 2. Ride Booking and Dispatch Engine
**Assigned To:** Chanuka (IT25102207)

**Backend Validation Files:**
* `streetify-backend/src/main/java/com/streetify/controller/TripController.java` (Validates booking payloads before dispatching)
* `streetify-backend/src/main/java/com/streetify/dto/TripRequestDTO.java` (Coordinate bounds, `@NotNull` on pickup/dropoff addresses)
* `streetify-backend/src/main/java/com/streetify/entity/Vehicle.java` (Vehicle properties constraints and driver mapping validation)

**Frontend Validation Files:**
* `streetify-frontend/src/screens/Booking.tsx` (Validations ensuring pickup and dropoff fields are set before allowing ride dispatch)
* `streetify-frontend/src/components/VehicleTypeSelector.tsx` (Ensuring valid ride type selection)
* `streetify-frontend/src/components/ChanukaBookingDashboard.tsx`
* `streetify-frontend/src/OsmMap.tsx` (Map-based coordinate validation and bounds checking)
* `streetify-frontend/src/hooks/useGeolocation.ts` (Permissions validation and GPS availability checks)

---

## 3. Trip Progress & Telemetry (Driver Trip Request Mgmt)
**Assigned To:** Tharindu (IT25102241)

**Backend Validation Files:**
* `streetify-backend/src/main/java/com/streetify/controller/TripTrackingController.java` (Validating live location stream and trip updates)
* `streetify-backend/src/main/java/com/streetify/dto/TripStatusUpdateDTO.java` (State machine transition validations ensuring valid trip states)
* `streetify-backend/src/main/java/com/streetify/entity/Trip.java` (Entity-level annotations for required fields during an active trip)

**Frontend Validation Files:**
* `streetify-frontend/src/screens/Driver.tsx` (Button disable/enable logic validating if a driver can accept, start, or end a trip)
* `streetify-frontend/src/services/tripSyncService.ts` (WebSocket incoming message payload validations)

---

## 4. Payment and Ledger Management
**Assigned To:** Daham (IT25102225)

**Backend Validation Files:**
* `streetify-backend/src/main/java/com/streetify/controller/PaymentController.java` (Checking fare consistency and payment status validations)
* `streetify-backend/src/main/java/com/streetify/dto/PaymentRequestDTO.java` (Ensuring payment amount is valid and method is recognized)

**Frontend Validation Files:**
* `streetify-frontend/src/screens/Payment.tsx` (Client-side checks for credit card numbers, wallet balances, and form completeness)
* `streetify-frontend/src/components/ReceiptDisplay.tsx` (Data validation before rendering the receipt)
* `streetify-frontend/src/components/DahamPaymentDashboard.tsx`

---

## 5. Review, Rating, and Feedback Management (Review & Dispute)
**Assigned To:** Mithun (IT25102193)

**Backend Validation Files:**
* `streetify-backend/src/main/java/com/streetify/controller/ReviewController.java` (Validating ratings against a completed trip)
* `streetify-backend/src/main/java/com/streetify/dto/ReviewSubmitDTO.java` (`@Min(1)` and `@Max(5)` constraints for star ratings)
* `streetify-backend/src/main/java/com/streetify/controller/DisputeController.java` (Dispute ticket submission validations)
* `streetify-backend/src/main/java/com/streetify/dto/DisputeSubmitDTO.java` (Reason/Description `@NotBlank` and length constraints)
* `streetify-backend/src/main/java/com/streetify/dto/DisputeResolveDTO.java` (Validating resolution notes)

**Frontend Validation Files:**
* `streetify-frontend/src/screens/Review.tsx` (Star rating bounds and comment length validation before submission)
* `streetify-frontend/src/screens/Support.tsx` (Dispute form validation checking for empty subjects/descriptions)
* `streetify-frontend/src/screens/History.tsx` (Validating trip history search and filtering logic)

---

## 6. Administration and System Control (Admin Governance)
**Assigned To:** Vidura (IT25102240)

**Backend Validation Files:**
* `streetify-backend/src/main/java/com/streetify/controller/AdminController.java` (Role-based access control and privilege validations)
* `streetify-backend/src/main/java/com/streetify/dto/SuspendUserDTO.java` (Suspension reason and time duration checks)
* `streetify-backend/src/main/java/com/streetify/config/GlobalExceptionHandler.java` (The centralized hub that catches `MethodArgumentNotValidException` from all the above DTOs and formats the validation error messages)

**Frontend Validation Files:**
* `streetify-frontend/src/screens/Admin.tsx` (Extensive form validations for CRUD operations, driver approval, and trip modifications)
* `streetify-frontend/src/components/ModuleExportCard.tsx` (Validating requested export formats and date ranges)
* `streetify-frontend/src/screens/BranchKiosk.tsx` (Validating manual kiosk input data)
* `streetify-frontend/src/components/NotificationCenter.tsx` (Validating notification types before displaying)
