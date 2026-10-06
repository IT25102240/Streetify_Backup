import os
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH

def add_heading(doc, text, level):
    heading = doc.add_heading(text, level=level)
    for run in heading.runs:
        run.font.name = 'Arial'

def add_bold_paragraph(doc, text):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.bold = True
    run.font.name = 'Arial'

def add_table(doc, headers, data):
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = 'Table Grid'
    hdr_cells = table.rows[0].cells
    for i, header in enumerate(headers):
        hdr_cells[i].text = header
        hdr_cells[i].paragraphs[0].runs[0].bold = True
        hdr_cells[i].paragraphs[0].runs[0].font.name = 'Arial'
        # Optional: set background color to light gray for header
        
    for row_data in data:
        row_cells = table.add_row().cells
        for i, cell_data in enumerate(row_data):
            row_cells[i].text = str(cell_data)
            row_cells[i].paragraphs[0].runs[0].font.name = 'Arial'
    
    doc.add_paragraph() # Spacing

doc = Document()

# Title
title = doc.add_heading('Streetify — Complete File Ownership & Commit Guide', 0)
title.alignment = WD_ALIGN_PARAGRAPH.CENTER

doc.add_heading('Streetify_Backup → Streetify_origin migration', level=2)
p = doc.add_paragraph()
run = p.add_run('Rule: Clone Streetify_Backup, then each member commits only their listed files to Streetify_origin.')
run.bold = True
run.font.color.rgb = RGBColor(255, 0, 0) # Red emphasis

doc.add_page_break()

# ----------------- LAHIRU -----------------
add_heading(doc, '👤 LAHIRU (IT25102208) — User Account & Verification Module', level=1)

add_heading(doc, 'Backend — Java', level=2)
lahiru_backend = [
    ('AuthService.java', 'streetify-backend/src/main/java/com/streetify/service/'),
    ('DriverVerificationService.java', 'streetify-backend/src/main/java/com/streetify/service/'),
    ('AuthController.java', 'streetify-backend/src/main/java/com/streetify/controller/'),
    ('DriverController.java', 'streetify-backend/src/main/java/com/streetify/controller/'),
    ('User.java', 'streetify-backend/src/main/java/com/streetify/entity/'),
    ('Driver.java', 'streetify-backend/src/main/java/com/streetify/entity/'),
    ('Passenger.java', 'streetify-backend/src/main/java/com/streetify/entity/'),
    ('DriverDocument.java', 'streetify-backend/src/main/java/com/streetify/entity/'),
    ('UserRole.java', 'streetify-backend/src/main/java/com/streetify/entity/'),
    ('DocumentStatus.java', 'streetify-backend/src/main/java/com/streetify/entity/'),
    ('DriverVerificationStatus.java', 'streetify-backend/src/main/java/com/streetify/entity/'),
    ('UserDAO.java', 'streetify-backend/src/main/java/com/streetify/dao/'),
    ('PassengerDAO.java', 'streetify-backend/src/main/java/com/streetify/dao/'),
    ('DriverDAO.java', 'streetify-backend/src/main/java/com/streetify/dao/'),
    ('DriverDocumentDAO.java', 'streetify-backend/src/main/java/com/streetify/dao/'),
    ('VehicleDAO.java', 'streetify-backend/src/main/java/com/streetify/dao/'),
    ('LoginDTO.java', 'streetify-backend/src/main/java/com/streetify/dto/'),
    ('UserRegistrationDTO.java', 'streetify-backend/src/main/java/com/streetify/dto/'),
    ('DriverRegistrationDTO.java', 'streetify-backend/src/main/java/com/streetify/dto/'),
    ('AuthResponseDTO.java', 'streetify-backend/src/main/java/com/streetify/dto/'),
    ('AppUserDetailsService.java', 'streetify-backend/src/main/java/com/streetify/security/'),
    ('JwtUtil.java', 'streetify-backend/src/main/java/com/streetify/security/'),
    ('JwtAuthFilter.java', 'streetify-backend/src/main/java/com/streetify/security/'),
    ('SecurityConfig.java', 'streetify-backend/src/main/java/com/streetify/config/')
]
add_table(doc, ['File', 'Package Path'], lahiru_backend)

add_heading(doc, 'Backend — Design Pattern (Observer — ConcreteObservers)', level=2)
lahiru_pattern = [
    ('VerificationObserver.java', 'streetify-backend/src/main/java/com/streetify/observer/'),
    ('DriverVerificationObserver.java', 'streetify-backend/src/main/java/com/streetify/observer/'),
    ('AuditLogVerificationObserver.java', 'streetify-backend/src/main/java/com/streetify/observer/'),
    ('VerificationEventPublisher.java', 'streetify-backend/src/main/java/com/streetify/observer/')
]
add_table(doc, ['File', 'Package Path'], lahiru_pattern)

add_heading(doc, 'Frontend — TypeScript / TSX', level=2)
lahiru_frontend = [
    ('Login.tsx', 'streetify-frontend/src/screens/'),
    ('Profile.tsx', 'streetify-frontend/src/screens/'),
    ('LahiruUserDashboard.tsx', 'streetify-frontend/src/components/'),
    ('validators.ts', 'streetify-frontend/src/utils/'),
    ('storage.ts', 'streetify-frontend/src/utils/')
]
add_table(doc, ['File', 'Path'], lahiru_frontend)

add_heading(doc, 'Database Queries', level=2)
lahiru_db = [
    ('database/01_schema_ddl.sql', 'users, drivers, passengers, driver_documents, vehicles tables'),
    ('database/02_seed_data.sql', 'User & driver seed rows'),
    ('database/03_team_member_queries.sql', "Lahiru's section")
]
add_table(doc, ['File', 'Notes'], lahiru_db)
doc.add_page_break()

# ----------------- CHANUKA -----------------
add_heading(doc, '👤 CHANUKA (IT25102207) — Ride Booking & Dispatch Engine', level=1)

add_heading(doc, 'Backend — Java', level=2)
chanuka_backend = [
    ('DispatchService.java', 'streetify-backend/src/main/java/com/streetify/service/'),
    ('TripController.java', 'streetify-backend/src/main/java/com/streetify/controller/'),
    ('Trip.java', 'streetify-backend/src/main/java/com/streetify/entity/'),
    ('TripStatus.java', 'streetify-backend/src/main/java/com/streetify/entity/'),
    ('Vehicle.java', 'streetify-backend/src/main/java/com/streetify/entity/'),
    ('TripDAO.java', 'streetify-backend/src/main/java/com/streetify/dao/'),
    ('TripRequestDTO.java', 'streetify-backend/src/main/java/com/streetify/dto/'),
    ('TripResponseDTO.java', 'streetify-backend/src/main/java/com/streetify/dto/'),
    ('FareEstimateDTO.java', 'streetify-backend/src/main/java/com/streetify/dto/'),
    ('AvailableTripDTO.java', 'streetify-backend/src/main/java/com/streetify/dto/')
]
add_table(doc, ['File', 'Package Path'], chanuka_backend)

add_heading(doc, 'Backend — Design Pattern (Factory — RideTypeFactory)', level=2)
chanuka_pattern = [
    ('RideTypeConfig.java', 'streetify-backend/src/main/java/com/streetify/service/ride/'),
    ('TukRideConfig.java', 'streetify-backend/src/main/java/com/streetify/service/ride/'),
    ('StandardRideConfig.java', 'streetify-backend/src/main/java/com/streetify/service/ride/'),
    ('XlRideConfig.java', 'streetify-backend/src/main/java/com/streetify/service/ride/'),
    ('MotoRideConfig.java', 'streetify-backend/src/main/java/com/streetify/service/ride/'),
    ('RideTypeFactory.java', 'streetify-backend/src/main/java/com/streetify/service/ride/')
]
add_table(doc, ['File', 'Package Path'], chanuka_pattern)

add_heading(doc, 'Frontend — TypeScript / TSX', level=2)
chanuka_frontend = [
    ('Booking.tsx', 'streetify-frontend/src/screens/'),
    ('BranchKiosk.tsx', 'streetify-frontend/src/screens/'),
    ('ChanukaBookingDashboard.tsx', 'streetify-frontend/src/components/'),
    ('VehicleTypeSelector.tsx', 'streetify-frontend/src/components/'),
    ('fareCalculationService.ts', 'streetify-frontend/src/services/'),
    ('useGeolocation.ts', 'streetify-frontend/src/hooks/')
]
add_table(doc, ['File', 'Path'], chanuka_frontend)

add_heading(doc, 'Database Queries', level=2)
chanuka_db = [
    ('database/01_schema_ddl.sql', 'trips, vehicles tables'),
    ('database/02_seed_data.sql', 'Trip seed rows'),
    ('database/03_team_member_queries.sql', "Chanuka's section")
]
add_table(doc, ['File', 'Notes'], chanuka_db)
doc.add_page_break()


# ----------------- THARINDU -----------------
add_heading(doc, '👤 THARINDU (IT25102241) — Trip Progress & Telemetry', level=1)

add_heading(doc, 'Backend — Java', level=2)
tharindu_backend = [
    ('TripTrackingService.java', 'streetify-backend/src/main/java/com/streetify/service/'),
    ('TripTrackingController.java', 'streetify-backend/src/main/java/com/streetify/controller/'),
    ('TelemetryDTO.java', 'streetify-backend/src/main/java/com/streetify/dto/'),
    ('TripStatusUpdateDTO.java', 'streetify-backend/src/main/java/com/streetify/dto/'),
    ('WebSocketConfig.java', 'streetify-backend/src/main/java/com/streetify/config/')
]
add_table(doc, ['File', 'Package Path'], tharindu_backend)

add_heading(doc, 'Backend — Design Pattern (Observer — ConcreteSubject)', level=2)
tharindu_pattern = [
    ('TripStatusObserver.java', 'streetify-backend/src/main/java/com/streetify/observer/'),
    ('TripEventSubject.java', 'streetify-backend/src/main/java/com/streetify/observer/'),
    ('TripEventPublisher.java', 'streetify-backend/src/main/java/com/streetify/observer/'),
    ('WebSocketTripObserver.java', 'streetify-backend/src/main/java/com/streetify/observer/')
]
add_table(doc, ['File', 'Package Path'], tharindu_pattern)

add_heading(doc, 'Frontend — TypeScript / TSX', level=2)
tharindu_frontend = [
    ('Driver.tsx', 'streetify-frontend/src/screens/'),
    ('demoDriverService.ts', 'streetify-frontend/src/services/'),
    ('tripSyncService.ts', 'streetify-frontend/src/services/'),
    ('NotificationCenter.tsx', 'streetify-frontend/src/components/'),
    ('SystemStatusIndicator.tsx', 'streetify-frontend/src/components/')
]
add_table(doc, ['File', 'Path'], tharindu_frontend)

add_heading(doc, 'Database Queries', level=2)
tharindu_db = [
    ('database/03_team_member_queries.sql', "Tharindu's section"),
    ('database/06_stored_procedure.sql', 'Stored procedures'),
    ('database/07_trigger.sql', 'DB triggers')
]
add_table(doc, ['File', 'Notes'], tharindu_db)
doc.add_page_break()


# ----------------- DAHAM -----------------
add_heading(doc, '👤 DAHAM (IT25102225) — Payment & Ledger Management', level=1)

add_heading(doc, 'Backend — Java', level=2)
daham_backend = [
    ('PaymentService.java', 'streetify-backend/src/main/java/com/streetify/service/'),
    ('PaymentController.java', 'streetify-backend/src/main/java/com/streetify/controller/'),
    ('Payment.java', 'streetify-backend/src/main/java/com/streetify/entity/'),
    ('PaymentStatus.java', 'streetify-backend/src/main/java/com/streetify/entity/'),
    ('PaymentDAO.java', 'streetify-backend/src/main/java/com/streetify/dao/'),
    ('PaymentRequestDTO.java', 'streetify-backend/src/main/java/com/streetify/dto/'),
    ('PaymentReceiptDTO.java', 'streetify-backend/src/main/java/com/streetify/dto/')
]
add_table(doc, ['File', 'Package Path'], daham_backend)

add_heading(doc, 'Backend — Design Pattern (Strategy — PaymentSettlement)', level=2)
daham_pattern = [
    ('PaymentSettlementStrategy.java', 'streetify-backend/src/main/java/com/streetify/service/payment/'),
    ('CashSettlementStrategy.java', 'streetify-backend/src/main/java/com/streetify/service/payment/'),
    ('WalletSettlementStrategy.java', 'streetify-backend/src/main/java/com/streetify/service/payment/'),
    ('CardSettlementStrategy.java', 'streetify-backend/src/main/java/com/streetify/service/payment/'),
    ('PaymentStrategyFactory.java', 'streetify-backend/src/main/java/com/streetify/service/payment/')
]
add_table(doc, ['File', 'Package Path'], daham_pattern)

add_heading(doc, 'Frontend — TypeScript / TSX', level=2)
daham_frontend = [
    ('Payment.tsx', 'streetify-frontend/src/screens/'),
    ('History.tsx', 'streetify-frontend/src/screens/'),
    ('DahamPaymentDashboard.tsx', 'streetify-frontend/src/components/'),
    ('ReceiptDisplay.tsx', 'streetify-frontend/src/components/'),
    ('notificationService.ts', 'streetify-frontend/src/services/')
]
add_table(doc, ['File', 'Path'], daham_frontend)

add_heading(doc, 'Database Queries', level=2)
daham_db = [
    ('database/01_schema_ddl.sql', 'payments table'),
    ('database/02_seed_data.sql', 'Payment seed rows'),
    ('database/03_team_member_queries.sql', "Daham's section")
]
add_table(doc, ['File', 'Notes'], daham_db)
doc.add_page_break()


# ----------------- MITHUN -----------------
add_heading(doc, '👤 MITHUN (IT25102193) — Review & Dispute Form', level=1)

add_heading(doc, 'Backend — Java', level=2)
mithun_backend = [
    ('ReviewService.java', 'streetify-backend/src/main/java/com/streetify/service/'),
    ('SupportService.java', 'streetify-backend/src/main/java/com/streetify/service/'),
    ('ReviewController.java', 'streetify-backend/src/main/java/com/streetify/controller/'),
    ('DisputeController.java', 'streetify-backend/src/main/java/com/streetify/controller/'),
    ('Review.java', 'streetify-backend/src/main/java/com/streetify/entity/'),
    ('DisputeTicket.java', 'streetify-backend/src/main/java/com/streetify/entity/'),
    ('DisputeStatus.java', 'streetify-backend/src/main/java/com/streetify/entity/'),
    ('ReviewDAO.java', 'streetify-backend/src/main/java/com/streetify/dao/'),
    ('DisputeDAO.java', 'streetify-backend/src/main/java/com/streetify/dao/'),
    ('ReviewSubmitDTO.java', 'streetify-backend/src/main/java/com/streetify/dto/'),
    ('ReviewResponseDTO.java', 'streetify-backend/src/main/java/com/streetify/dto/'),
    ('DisputeSubmitDTO.java', 'streetify-backend/src/main/java/com/streetify/dto/'),
    ('DisputeResolveDTO.java', 'streetify-backend/src/main/java/com/streetify/dto/')
]
add_table(doc, ['File', 'Package Path'], mithun_backend)

add_heading(doc, 'Backend — Design Pattern (Decorator — DisputeView chain)', level=2)
mithun_pattern = [
    ('DisputeView.java', 'streetify-backend/src/main/java/com/streetify/decorator/'),
    ('BasicDisputeView.java', 'streetify-backend/src/main/java/com/streetify/decorator/'),
    ('DisputeViewDecorator.java', 'streetify-backend/src/main/java/com/streetify/decorator/'),
    ('EscalationDecorator.java', 'streetify-backend/src/main/java/com/streetify/decorator/'),
    ('RefundNoteDecorator.java', 'streetify-backend/src/main/java/com/streetify/decorator/'),
    ('AdminResponseDecorator.java', 'streetify-backend/src/main/java/com/streetify/decorator/'),
    ('DisputeDecoratorDemo.java', 'streetify-backend/src/main/java/com/streetify/decorator/')
]
add_table(doc, ['File', 'Package Path'], mithun_pattern)

add_heading(doc, 'Frontend — TypeScript / TSX', level=2)
mithun_frontend = [
    ('Review.tsx', 'streetify-frontend/src/screens/'),
    ('Support.tsx', 'streetify-frontend/src/screens/')
]
add_table(doc, ['File', 'Path'], mithun_frontend)

add_heading(doc, 'Database Queries', level=2)
mithun_db = [
    ('database/01_schema_ddl.sql', 'reviews, dispute_tickets tables'),
    ('database/02_seed_data.sql', 'Review & dispute seed rows'),
    ('database/03_team_member_queries.sql', "Mithun's section")
]
add_table(doc, ['File', 'Notes'], mithun_db)
doc.add_page_break()


# ----------------- VIDURA -----------------
add_heading(doc, '👤 VIDURA (IT25102240) — Admin Governance & System Control', level=1)

add_heading(doc, 'Backend — Java', level=2)
vidura_backend = [
    ('AdminGovernanceService.java', 'streetify-backend/src/main/java/com/streetify/service/'),
    ('AdminController.java', 'streetify-backend/src/main/java/com/streetify/controller/'),
    ('ModuleAdminController.java', 'streetify-backend/src/main/java/com/streetify/controller/'),
    ('AuditLog.java', 'streetify-backend/src/main/java/com/streetify/entity/'),
    ('AuditLogDAO.java', 'streetify-backend/src/main/java/com/streetify/dao/'),
    ('SuspendUserDTO.java', 'streetify-backend/src/main/java/com/streetify/dto/'),
    ('GlobalExceptionHandler.java', 'streetify-backend/src/main/java/com/streetify/config/'),
    ('StreetifyApplication.java', 'streetify-backend/src/main/java/com/streetify/'),
    ('application.properties', 'streetify-backend/src/main/resources/'),
    ('pom.xml', 'streetify-backend/')
]
add_table(doc, ['File', 'Package Path'], vidura_backend)

add_heading(doc, 'Backend — Design Pattern (Factory — AuditLogFactory)', level=2)
vidura_pattern = [
    ('AdminActionType.java', 'streetify-backend/src/main/java/com/streetify/factory/'),
    ('AuditLogFactory.java', 'streetify-backend/src/main/java/com/streetify/factory/')
]
add_table(doc, ['File', 'Package Path'], vidura_pattern)

add_heading(doc, 'Frontend — TypeScript / TSX', level=2)
vidura_frontend = [
    ('Admin.tsx', 'streetify-frontend/src/screens/'),
    ('ModuleExportCard.tsx', 'streetify-frontend/src/components/'),
    ('DemoSwitcher.tsx', 'streetify-frontend/src/components/'),
    ('Footer.tsx', 'streetify-frontend/src/components/'),
    ('App.tsx', 'streetify-frontend/src/'),
    ('main.tsx', 'streetify-frontend/src/'),
    ('index.css', 'streetify-frontend/src/'),
    ('index.html', 'streetify-frontend/'),
    ('vite.config.ts', 'streetify-frontend/'),
    ('tsconfig.json', 'streetify-frontend/'),
    ('package.json', 'streetify-frontend/')
]
add_table(doc, ['File', 'Path'], vidura_frontend)

add_heading(doc, 'Database — Full SQL Layer', level=2)
vidura_db = [
    ('database/01_schema_ddl.sql', 'Full schema — ALL tables'),
    ('database/02_seed_data.sql', 'Seed data — ALL modules'),
    ('database/03_team_member_queries.sql', "Vidura's admin queries section"),
    ('database/04_utility_test_scripts.sql', 'Test & utility scripts'),
    ('database/06_stored_procedure.sql', 'Stored procedures'),
    ('database/07_trigger.sql', 'DB triggers'),
    ('database/README.md', 'DB documentation')
]
add_table(doc, ['File', 'Notes'], vidura_db)
doc.add_page_break()


# ----------------- SHARED -----------------
add_heading(doc, '🤝 Shared / Infrastructure (Commit once — first push by Vidura)', level=1)
shared_files = [
    ('apiClient.ts', 'streetify-frontend/src/api/'),
    ('.gitignore', 'streetify-frontend/'),
    ('pnpm-lock.yaml', 'streetify-frontend/'),
    ('HashGen.java', 'streetify-backend/'),
    ('MODULE_ASSIGNMENTS_BY_MEMBER.md', 'Streetify_Backup/')
]
add_table(doc, ['File', 'Path'], shared_files)

doc.add_page_break()

# ----------------- GIT STRATEGY -----------------
add_heading(doc, '📋 Git Commit Strategy', level=1)
git_strategy = """# Step 1 — Clone Streetify_Backup locally
git clone <Streetify_Backup_URL>

# Step 2 — Add Streetify_origin as the push remote
git remote add origin <Streetify_origin_URL>

# Step 3 — Each member creates their own feature branch
git checkout -b feature/lahiru-user-auth        # Lahiru
git checkout -b feature/chanuka-ride-booking    # Chanuka
git checkout -b feature/tharindu-trip-telemetry # Tharindu
git checkout -b feature/daham-payment           # Daham
git checkout -b feature/mithun-review-dispute   # Mithun
git checkout -b feature/vidura-admin-system     # Vidura

# Step 4 — Stage ONLY your files (example: Daham)
git add streetify-backend/src/main/java/com/streetify/service/PaymentService.java
git add streetify-backend/src/main/java/com/streetify/service/payment/
git add streetify-backend/src/main/java/com/streetify/controller/PaymentController.java
git add streetify-frontend/src/screens/Payment.tsx
git add streetify-frontend/src/screens/History.tsx

# Step 5 — Commit with ID in message
git commit -m "feat(payment): Strategy pattern + PaymentService - Daham IT25102225"

# Step 6 — Push & open Pull Request → merge into main
git push origin feature/daham-payment"""

# adding as code block
p = doc.add_paragraph(git_strategy)
p.style = 'No Spacing'
p.runs[0].font.name = 'Courier New'

doc.add_page_break()

# ----------------- DESIGN PATTERN QUICK REF -----------------
add_heading(doc, '🧩 Design Pattern Files — Complete Quick Reference', level=1)
design_patterns = [
    ('com.streetify.observer', 'Observer (Subject)', 'TripStatusObserver, TripEventSubject, TripEventPublisher, WebSocketTripObserver', 'Tharindu'),
    ('com.streetify.observer', 'Observer (Observers)', 'VerificationObserver, DriverVerificationObserver, AuditLogVerificationObserver, VerificationEventPublisher', 'Lahiru'),
    ('com.streetify.service.ride', 'Factory', 'RideTypeConfig, TukRideConfig, StandardRideConfig, XlRideConfig, MotoRideConfig, RideTypeFactory', 'Chanuka'),
    ('com.streetify.service.payment', 'Strategy', 'PaymentSettlementStrategy, CashSettlementStrategy, WalletSettlementStrategy, CardSettlementStrategy, PaymentStrategyFactory', 'Daham'),
    ('com.streetify.decorator', 'Decorator', 'DisputeView, BasicDisputeView, DisputeViewDecorator, EscalationDecorator, RefundNoteDecorator, AdminResponseDecorator, DisputeDecoratorDemo', 'Mithun'),
    ('com.streetify.factory', 'Factory', 'AdminActionType, AuditLogFactory', 'Vidura')
]
add_table(doc, ['Package', 'Pattern', 'Files', 'Member'], design_patterns)

# Save the document
doc.save('Streetify_File_Ownership_Guide.docx')
print("Document saved successfully to Streetify_File_Ownership_Guide.docx")
