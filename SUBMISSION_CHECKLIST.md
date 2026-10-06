# 📦 Streetify Repository Submission Checklist

## 🎯 Purpose
This checklist identifies **all files that should be submitted** to a new repository, and **what should be excluded**. Based on the current backup at `E:\2Y1S\2Y1S_Projects\SE_project\Streetify\Streetify_Backup`.

---

## ✅ FILES TO INCLUDE (Essential Source Code)

### **Frontend - `streetify-frontend/`**
| Category | Files |
|---|---|
| **Entry Points** | `src/main.tsx`, `index.html` |
| **Root App** | `src/App.tsx`, `src/index.css` |
| **UI Primitives** | `src/ui.tsx`, `src/hooks/useGeolocation.ts`, `src/utils/storage.ts`, `src/utils/validators.ts`, `src/api/apiClient.ts` |
| **Screens** | `src/screens/Login.tsx`, `Booking.tsx`, `Driver.tsx`, `Payment.tsx`, `Review.tsx`, `Admin.tsx`, `History.tsx`, `Support.tsx`, `Profile.tsx`, `BranchKiosk.tsx` |
| **Components** | `src/components/ChanukaBookingDashboard.tsx`, `DahamPaymentDashboard.tsx`, `DemoSwitcher.tsx`, `Footer.tsx`, `LahiruUserDashboard.tsx`, `ModuleExportCard.tsx`, `NotificationCenter.tsx`, `ReceiptDisplay.tsx`, `VehicleTypeSelector.tsx` |
| **Config** | `vite.config.ts`, `tsconfig.json`, `.gitattributes`, `.gitignore` |
| **Package** | `package.json`, `.mise.toml` |

### **Backend - `streetify-backend/`**
| Category | Files |
|---|---|
| **Maven/POM** | `pom.xml`, `mvnw.cmd`, `.mvn/wrapper/maven-wrapper.properties`, `.mvn/wrapper/maven-wrapper.jar` |
| **Application** | `src/main/java/com/streetify/StreetifyApplication.java` |
| **Entities** | All 21 entity files under `src/main/java/com/streetify/entity/`<br>`Vehicle.java`, `UserRole.java`, `User.java`, `TripStatus.java`, `Trip.java`, `Review.java`, `PaymentStatus.java`, `Payment.java`, `Passenger.java`, `DriverVerificationStatus.java`, `DriverDocument.java`, `Driver.java`, `DocumentStatus.java`, `DisputeTicket.java`, `DisputeStatus.java`, `AuditLog.java` |
| **DTOs** | All 19 DTO files under `src/main/java/com/streetify/dto/`<br>`UserRegistrationDTO.java`, `TripStatusUpdateDTO.java`, `TripResponseDTO.java`, `TripRequestDTO.java`, `TelemetryDTO.java`, `DriverRegistrationDTO.java`, `DisputeSubmitDTO.java`, `DisputeResolveDTO.java`, `AvailableTripDTO.java`, `AuthResponseDTO.java`, `SuspendUserDTO.java`, `ReviewSubmitDTO.java`, `ReviewResponseDTO.java`, `PaymentRequestDTO.java`, `PaymentReceiptDTO.java`, `LoginDTO.java`, `FareEstimateDTO.java` |
| **Controllers** | All 19 controller files under `src/main/java/com/streetify/controller/`<br>`TripTrackingController.java`, `TripController.java`, `ReviewController.java`, `PaymentController.java`, `ModuleAdminController.java`, `DriverController.java`, `DisputeController.java`, `AuthController.java`, `AdminController.java` |
| **Services** | All 7 service files under `src/main/java/com/streetify/service/`<br>`TripTrackingService.java`, `SupportService.java`, `ReviewService.java`, `PaymentService.java`, `DriverVerificationService.java`, `DispatchService.java`, `AuthService.java`, `AdminGovernanceService.java` |
| **Security** | All 3 security files under `src/main/java/com/streetify/security/`<br>`JwtUtil.java`, `JwtAuthFilter.java`, `AppUserDetailsService.java` |
| **Config** | All 3 config files under `src/main/java/com/streetify/config/`<br>`SecurityConfig.java`, `GlobalExceptionHandler.java`, `WebSocketConfig.java` |
| **DAOs** | All 11 DAO files under `src/main/java/com/streetify/dao/`<br>`AuditLogDAO.java`, `DriverDocumentDAO.java`, `DriverDAO.java`, `DisputeDAO.java`, `PaymentDAO.java`, `PassengerDAO.java`, `TripDAO.java`, `ReviewDAO.java`, `UserDAO.java`, `VehicleDAO.java` |
| **Resources** | `src/main/resources/application.properties`, `seed.sql` |

### **Database - `database/`**
| Files | Description |
|---|---|
| `01_schema_ddl.sql` | Complete DDL tables, foreign keys & indexes |
| `02_seed_data.sql` | Master seed script with valid BCrypt passwords |
| `03_team_member_queries.sql` | Individual queries per team member for viva demo |
| `04_utility_test_scripts.sql` | Testing shortcuts, state modifiers & table counts |
| `06_stored_procedure.sql` | Stored procedures |
| `07_trigger.sql` | Database triggers |
| `README.md` | Database setup instructions |
| `generate_viva_word_doc.py` | Python script to generate viva docs |

### **Documentation - `docs/`**
| Files | Description |
|---|---|
| `UCD_Group24_.html` | UCD diagram HTML |
| `server_commands/Backend_server/Backend_codes.txt` | Backend code reference |
| `server_commands/Frontend_vite_server/frontend_codes.txt` | Frontend code reference |
| `Batch1_2026-Y2-S1-KU-24_(Group_24)_Usecase_Updated.pdf` | Updated use case |
| `Batch1_2026-Y2-S1-KU-24_(Group_24)_Sequence.pdf` | Sequence diagram |
| `Batch1_2026-Y2-S1-KU-24_(Group_24)_Activity.pdf` | Activity diagram |
| `2026-Y2-S1-KU-24_Proposal_Report.pdf` | Project proposal report |
| `2026-Y2-S1-KU-24_Lab02_SE.pdf` | Lab session 02 |
| `2026-Y2-S1-KU-24 (Group 24)_Assignment01_Requirements.pdf` | Assignment 01 requirements |
| `2026-Y2-S1-KU-24 (Group 24)_Assignment01_EER.pdf` | Assignment 01 EER diagram |
| Various `.docx` files | Assignment reports and guides |

### **Root Level**
| Files | Description |
|---|---|
| `.gitignore` | Root-level git ignore rules |
| `README.md` | Project documentation |
| `package.json` | Root npm scripts (dev, frontend, backend, build) |
| `build_report.py`, `generate_report.py`, `gen_c_d.py`, `gen_e_g.py` | Report generation scripts |
| `2026-Y2-S1-KU-24_Assignment01_Part02.docx` | Assignment submission |
| `Ai_docs/` | DDD assignment reports |

---

## ❌ FILES TO EXCLUDE (Do NOT submit)

### **Build Outputs**
- `streetify-frontend/dist/` (React build output)
- `streetify-backend/target/` (Java JAR build output)
- `streetify-frontend/dist-ssr/` (if exists)
- Any `*.class` files
- Any `*.jar` files

### **Dependencies**
- `node_modules/` (entire directory in both frontends)
- Any `.local` config files
- `.npm/` directory

### **IDE/Project Specific**
- `.idea/` (IntelliJ IDEA)
- `.vscode/` (VS Code settings - should have its own gitignore)
- `.vs/` directory
- `*.suo`, `*.user`, `*.userosscache` files
- `*.iml`, `*.ipr`, `*.iws` files
- `.classpath`, `.settings/`

### **OS Metadata**
- `.DS_Store`
- `Thumbs.db`
- `desktop.ini`

### **Logs & Temp**
- `*.log` files
- `logs/` directory
- `temp/` and `tmp/` directories

### **Database Temp Files**
- `~$reetify_DB_Viva_Master_Guide.docx` (temp lock file)

### **Generated/Derived Files**
- `streetify-backend/HashGen.class` (compiled class)
- `streetify-backend/maven.zip` (archive)
- `streetify-frontend/scratch_panels.tsx` (scratch file)
- `streetify-frontend/add_bg.py`, `add_bg2.py` (background scripts)

---

## 📊 Summary Statistics

| Category | Include | Exclude |
|---|---|---|
| **Frontend Source** | ~50 JavaScript/TypeScript files | `dist/`, `node_modules/` |
| **Backend Java** | ~79 Java source files | `target/`, `*.class`, `*.jar` |
| **Database SQL** | 6 SQL files + 1 Python script | Temp/docx lock files |
| **Documentation** | ~15 PDFs/HTMLs/Docs | Coursework duplicates |
| **Root Config** | 5 files | IDE files, logs |

---

## 🚀 Quick Setup After Clone

```bash
# 1. Install frontend dependencies
cd streetify-frontend
npm install

# 2. Install backend (Maven)
cd streetify-backend
./mvnw spring-boot:run  # or mvnw.cmd on Windows

# 3. Set up database
# - Ensure SQL Server is running
# - Create database: CREATE DATABASE streetify_db;
# - Run: database/02_seed_data.sql

# 4. Start the app
# Method A: Separate terminals
#   Backend: cd streetify-backend && .\mvnw.cmd spring-boot:run
#   Frontend: cd streetify-frontend && npm run dev

# Method B: From root (if configured)
#   npm run dev  # starts both simultaneously
```

---

## ⚠️ Known Issues / Missing Files

1. **`streetify-backend/package.json`** - Does NOT exist (backend uses Maven/Maven Wrapper, not npm)
2. **Frontend `dist/`** - Currently contains built files; these will be regenerated on `npm run build`
3. **Database driver** - `application.properties` references MSSQL; ensure JDBC driver is available
4. **Figma-specific configs** - `.figma/make/` directory contains Figma Make platform configs (keep if submitting Figma-linked repo)
5. **VSC/Idea workspace files** - `.idea/` and `.vscode/` contain local config; exclude from repo or add `.gitignore`

---
*Generated from backup at `E:\2Y1S\2Y1S_Projects\SE_project\Streetify\Streetify_Backup` on 2026-10-06*