# 👥 Streetify Project - Module Assignment by Team Member

Based on the codebase analysis, here are the project files grouped by the 6 team members and their assigned modules:

---

## 1. 👤 **Lahiru Peris (IT25102208)** - Nayanamina A.R.L.P.
### Module: User Account & Verification

#### **Frontend Files:**
- `streetify-frontend/src/screens/Login.tsx` - Login/authentication screen
- `streetify-frontend/src/screens/Profile.tsx` - User profile management
- `streetify-frontend/src/utils/storage.ts` - Tab-isolated storage utility (jwt_token, user_role, user_name, etc.)
- `streetify-frontend/src/utils/validators.ts` - Email and phone number validation
- `streetify-frontend/src/api/apiClient.ts` - API client with authentication functions
- `streetify-frontend/src/screens/Support.tsx` - Support-related features
- `streetify-frontend/src/screens/Review.tsx` - Review functionality (partial)

#### **Database Files:**
- `database/03_team_member_queries.sql` - Individual queries for viva demo
- `database/Lahiru (IT25102208) - User Account & Verification Module.sql` (if exists in DB_quaries)

#### **Key Responsibilities:**
- User authentication and JWT token management
- Profile management and user data verification
- Storage isolation across multiple tabs
- Input validation for user data

---

## 2. 👤 **Chanuka Dharmakeerthi (IT25102207)** - Dharmakeerthi W.A.C.B.
### Module: Ride Booking & Dispatch Engine

#### **Frontend Files:**
- `streetify-frontend/src/screens/Booking.tsx` - Main booking/home screen
- `streetify-frontend/src/screens/Driver.tsx` - Driver view (booking interface)
- `streetify-frontend/src/services/fareCalculationService.ts` - Fare calculation logic
- `streetify-frontend/src/services/tripSyncService.ts` - Trip synchronization
- `streetify-frontend/src/screens/BranchKiosk.tsx` - Kiosk booking interface
- `streetify-frontend/src/components/ModuleExportCard.tsx` - Module export features

#### **Backend Files:**
- `streetify-backend/src/main/java/com/streetify/service/DispatchService.java` - Dispatch engine service
- `streetify-backend/src/main/java/com/streetify/service/PaymentService.java` - Payment processing (partial)
- `streetify-backend/src/main/java/com/streetify/dto/AvailableTripDTO.java` - Available trip data
- `streetify-backend/src/main/java/com/streetify/controller/TripController.java` - Trip management controller
- `streetify-backend/src/main/java/com/streetify/entity/Trip.java` - Trip entity

#### **Database Files:**
- `database/02_seed_data.sql` - Contains seed data for bookings/trips
- `database/01_schema_ddl.sql` - Trip-related table schemas
- `DB_quaries/Chanuka (IT25102207) - Ride Booking & Dispatch Engine.sql`

#### **Key Responsibilities:**
- Ride booking and trip request management
- Fare calculation and pricing
- Dispatch engine for trip assignment
- Real-time trip tracking and sync

---

## 3. 👤 **Tharindu Senaka (IT25102241)** - Senaka K.A.T.
### Module: Trip Progress & Telemetry

#### **Backend Files:**
- `streetify-backend/src/main/java/com/streetify/service/TripTrackingService.java` - Core trip tracking service
- `streetify-backend/src/main/java/com/streetify/service/SupportService.java` - Support related to trips
- `streetify-backend/src/main/java/com/streetify/entity/TripStatus.java` - Trip status enumeration
- `streetify-backend/src/main/java/com/streetify/entity/TelemetryDTO.java` - Telemetry data transfer object
- `streetify-backend/src/main/java/com/streetify/dto/TripStatusUpdateDTO.java` - Trip status update DTO
- `streetify-backend/src/main/java/com/streetify/dto/TripRequestDTO.java` - Trip request DTO
- `streetify-backend/src/main/java/com/streetify/dto/TripResponseDTO.java` - Trip response DTO
- `streetify-backend/src/main/java/com/streetify/controller/TripTrackingController.java` - Trip tracking controller
- `streetify-backend/src/main/java/com/streetify/controller/TripController.java` - Trip controller

#### **Database Files:**
- `database/01_schema_ddl.sql` - Trip status and telemetry tables
- `database/02_seed_data.sql` - Seed data for trips
- `database/03_team_member_queries.sql` - Trip progress queries
- `DB_quaries/Tharindu (IT25102241) - Trip Progress & Telemetry.sql`

#### **Key Responsibilities:**
- Real-time trip progress tracking
- Telemetry data collection and processing
- Trip status management and updates
- Trip request dispatch and routing

---

## 4. 👤 **Daham Edirisinghe (IT25102225)** - Edirisinghe E.A.R.N.D.
### Module: Payment & Ledger Management

#### **Backend Files:**
- `streetify-backend/src/main/java/com/streetify/service/PaymentService.java` - Core payment service
- `streetify-backend/src/main/java/com/streetify/controller/PaymentController.java` - Payment controller
- `streetify-backend/src/main/java/com/streetify/dto/PaymentRequestDTO.java` - Payment request DTO
- `streetify-backend/src/main/java/com/streetify/dto/PaymentReceiptDTO.java` - Payment receipt DTO
- `streetify-backend/src/main/java/com/streetify/entity/Payment.java` - Payment entity
- `streetify-backend/src/main/java/com/streetify/entity/PaymentStatus.java` - Payment status enumeration
- `streetify-backend/src/main/java/com/streetify/security/JwtUtil.java` - JWT utilities (payment-related)

#### **Frontend Files:**
- `streetify-frontend/src/screens/Payment.tsx` - Payment screen
- `streetify-frontend/src/services/notificationService.ts` - Payment notifications
- `streetify-frontend/src/ui.tsx` - UI primitives including payment-related pills/buttons

#### **Database Files:**
- `database/01_schema_ddl.sql` - Payment tables, ledgers, and financial schemas
- `database/02_seed_data.sql` - Payment seed data with BCrypt passwords
- `database/06_stored_procedure.sql` - Payment stored procedures
- `database/04_utility_test_scripts.sql` - Payment testing scripts
- `DB_quaries/Daham (IT25102225) - Payment & Ledger Management.sql`

#### **Key Responsibilities:**
- Payment processing and gateway integration
- Receipt generation and ledger management
- Transaction tracking and reconciliation
- Financial reporting and analytics

---

## 5. 👤 **Mithun Weerasingha (IT25102193)** - Weerasingha W.A.M.B.
### Module: Review & Dispute Form

#### **Backend Files:**
- `streetify-backend/src/main/java/com/streetify/service/ReviewService.java` - Review service
- `streetify-backend/src/main/java/com/streetify/controller/ReviewController.java` - Review controller
- `streetify-backend/src/main/java/com/streetify/dto/ReviewSubmitDTO.java` - Review submit DTO
- `streetify-backend/src/main/java/com/streetify/dto/ReviewResponseDTO.java` - Review response DTO
- `streetify-backend/src/main/java/com/streetify/entity/Review.java` - Review entity
- `streetify-backend/src/main/java/com/streetify/entity/DisputeTicket.java` - Dispute ticket entity
- `streetify-backend/src/main/java/com/streetify/entity/DisputeStatus.java` - Dispute status enumeration
- `streetify-backend/src/main/java/com/streetify/dao/DisputeDAO.java` - Dispute DAO
- `streetify-backend/src/main/java/com/streetify/dao/ReviewDAO.java` - Review DAO

#### **Frontend Files:**
- `streetify-frontend/src/screens/Review.tsx` - Review/rating screen
- `streetify-frontend/src/components/ReceiptDisplay.tsx` - Review display component
- `streetify-frontend/src/ui.tsx` - UI primitives including pill colors (pill-red for disputes)
- `streetify-frontend/src/services/demoDriverService.ts` (may include review features)

#### **Database Files:**
- `database/01_schema_ddl.sql` - Reviews, ratings, and dispute tables
- `database/02_seed_data.sql` - Review and dispute seed data
- `database/03_team_member_queries.sql` - Review and dispute queries
- `database/04_utility_test_scripts.sql` - Review testing scripts
- `DB_quaries/Mithun (IT25102193) - Review, Rating, and Feedback Management.sql`

#### **Key Responsibilities:**
- Trip rating and review submission
- Dispute ticket creation and management
- Rating aggregation and display
- Feedback form processing

---

## 6. 👤 **Vidura Rammandalagedara (IT25102240)** - Rammandalagedara R.V.S.
### Module: Administration & System Control

#### **Backend Files:**
- `streetify-backend/src/main/java/com/streetify/service/AdminGovernanceService.java` - Admin governance service
- `streetify-backend/src/main/java/com/streetify/controller/AdminController.java` - Admin controller
- `streetify-backend/src/main/java/com/streetify/controller/ModuleAdminController.java` - Module administration controller
- `streetify-backend/src/main/java/com/streetify/security/JwtUtil.java` - JWT utilities (admin)
- `streetify-backend/src/main/java/com/streetify/security/JwtAuthFilter.java` - Admin authentication filter
- `streetify-backend/src/main/java/com/streetify/security/AppUserDetailsService.java` - User details for admin
- `streetify-backend/src/main/java/com/streetify/config/SecurityConfig.java` - Security configuration
- `streetify-backend/src/main/java/com/streetify/config/GlobalExceptionHandler.java` - Exception handling
- `streetify-backend/src/main/java/com/streetify/config/WebSocketConfig.java` - WebSocket for admin
- `streetify-backend/src/main/java/com/streetify/entity/AuditLog.java` - Audit logging
- `streetify-backend/src/main/java/com/streetify/dao/AuditLogDAO.java` - Audit log DAO
- `streetify-backend/src/main/java/com/streetify/entity/DisputeStatus.java` (admin management)
- `streetify-backend/src/main/java/com/streetify/entity/User.java` (admin role management)

#### **Frontend Files:**
- `streetify-frontend/src/screens/Admin.tsx` - Admin panel screen
- `streetify-frontend/src/components/NotificationCenter.tsx` - Admin notifications
- `streetify-frontend/src/components/SystemStatusIndicator.tsx` - System status monitoring
- `streetify-frontend/src/ui.tsx` - UI primitives with admin-related styles
- `streetify-frontend/src/screens/Support.tsx` (admin mode)

#### **Database Files:**
- `database/01_schema_ddl.sql` - Admin users, roles, and system configuration tables
- `database/02_seed_data.sql` - Admin credentials and super admin data
- `database/03_team_member_queries.sql` - Admin and system control queries
- `database/06_stored_procedure.sql` - Admin procedures and governance
- `database/07_trigger.sql` - Audit triggers and system controls
- `database/generate_viva_word_doc.py` - Viva doc generation (admin-related)
- `database/04_utility_test_scripts.sql` - System control testing scripts

#### **Root/Config Files:**
- `.gitignore` - Root-level git ignore (admin may manage repo settings)
- `package.json` - Root npm scripts
- `Ai_docs/` - DDD assignment reports (may include admin documentation)

#### **Key Responsibilities:**
- User role and permission management
- System administration and governance
- Audit logging and compliance
- Admin panel and dashboard control
- SUPER_ADMIN privileges management

---

## 📊 Module-to-File Mapping Summary

| Team Member | Module | Key Frontend Files | Key Backend Files | Key DB Files |
|---|---|---|---|---|
| **Lahiru** (IT25102208) | User Account & Verification | Login, Profile, storage.ts, validators.ts | AuthService, AuthController | 03_team_member_queries.sql |
| **Chanuka** (IT25102207) | Ride Booking & Dispatch | Booking, Driver, fareCalculationService, tripSyncService | DispatchService, PaymentService, TripController | 01_schema_ddl.sql, 02_seed_data.sql |
| **Tharindu** (IT25102241) | Trip Progress & Telemetry | Driver screen | TripTrackingService, SupportService, Trip entities | 01_schema_ddl.sql, 03_team_member_queries.sql |
| **Daham** (IT25102225) | Payment & Ledger Management | Payment.tsx, ui.tsx payment pills | PaymentService, PaymentController, Payment entities | 01_schema_ddl.sql, 06_stored_procedure.sql |
| **Mithun** (IT25102193) | Review & Dispute Form | Review.tsx, ui.tsx dispute pills | ReviewService, ReviewController, Review/Dispute entities | 01_schema_ddl.sql, 04_utility_test_scripts.sql |
| **Vidura** (IT25102240) | Admin Governance & System Control | Admin.tsx, NotificationCenter, SystemStatusIndicator | AdminGovernanceService, AdminController, ModuleAdminController, AuditLog, all config files | 01_schema_ddl.sql, 02_seed_data.sql, 06_stored_procedure.sql, 07_trigger.sql |

---

## 🎯 Assignment Notes

1. **Overlap Areas**: Some files span multiple modules (e.g., `application.properties`, `seed.sql`, `global exceptions`)
2. **Shared Components**: `ui.tsx`, `index.css` are used across all modules
3. **Database Tables**: Most SQL DDL applies to all modules, but each member has specific table responsibilities
4. **Viva Preparation**: Each member should focus on their module's queries in `database/03_team_member_queries.sql`

*Grouping based on analysis of `E:\2Y1S\2Y1S_Projects\SE_project\Streetify\Streetify_Backup` codebase structure and source file responsibilities.*