# Streetify v2.0 - Final Evaluation Mapping Guide

Welcome to the **Streetify Platform Architecture & Evaluation Guide**. This document is designed for the Lecturer Panel to easily navigate the codebase and evaluate the specific contributions of each team member. 

The Streetify platform is built using modern enterprise standards:
- **Backend:** Spring Boot (Java) using a **Layered Architecture** (`controller`, `service`, `dao`, `entity`).
- **Frontend:** React (TypeScript/Vite) using a **Component-Based Architecture** (`screens`, `components`, `hooks`).

Rather than breaking industry standards by putting files into physical "student folders," we maintain a professional architecture where files are grouped by their technical layer. Below is the exact mapping of which files belong to which team member's module.

---

## 1. User Account & Verification Module
**Developer:** Lahiru (IT25102208 - Nayanamina A.R.L.P.)
**Scope:** Passenger & Driver registration, JWT Authentication, Login, Role switching, Profile Management.

**Backend Files:**
- `controller/AuthController.java` (Login & Registration endpoints)
- `entity/User.java` (Core user model)
- `entity/Driver.java` (Driver-specific data model)
- `service/CustomUserDetailsService.java` (Spring Security auth logic)
- `security/JwtUtil.java` (Token generation)
- `dao/UserDAO.java` & `dao/DriverDAO.java` (Database operations)

**Frontend Files:**
- `src/screens/Login.tsx` (Auth UI & Role Switcher)
- `src/screens/Profile.tsx` (User Profile management)
- `src/screens/BranchKiosk.tsx` (Walk-in user account handling)

---

## 2. Ride Booking & Dispatch Engine
**Developer:** Chanuka (IT25102207 - Dharmakeerthi W.A.C.B.)
**Scope:** Passenger booking flows, fare estimation logic, geocoding logic, finding nearby drivers.

**Backend Files:**
- `controller/BookingController.java` (Trip requests & Fare calculation)
- `entity/Trip.java` (Core trip data model)
- `dao/TripDAO.java` (Trip database persistence)

**Frontend Files:**
- `src/screens/Booking.tsx` (Main booking interface for passengers)
- `src/components/OsmMap.tsx` (Map routing and distance calculation)
- `src/hooks/useGeolocation.ts` (Location tracking)

---

## 3. Trip Progress & Telemetry
**Developer:** Tharindu (IT25102241 - Senaka K.A.T.)
**Scope:** Driver trip acceptance, live status updates (Requested ➔ Accepted ➔ In Progress ➔ Completed), vehicle tracking.

**Backend Files:**
- `controller/DriverTripController.java` (Driver actions for active trips)
- `entity/Vehicle.java` (Driver's vehicle model)
- `dao/VehicleDAO.java` (Vehicle database operations)
- *Note: Shares `Trip.java` and `TripDAO.java` with the Booking Module.*

**Frontend Files:**
- `src/screens/Driver.tsx` (Driver's live trip dashboard)
- `src/screens/History.tsx` (Trip histories for drivers/passengers)

---

## 4. Payment & Ledger Management
**Developer:** Daham (IT25102225 - Edirisinghe E.A.R.N.D.)
**Scope:** Trip payments, 3DS secure mock flows, driver commission calculations, platform revenue.

**Backend Files:**
- `controller/PaymentController.java` (Payment processing endpoints)
- `entity/Payment.java` (Financial transaction model)
- `dao/PaymentDAO.java` (Ledger operations)

**Frontend Files:**
- `src/screens/Payment.tsx` (Passenger payment interface & receipt view)

---

## 5. Review & Dispute Management
**Developer:** Mithun (IT25102193 - Weerasingha W.A.M.B.)
**Scope:** Post-trip ratings, dispute tickets for bad rides, Customer Support portal for investigating issues.

**Backend Files:**
- `controller/ReviewController.java` (Submitting ratings)
- `controller/DisputeController.java` (Submitting and fetching support tickets)
- `entity/Review.java` & `entity/DisputeTicket.java` (Models)
- `dao/ReviewDAO.java` & `dao/DisputeTicketDAO.java` (Database operations)

**Frontend Files:**
- `src/screens/Review.tsx` (Passenger interface to rate trips)
- `src/screens/Support.tsx` (Customer Support portal for resolving tickets)

---

## 6. Admin Governance & System Control
**Developer:** Vidura (IT25102240 - Rammandalagedara R.V.S.)
**Scope:** Role-Based Access Control (RBAC), Super Admin overrides, global system audits, cross-module data entry.

**Backend Files:**
- `controller/ModuleAdminController.java` (Global CRUD operations across all tables)
- `entity/AuditLog.java` (System tracking model)
- `dao/AuditLogDAO.java` (Audit database persistence)
- `database/01_schema_ddl.sql` & `database/02_seed_data.sql` (Master DB control)

**Frontend Files:**
- `src/screens/Admin.tsx` (Massive Admin Console & Data Entry Engine)
- `src/App.tsx` (Global RBAC routing & Navigation State)
- `src/ui.tsx` (Global UI primitive system & Modals)

---

### Why a Layered Architecture? (Note to Lecturers)
In enterprise software engineering (like Spring Boot and React), forcing code into separate "student folders" creates tightly coupled code that violates the **Separation of Concerns** principle. By using a standard Layered Architecture (`controller`, `entity`, `screens`), the Streetify team has demonstrated they can collaborate on a single unified, professional codebase while maintaining distinct modular logic internally.
