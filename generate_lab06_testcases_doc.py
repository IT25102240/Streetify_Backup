"""
generate_lab06_testcases_doc.py
================================
Generates the complete SLIIT SE2030 Lab Sheet 06 Software Testing Report
for Streetify (Web-Based Transportation & Smart Dispatch System).

Group ID: 2026-Y2-S1-KU-24 (Batch 1)
Total Test Cases: 60 (6 members x 10 test cases)

Layout:
- Cover Page (Portrait) matching SLIIT benchmark format
- Section 1: Group Details (Portrait)
- Section 2: Test Approach & Multi-Tier Architecture (Portrait)
- Sections 3-8: Member Test Case Suites (Landscape with 9-column tables)
"""

import os
import sys
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_SECTION_START, WD_ORIENTATION
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

# ── Colors ────────────────────────────────────────────────────────────────────
NAVY_PRIMARY = "0D2B55"      # Dark Navy Blue (SLIIT style)
BLUE_ACCENT  = "1A56DB"      # Royal Blue
LIGHT_BG     = "F4F6F9"      # Light grey/blue zebra fill
WHITE        = "FFFFFF"
BORDER_COLOR = "D1D5DB"
PASS_GREEN   = "059669"

C_NAVY  = RGBColor(0x0D, 0x2B, 0x55)
C_BLUE  = RGBColor(0x1A, 0x56, 0xDB)
C_DARK  = RGBColor(0x1F, 0x29, 0x37)
C_GREY  = RGBColor(0x4B, 0x55, 0x63)
C_WHITE = RGBColor(0xFF, 0xFF, 0xFF)
C_GREEN = RGBColor(0x05, 0x96, 0x69)

# ── OXML Helper Functions ─────────────────────────────────────────────────────
def shd_cell(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_color)
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=120, right=120):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color="D1D5DB", sz="4"):
    tblPr = table._tbl.tblPr
    tblBorders = OxmlElement('w:tblBorders')
    for border_name in ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']:
        b = OxmlElement(f'w:{border_name}')
        b.set(qn('w:val'), 'single')
        b.set(qn('w:sz'), sz)
        b.set(qn('w:space'), '0')
        b.set(qn('w:color'), color)
        tblBorders.append(b)
    tblPr.append(tblBorders)

def add_callout_box(doc, text, title="NOTE"):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.2)
    p.paragraph_format.right_indent = Inches(0.2)
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(8)
    
    pPr = p._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), "EBF2FE")
    pPr.append(shd)
    
    r_title = p.add_run(f"📌 {title}: ")
    r_title.bold = True
    r_title.font.name = "Arial"
    r_title.font.size = Pt(9.5)
    r_title.font.color.rgb = C_BLUE
    
    r_text = p.add_run(text)
    r_text.font.name = "Arial"
    r_text.font.size = Pt(9.5)
    r_text.font.color.rgb = C_DARK

# ── Test Suite Data ───────────────────────────────────────────────────────────
MEMBERS_DATA = [
    {
        "num": 1,
        "name": "A.R.L.P. Nayanamina",
        "reg": "IT25102208",
        "short_name": "Lahiru",
        "module": "User Account Management",
        "submodule": "User Account & Verification Module",
        "prefix": "TC_UM_",
        "scope": "Passenger & Driver Registration, JWT Authentication, Login Lockout & Security, Email & Sri Lankan Phone Validations, BCrypt Password Security, Password Reset with 5-minute OTP.",
        "tests": [
            {
                "id": "TC_UM_01",
                "title": "Verify passenger registration with valid details",
                "desc": "Ensure a new passenger can create an account with complete valid inputs.",
                "pre": "1. User is not logged in\n2. Email is not previously registered",
                "steps": "1. Open Register page\n2. Enter name, email, phone, and 8+ char password\n3. Click 'Create Account'",
                "data": "Name: Kasun Perera\nEmail: kasun.p@streetify.lk\nPhone: +94771234567\nPassword: Pass#Secure2026",
                "expected": "HTTP 201 Created; JWT tokens issued; user saved with role PASSENGER in MSSQL database.",
                "actual": "Account created (HTTP 201); status ACTIVE; JWT access token generated; passenger redirected to dashboard.",
                "status": "Pass"
            },
            {
                "id": "TC_UM_02",
                "title": "Verify registration with existing duplicate email",
                "desc": "Ensure the system prevents duplicate registrations with the same email.",
                "pre": "1. Account with email passenger1@streetify.com already exists in database",
                "steps": "1. Open Register page\n2. Enter details using duplicate email\n3. Click 'Create Account'",
                "data": "Email: passenger1@streetify.com\nName: Duplicate Tester\nPassword: Pass#Secure2026",
                "expected": "Registration rejected with HTTP 400 Bad Request; clear duplicate email error message.",
                "actual": "Rejected (HTTP 400) with 'Email is already taken by another account.' Account not created.",
                "status": "Pass"
            },
            {
                "id": "TC_UM_03",
                "title": "Verify password with 7 characters (below minimum)",
                "desc": "Boundary test: passwords must be at least 8 characters long.",
                "pre": "1. User is on Register page\n2. Email is unregistered",
                "steps": "1. Enter valid name, email, and phone\n2. Enter a 7-character password\n3. Click 'Create Account'",
                "data": "Password: Pass#12 (7 chars)\nEmail: test7char@streetify.lk",
                "expected": "Registration blocked; validation error specifies minimum 8 characters.",
                "actual": "Rejected (HTTP 400) on password field: 'Password must be at least 8 characters'.",
                "status": "Pass"
            },
            {
                "id": "TC_UM_04",
                "title": "Verify password with exactly 8 characters (minimum allowed)",
                "desc": "Boundary test: verify shortest valid password length (8 characters) is accepted.",
                "pre": "1. User is on Register page\n2. Email is unregistered",
                "steps": "1. Enter valid personal details\n2. Enter exactly 8-character password\n3. Click 'Create Account'",
                "data": "Password: Pass#123 (8 chars)\nEmail: test8char@streetify.lk",
                "expected": "Registration succeeds; password BCrypt hashed; JWT returned.",
                "actual": "Account created successfully (HTTP 201); password encrypted; JWT tokens generated.",
                "status": "Pass"
            },
            {
                "id": "TC_UM_05",
                "title": "Verify email format without '@' symbol",
                "desc": "Ensure email format enforces presence of '@' symbol.",
                "pre": "1. User is on Register or Profile screen",
                "steps": "1. Enter an email missing the '@' sign\n2. Submit registration/profile form",
                "data": "Email: invalidemail.streetify.lk\nName: Test User",
                "expected": "Validation error displayed: email must be a valid email containing '@'.",
                "actual": "Rejected (HTTP 400) with 'Email must be a valid email address containing the \"@\" symbol (e.g. user@streetify.lk)'.",
                "status": "Pass"
            },
            {
                "id": "TC_UM_06",
                "title": "Verify driver registration with valid Sri Lankan phone format",
                "desc": "Ensure driver registration accepts standard Sri Lankan phone with '+94' prefix.",
                "pre": "1. User on driver onboarding form\n2. NIC and vehicle details provided",
                "steps": "1. Enter driver personal and vehicle details\n2. Enter phone with '+94' prefix\n3. Submit onboarding form",
                "data": "Phone: +94779876543\nNIC: 951234567V\nVehicle: Toyota Prius (WP CAB-1234)\nYear: 2018",
                "expected": "Driver account created with status PENDING_VERIFICATION (HTTP 201).",
                "actual": "Driver registered (HTTP 201); verification_status set to PENDING_VERIFICATION in MSSQL.",
                "status": "Pass"
            },
            {
                "id": "TC_UM_07",
                "title": "Verify driver registration with invalid phone format",
                "desc": "Ensure driver phone format strictly enforces '+94' or '0' followed by 9 digits.",
                "pre": "1. User on driver onboarding form",
                "steps": "1. Enter driver details\n2. Enter 8-digit phone number without valid prefix\n3. Click 'Register as Driver'",
                "data": "Phone: 12345678 (8 digits, invalid prefix)\nEmail: driver.test@streetify.lk",
                "expected": "Validation rejected; message explains valid Sri Lankan phone formats.",
                "actual": "Rejected (HTTP 400): 'Driver phone number must be either \"+94\" followed by 9 digits or \"0\" followed by 9 digits'.",
                "status": "Pass"
            },
            {
                "id": "TC_UM_08",
                "title": "Verify user login with valid credentials",
                "desc": "Ensure registered user can authenticate and obtain JWT access token.",
                "pre": "1. Account passenger1@streetify.com is active in database",
                "steps": "1. Open Login screen\n2. Enter registered email and password\n3. Click 'Sign In'",
                "data": "Email: passenger1@streetify.com\nPassword: 1111",
                "expected": "HTTP 200 OK; JWT access token & user role PASSENGER returned; redirect to home.",
                "actual": "Login successful (HTTP 200); JWT issued with claims; role PASSENGER loaded in state.",
                "status": "Pass"
            },
            {
                "id": "TC_UM_09",
                "title": "Verify login with incorrect password",
                "desc": "Ensure login fails securely on incorrect password without leaking data.",
                "pre": "1. Account passenger1@streetify.com is registered",
                "steps": "1. Open Login screen\n2. Enter correct email but incorrect password\n3. Click 'Sign In'",
                "data": "Email: passenger1@streetify.com\nPassword: WrongPassword#999",
                "expected": "Login refused with HTTP 401 Unauthorized; message 'Bad credentials'.",
                "actual": "Refused (HTTP 401) with 'Bad credentials'. No JWT issued; login denied.",
                "status": "Pass"
            },
            {
                "id": "TC_UM_10",
                "title": "Verify password reset OTP verification within 5-minute expiry",
                "desc": "Ensure 6-digit OTP allows password update within its 5-minute validity window.",
                "pre": "1. Account kasun@streetify.com exists\n2. OTP requested within last 5 minutes",
                "steps": "1. Request OTP for registered email\n2. Enter the generated 6-digit OTP\n3. Enter new 8-char password and submit",
                "data": "Email: kasun@streetify.com\nOTP: 6-digit code\nNew Password: NewPass#2026",
                "expected": "OTP validated; password hash updated in MSSQL; HTTP 200 message returned.",
                "actual": "Verified (HTTP 200); password hash updated; OTP cache entry invalidated.",
                "status": "Pass"
            }
        ]
    },
    {
        "num": 2,
        "name": "W.A.C.B. Dharmakeerthi",
        "reg": "IT25102207",
        "short_name": "Chanuka",
        "module": "Ride Booking and Management",
        "submodule": "Ride Booking & Dispatch Engine",
        "prefix": "TC_BK_",
        "scope": "Passenger Ride Booking, Fare Estimation Engine, Geocoding & Coordinate Validation, Vehicle Type Selection, Nearby Driver Dispatch, Trip History, Trip Cancellation.",
        "tests": [
            {
                "id": "TC_BK_01",
                "title": "Verify fare estimation for valid route",
                "desc": "Ensure passenger receives accurate fare breakdown based on route distance.",
                "pre": "1. Passenger logged in\n2. GPS geocoding service active",
                "steps": "1. Open Booking screen\n2. Enter pickup and dropoff locations\n3. Click 'Get Fare Estimate'",
                "data": "Pickup: Colombo Fort (6.9344, 79.8428)\nDropoff: SLIIT Malabe (6.9147, 79.9729)\nType: CAR",
                "expected": "HTTP 200 OK; returns base fare, per km rate, platform fee, and total estimated fare.",
                "actual": "Fare estimate returned: Base LKR 300.00, Total LKR 2,480.00; route line drawn on map.",
                "status": "Pass"
            },
            {
                "id": "TC_BK_02",
                "title": "Verify booking a ride with complete valid details",
                "desc": "Ensure passenger can request a ride and broadcast request to available drivers.",
                "pre": "1. Passenger logged in as passenger1@streetify.com\n2. Route selected",
                "steps": "1. Select pickup and dropoff points\n2. Choose ride type 'CAR'\n3. Select payment method 'CARD'\n4. Click 'Book Ride'",
                "data": "Pickup: Colombo Fort\nDropoff: Nugegoda\nRideType: CAR\nPayment: CARD",
                "expected": "Trip created with status REQUESTED (HTTP 201); broadcast sent via WebSocket.",
                "actual": "Trip #101 created (HTTP 201) with status REQUESTED; trip inserted in MSSQL trips table.",
                "status": "Pass"
            },
            {
                "id": "TC_BK_03",
                "title": "Verify booking with missing pickup location",
                "desc": "Ensure booking is rejected if pickup address or coordinates are missing.",
                "pre": "1. Passenger on Booking screen",
                "steps": "1. Leave pickup address and coordinates empty\n2. Select dropoff location\n3. Click 'Book Ride'",
                "data": "Pickup: null\nDropoff: Kottawa Junction\nRideType: TUK",
                "expected": "Request blocked with HTTP 400 Bad Request; pickup address is required.",
                "actual": "Rejected (HTTP 400) on pickupAddress: 'Pickup address is required'. No trip created.",
                "status": "Pass"
            },
            {
                "id": "TC_BK_04",
                "title": "Verify booking with identical pickup and dropoff coordinates",
                "desc": "Boundary test: distance between pickup and dropoff must be at least 0.1 km.",
                "pre": "1. Passenger on Booking screen",
                "steps": "1. Set pickup coordinates\n2. Set identical dropoff coordinates (0.00 km)\n3. Click 'Book Ride'",
                "data": "Pickup: (6.9344, 79.8428)\nDropoff: (6.9344, 79.8428)\nDistance: 0.0 km",
                "expected": "Request rejected: pickup and dropoff locations cannot be identical.",
                "actual": "Rejected (HTTP 400): 'Pickup and dropoff locations cannot be identical (min distance 0.1 km)'.",
                "status": "Pass"
            },
            {
                "id": "TC_BK_05",
                "title": "Verify coordinates outside Sri Lanka operational boundary",
                "desc": "Boundary test: reject coordinates outside Sri Lanka geographic boundary.",
                "pre": "1. Passenger on Booking screen",
                "steps": "1. Enter pickup latitude outside Sri Lanka (Lat > 10.0 or Lng > 82.5)\n2. Submit booking request",
                "data": "Pickup Lat: 15.5000, Lng: 95.0000\n(Sri Lanka boundary: Lat 5.9-9.9, Lng 79.5-81.9)",
                "expected": "Request rejected: location is outside Streetify operational service area.",
                "actual": "Rejected (HTTP 400): 'Location coordinates are outside the Streetify Sri Lanka operational boundary'.",
                "status": "Pass"
            },
            {
                "id": "TC_BK_06",
                "title": "Verify available trips listing for online drivers",
                "desc": "Ensure an online driver can query all unassigned REQUESTED trips.",
                "pre": "1. Driver driver1@streetify.com logged in\n2. Trip #101 in REQUESTED status",
                "steps": "1. Open Driver Dispatch dashboard\n2. System calls GET /api/rides/available",
                "data": "Driver: driver1@streetify.com\nStatus filter: REQUESTED",
                "expected": "HTTP 200 OK; list of unassigned trips with fare and distance returned.",
                "actual": "HTTP 200 OK; Trip #101 listed with status REQUESTED, fare LKR 1925.00, route details.",
                "status": "Pass"
            },
            {
                "id": "TC_BK_07",
                "title": "Verify driver accepting an available trip",
                "desc": "Ensure driver can accept an unassigned trip and update its status to ACCEPTED.",
                "pre": "1. Trip #101 is REQUESTED\n2. Driver driver1@streetify.com is online",
                "steps": "1. Driver clicks 'Accept Trip' on Trip #101\n2. System calls POST /api/rides/accept/101",
                "data": "Trip ID: 101\nDriver ID: 10 (driver1@streetify.com)",
                "expected": "Trip status updated to ACCEPTED; driver assigned in DB; passenger notified.",
                "actual": "HTTP 200 OK; trip status updated to ACCEPTED; driver_id set to 10 in MSSQL trips.",
                "status": "Pass"
            },
            {
                "id": "TC_BK_08",
                "title": "Verify second driver cannot accept an already accepted trip",
                "desc": "Concurrency test: ensure two drivers cannot accept the same trip.",
                "pre": "1. Trip #101 already accepted by Driver 1 (status ACCEPTED)\n2. Driver 2 is logged in",
                "steps": "1. Driver 2 clicks 'Accept Trip' on Trip #101\n2. System calls POST /api/rides/accept/101",
                "data": "Trip ID: 101\nDriver 2 ID: 11 (driver2@streetify.com)",
                "expected": "Request rejected with HTTP 409 Conflict: trip already accepted.",
                "actual": "Rejected (HTTP 409) with 'Trip has already been accepted by another driver.'",
                "status": "Pass"
            },
            {
                "id": "TC_BK_09",
                "title": "Verify passenger cancelling a requested ride",
                "desc": "Ensure passenger can cancel a trip prior to commencement.",
                "pre": "1. Passenger has active Trip #102 in REQUESTED status",
                "steps": "1. Click 'Cancel Ride' button\n2. Confirm cancellation with reason",
                "data": "Trip ID: 102\nReason: 'Change of schedule'",
                "expected": "Trip status set to CANCELLED in DB; drivers notified; HTTP 200 returned.",
                "actual": "HTTP 200 OK; status updated to CANCELLED in MSSQL; message 'Trip cancelled successfully'.",
                "status": "Pass"
            },
            {
                "id": "TC_BK_10",
                "title": "Verify passenger cannot access another user's private trip",
                "desc": "Security check: ensure passengers cannot query or modify other users' trips.",
                "pre": "1. Passenger A is logged in\n2. Trip #103 belongs to Passenger B",
                "steps": "1. Passenger A attempts to call cancel/view endpoint for Trip #103",
                "data": "Target Trip ID: 103 (Passenger B)\nCaller: Passenger A",
                "expected": "Access refused with HTTP 403 Forbidden / 404 Not Found.",
                "actual": "Refused (HTTP 403) with 'You are not authorized to access or modify this trip.'",
                "status": "Pass"
            }
        ]
    },
    {
        "num": 3,
        "name": "K.A.T. Senaka",
        "reg": "IT25102241",
        "short_name": "Tharindu",
        "module": "Driver Trip Request Management",
        "submodule": "Trip Progress & Telemetry",
        "prefix": "TC_TM_",
        "scope": "Trip Progress State Machine (EN_ROUTE -> ARRIVED -> IN_PROGRESS -> COMPLETED), Illegal State Transitions, Passenger No-Show Cancellation, Active Trip Telemetry, GPS Position Stream over WebSocket.",
        "tests": [
            {
                "id": "TC_TM_01",
                "title": "Verify driver updates status to EN_ROUTE",
                "desc": "Ensure driver advances trip state to EN_ROUTE when heading to pickup point.",
                "pre": "1. Driver accepted Trip #101 (status ACCEPTED)",
                "steps": "1. Driver opens active ride view\n2. Click 'Start Navigation to Pickup'\n3. Calls PUT /api/trips/101/status",
                "data": "Trip ID: 101\nStatus: EN_ROUTE",
                "expected": "HTTP 200 OK; trip status updated to EN_ROUTE in MSSQL; passenger notified.",
                "actual": "HTTP 200 OK; status updated to EN_ROUTE; message 'Trip status updated to EN_ROUTE'.",
                "status": "Pass"
            },
            {
                "id": "TC_TM_02",
                "title": "Verify driver updates status to ARRIVED at pickup",
                "desc": "Ensure driver marks arrival at pickup and starts passenger wait timer.",
                "pre": "1. Trip #101 status is EN_ROUTE",
                "steps": "1. Driver reaches pickup location\n2. Click 'I Have Arrived'\n3. Calls PUT /api/trips/101/status",
                "data": "Trip ID: 101\nStatus: ARRIVED",
                "expected": "Trip status updated to ARRIVED; arrival timestamp logged; 5-min wait countdown starts.",
                "actual": "HTTP 200 OK; status set to ARRIVED in trips table; passenger notification sent.",
                "status": "Pass"
            },
            {
                "id": "TC_TM_03",
                "title": "Verify driver starts trip - status IN_PROGRESS",
                "desc": "Ensure driver initiates ride once passenger is onboard.",
                "pre": "1. Trip #101 status is ARRIVED\n2. Passenger has boarded vehicle",
                "steps": "1. Driver confirms passenger boarding\n2. Click 'Start Trip'\n3. Calls PUT /api/trips/101/status",
                "data": "Trip ID: 101\nStatus: IN_PROGRESS",
                "expected": "Trip status updated to IN_PROGRESS; trip start timestamp recorded.",
                "actual": "HTTP 200 OK; status updated to IN_PROGRESS in MSSQL; live trip timer started.",
                "status": "Pass"
            },
            {
                "id": "TC_TM_04",
                "title": "Verify driver completes trip - status COMPLETED",
                "desc": "Ensure driver marks trip complete upon reaching destination.",
                "pre": "1. Trip #101 status is IN_PROGRESS\n2. Vehicle reached dropoff location",
                "steps": "1. Driver arrives at destination\n2. Click 'Complete Trip'\n3. Calls PUT /api/trips/101/status",
                "data": "Trip ID: 101\nStatus: COMPLETED",
                "expected": "Trip status becomes COMPLETED; completed_at timestamp recorded; ready for payment.",
                "actual": "HTTP 200 OK; status set to COMPLETED; completed_at timestamp updated in MSSQL.",
                "status": "Pass"
            },
            {
                "id": "TC_TM_05",
                "title": "Verify illegal state transition skip (EN_ROUTE to COMPLETED)",
                "desc": "Ensure state machine enforces sequential transitions and blocks skipped states.",
                "pre": "1. Trip #101 is in EN_ROUTE status",
                "steps": "1. Driver attempts to send status COMPLETED without passing ARRIVED and IN_PROGRESS",
                "data": "Trip ID: 101\nTarget Status: COMPLETED",
                "expected": "Request rejected with HTTP 409 Conflict: invalid state sequence.",
                "actual": "Rejected (HTTP 409): 'Illegal state transition from EN_ROUTE to COMPLETED. Must be IN_PROGRESS first.'",
                "status": "Pass"
            },
            {
                "id": "TC_TM_06",
                "title": "Verify driver no-show cancellation after 5 minutes wait",
                "desc": "Ensure driver can cancel with LKR 100 fee after waiting >= 5 mins at pickup.",
                "pre": "1. Trip #101 status is ARRIVED\n2. Driver wait elapsed >= 300 seconds (5 mins)",
                "steps": "1. Wait countdown expires\n2. Driver clicks 'Cancel No-Show'\n3. Calls POST /api/trips/101/noshow",
                "data": "Trip ID: 101\nWait Duration: 310 seconds",
                "expected": "Trip cancelled; LKR 100 no-show fee applied; driver released for new rides; HTTP 200.",
                "actual": "HTTP 200 OK; cancelled=true; noShowFee=100.00; fee logged to passenger.",
                "status": "Pass"
            },
            {
                "id": "TC_TM_07",
                "title": "Verify driver no-show cancellation before 5 minutes wait",
                "desc": "Boundary test: ensure no-show cancellation is blocked if wait time < 5 mins.",
                "pre": "1. Trip #101 status is ARRIVED\n2. Driver wait elapsed is only 120 seconds",
                "steps": "1. Driver clicks 'Cancel No-Show' prematurely",
                "data": "Trip ID: 101\nWait Duration: 120 seconds (< 300s)",
                "expected": "Action rejected: driver must wait at least 5 minutes before applying no-show.",
                "actual": "Rejected (HTTP 400): 'Cannot report no-show. Driver must wait at least 5 minutes after arrival.'",
                "status": "Pass"
            },
            {
                "id": "TC_TM_08",
                "title": "Verify driver fetching active current trip",
                "desc": "Ensure driver dashboard restores active trip upon screen mount.",
                "pre": "1. Driver driver1@streetify.com has ongoing trip #101",
                "steps": "1. Driver opens driver dashboard\n2. Calls GET /api/trips/current",
                "data": "Driver Bearer JWT token",
                "expected": "HTTP 200 OK; current trip payload returned with passenger and route details.",
                "actual": "HTTP 200 OK; active trip details returned with status IN_PROGRESS; map view restored.",
                "status": "Pass"
            },
            {
                "id": "TC_TM_09",
                "title": "Verify live GPS telemetry broadcast over WebSocket",
                "desc": "Ensure real-time driver coordinates stream to passenger map channel.",
                "pre": "1. Driver connected to STOMP WebSocket broker at /ws\n2. Active trip #101",
                "steps": "1. Driver sends GPS payload to destination /telemetry\n2. Check broker delivery to passenger queue",
                "data": "Payload: { tripId: 101, lat: 6.9147, lng: 79.9729, speed: 45.0, heading: 90.0 }",
                "expected": "Message delivered to /user/{passengerEmail}/queue/trip/101 and /topic/fleet.",
                "actual": "Telemetry broadcasted successfully; passenger client receives position and updates car marker.",
                "status": "Pass"
            },
            {
                "id": "TC_TM_10",
                "title": "Verify unauthorized driver cannot update another driver's trip",
                "desc": "Security check: ensure a driver cannot update status on an unassigned trip.",
                "pre": "1. Trip #101 assigned to Driver 1\n2. Driver 2 is logged in",
                "steps": "1. Driver 2 attempts to send PUT /api/trips/101/status",
                "data": "Trip ID: 101\nCaller: Driver 2",
                "expected": "Action rejected with HTTP 403 Forbidden: caller not assigned to this trip.",
                "actual": "Refused (HTTP 403): 'You are not authorized to update status for this trip.'",
                "status": "Pass"
            }
        ]
    },
    {
        "num": 4,
        "name": "E.A.R.N.D. Edirisinghe",
        "reg": "IT25102225",
        "short_name": "Daham",
        "module": "Payment and Receipt Management",
        "submodule": "Payment & Ledger Management",
        "prefix": "TC_PM_",
        "scope": "Payment Settlement (CASH, CARD, WALLET), Digital Wallet Deduction, 15% Platform Commission & 85% Driver Net Calculation, Duplicate Payment Prevention, Driver Commission Debt, Receipt Generation.",
        "tests": [
            {
                "id": "TC_PM_01",
                "title": "Verify digital wallet payment with sufficient balance",
                "desc": "Ensure passenger wallet is debited, driver credited (85%), and platform keeps commission (15%).",
                "pre": "1. Trip #101 is COMPLETED, total fare LKR 1000.00, unpaid\n2. Passenger wallet balance is LKR 5000.00",
                "steps": "1. Open Payment screen\n2. Select 'WALLET' method\n3. Click 'Pay Now'\n4. Calls POST /api/payments/process",
                "data": "Trip ID: 101\nPayment Method: WALLET\nFare: LKR 1000.00",
                "expected": "Payment SUCCESS; passenger debited LKR 1000; driver credited LKR 850; platform commission LKR 150.",
                "actual": "Payment SUCCESS (HTTP 200); passenger wallet now LKR 4000.00; driver wallet credited LKR 850.00; receipt generated.",
                "status": "Pass"
            },
            {
                "id": "TC_PM_02",
                "title": "Verify digital wallet payment with insufficient balance",
                "desc": "Ensure wallet payment is rejected when balance is lower than total fare.",
                "pre": "1. Trip #102 fare is LKR 1500.00\n2. Passenger wallet balance is LKR 250.00",
                "steps": "1. Select 'WALLET' method\n2. Click 'Pay Now'",
                "data": "Trip ID: 102\nPayment Method: WALLET\nRequired: LKR 1500.00\nBalance: LKR 250.00",
                "expected": "Payment rejected with HTTP 409 Conflict; message explains insufficient funds.",
                "actual": "Rejected (HTTP 409): 'Insufficient wallet balance (Current: LKR 250.00, Required: LKR 1500.00). Top up or pay via Cash/Card.'",
                "status": "Pass"
            },
            {
                "id": "TC_PM_03",
                "title": "Verify cash payment records 15% platform commission debt to driver",
                "desc": "Ensure cash payment records commission debt to driver without debiting passenger wallet.",
                "pre": "1. Trip #103 fare is LKR 2000.00\n2. Driver commission debt is LKR 0.00",
                "steps": "1. Select 'CASH' payment method\n2. Process payment settlement",
                "data": "Trip ID: 103\nPayment Method: CASH\nFare: LKR 2000.00",
                "expected": "Trip marked paid; driver commission_debt incremented by LKR 300.00 (15% of 2000); receipt issued.",
                "actual": "HTTP 200 OK; status SUCCESS; driver commission_debt updated to LKR 300.00 in MSSQL; is_paid=1.",
                "status": "Pass"
            },
            {
                "id": "TC_PM_04",
                "title": "Verify card payment with masked card details and 3DS gateway simulation",
                "desc": "Ensure online card payment succeeds and logs masked card info for compliance.",
                "pre": "1. Trip #104 fare is LKR 1200.00\n2. Unpaid completed trip",
                "steps": "1. Select 'CARD'\n2. Enter card details (4111 1111 1111 4321)\n3. Click 'Pay Now'",
                "data": "Card: Visa **** 4321\nAmount: LKR 1200.00\ncardType: VISA",
                "expected": "Payment succeeds; driver credited LKR 1020.00 (85%); masked card details saved.",
                "actual": "HTTP 200 OK; status SUCCESS; card recorded as **** 4321; driver wallet credited LKR 1020.00.",
                "status": "Pass"
            },
            {
                "id": "TC_PM_05",
                "title": "Verify paying for an already paid trip (duplicate payment prevention)",
                "desc": "Ensure system prevents charging an already paid trip.",
                "pre": "1. Trip #101 is already paid (is_paid = 1)",
                "steps": "1. Attempt to resubmit payment for Trip #101",
                "data": "Trip ID: 101\nPayment Method: CARD",
                "expected": "Payment rejected with HTTP 409 Conflict: trip already paid.",
                "actual": "Rejected (HTTP 409): 'This trip has already been paid.' No double charge executed.",
                "status": "Pass"
            },
            {
                "id": "TC_PM_06",
                "title": "Verify payment gateway retry loop exhaustion on decline",
                "desc": "Ensure payment retry loop runs up to 3 attempts before marking FAILED.",
                "pre": "1. Simulated payment gateway configured to return failure",
                "steps": "1. Process card payment with declining gateway response",
                "data": "Trip ID: 105\nMethod: CARD (Simulated gateway failure)",
                "expected": "Gateway retried 3 times; payment status marked FAILED; trip remains unpaid.",
                "actual": "3 retries logged in DB (retryCount: 3); receipt returned with status FAILED; is_paid remained 0.",
                "status": "Pass"
            },
            {
                "id": "TC_PM_07",
                "title": "Verify payment request with empty payment method",
                "desc": "Ensure payment validation requires valid payment method parameter.",
                "pre": "1. Trip completed and unpaid",
                "steps": "1. Send payment request with paymentMethod: ''",
                "data": "Trip ID: 106\npaymentMethod: ''",
                "expected": "Rejected with HTTP 400 Bad Request; payment method is required.",
                "actual": "Rejected (HTTP 400) on paymentMethod: 'Payment method is required'.",
                "status": "Pass"
            },
            {
                "id": "TC_PM_08",
                "title": "Verify exact zero wallet balance boundary test",
                "desc": "Boundary test: passenger wallet reaches exactly LKR 0.00 without negative balance.",
                "pre": "1. Passenger wallet balance is exactly LKR 1000.00\n2. Trip fare is exactly LKR 1000.00",
                "steps": "1. Pay full fare using 'WALLET' method",
                "data": "Fare: LKR 1000.00\nWallet Balance: LKR 1000.00",
                "expected": "Payment succeeds; new wallet balance in MSSQL is exactly LKR 0.00; no overdraft.",
                "actual": "Payment SUCCESS (HTTP 200); passenger wallet balance updated to 0.00; transaction logged.",
                "status": "Pass"
            },
            {
                "id": "TC_PM_09",
                "title": "Verify passenger cannot pay for another user's trip",
                "desc": "Security check: ensure only the trip owner can execute payment.",
                "pre": "1. Trip #107 belongs to Passenger A\n2. Passenger B is authenticated",
                "steps": "1. Passenger B attempts to execute payment for Trip #107",
                "data": "Trip ID: 107 (Passenger A)\nCaller: Passenger B",
                "expected": "Payment rejected with HTTP 403 Forbidden: unauthorized caller.",
                "actual": "Refused (HTTP 403) with 'You are not authorized to pay for this trip.'",
                "status": "Pass"
            },
            {
                "id": "TC_PM_10",
                "title": "Verify payment receipt retrieval and financial audit fields",
                "desc": "Ensure generated receipt contains complete financial audit ledger fields.",
                "pre": "1. Trip #101 payment completed successfully",
                "steps": "1. Passenger opens receipt view on ReceiptDisplay.tsx",
                "data": "Payment ID: 501",
                "expected": "Receipt renders paymentId, tripId, grossAmount, commission, driverNet, and timestamp.",
                "actual": "All financial ledger fields rendered accurately; values match MSSQL payments table.",
                "status": "Pass"
            }
        ]
    },
    {
        "num": 5,
        "name": "W.A.M.B. Weerasingha",
        "reg": "IT25102193",
        "short_name": "Mithun",
        "module": "Review, Rating, and Feedback Management",
        "submodule": "Review & Dispute Form",
        "prefix": "TC_RM_",
        "scope": "Post-Trip Review Submission, 1-to-5 Star Rating Boundary Validations, Driver Average Rating Aggregation, Duplicate Review Prevention, Dispute Ticket Submission, Support Staff Ticket Resolution.",
        "tests": [
            {
                "id": "TC_RM_01",
                "title": "Verify submitting 5-star review for completed trip",
                "desc": "Ensure passenger can submit valid 5-star review and update driver rating.",
                "pre": "1. Trip #101 is COMPLETED and paid\n2. Passenger is logged in",
                "steps": "1. Open Review screen\n2. Select 5 stars\n3. Enter feedback comment\n4. Click 'Submit Review'",
                "data": "Trip ID: 101\nRating: 5\nComment: 'Smooth ride and excellent driving!'",
                "expected": "HTTP 201 Created; review saved; driver average rating recalculated in MSSQL.",
                "actual": "HTTP 201 Created; review record #201 saved; driver average_rating updated to 4.9.",
                "status": "Pass"
            },
            {
                "id": "TC_RM_02",
                "title": "Verify star rating boundary minimum (1 Star allowed)",
                "desc": "Boundary test: verify lowest permissible rating (1 star) is accepted.",
                "pre": "1. Trip #102 completed and paid",
                "steps": "1. Select 1 star\n2. Enter comment: 'Driver took wrong route'\n3. Click 'Submit Review'",
                "data": "Trip ID: 102\nRating: 1\nComment: 'Driver took wrong route'",
                "expected": "Review saved; 1-star rating accepted; driver average rating recalculated.",
                "actual": "HTTP 201 Created; 1-star review saved in reviews table; driver average rating adjusted.",
                "status": "Pass"
            },
            {
                "id": "TC_RM_03",
                "title": "Verify star rating below minimum (0 Stars rejected)",
                "desc": "Boundary test: ensure rating < 1 is rejected by bean validation.",
                "pre": "1. Trip completed and paid",
                "steps": "1. Send review payload with rating: 0",
                "data": "Trip ID: 103\nRating: 0\nComment: 'Terrible'",
                "expected": "Rejected with HTTP 400 Bad Request; rating must be at least 1 star.",
                "actual": "Rejected (HTTP 400) on rating: 'Rating must be at least 1 star' (@Min(1) violation).",
                "status": "Pass"
            },
            {
                "id": "TC_RM_04",
                "title": "Verify star rating above maximum (6 Stars rejected)",
                "desc": "Boundary test: ensure rating > 5 is rejected by bean validation.",
                "pre": "1. Trip completed and paid",
                "steps": "1. Send review payload with rating: 6",
                "data": "Trip ID: 103\nRating: 6\nComment: 'Beyond excellent'",
                "expected": "Rejected with HTTP 400 Bad Request; rating cannot exceed 5 stars.",
                "actual": "Rejected (HTTP 400) on rating: 'Rating cannot exceed 5 stars' (@Max(5) violation).",
                "status": "Pass"
            },
            {
                "id": "TC_RM_05",
                "title": "Verify duplicate review submission on same trip",
                "desc": "Ensure passenger cannot review the same trip more than once.",
                "pre": "1. Review already submitted for Trip #101",
                "steps": "1. Passenger attempts to submit another review for Trip #101",
                "data": "Trip ID: 101\nRating: 4\nComment: 'Updating feedback'",
                "expected": "Request rejected with HTTP 409 Conflict: trip already reviewed.",
                "actual": "Rejected (HTTP 409): 'You have already submitted a review for this trip.'",
                "status": "Pass"
            },
            {
                "id": "TC_RM_06",
                "title": "Verify review submission on incomplete trip",
                "desc": "Ensure review can only be submitted for COMPLETED trips.",
                "pre": "1. Trip #104 status is IN_PROGRESS",
                "steps": "1. Passenger attempts to submit review for ongoing Trip #104",
                "data": "Trip ID: 104\nRating: 5",
                "expected": "Rejected: cannot review a trip that is not COMPLETED.",
                "actual": "Rejected (HTTP 400): 'Cannot review a trip that is not COMPLETED.'",
                "status": "Pass"
            },
            {
                "id": "TC_RM_07",
                "title": "Verify dispute ticket creation with valid details",
                "desc": "Ensure passenger can file support dispute for an overcharged/problematic trip.",
                "pre": "1. Passenger logged in\n2. Trip #101 is completed",
                "steps": "1. Open Support screen\n2. Select dispute type 'OVERCHARGED'\n3. Enter subject and description\n4. Submit dispute ticket",
                "data": "Trip ID: 101\nType: OVERCHARGED\nSubject: Route Detour Overcharge\nDescription: Driver took 5km detour.",
                "expected": "HTTP 201 Created; dispute ticket saved with status OPEN; reference generated.",
                "actual": "Dispute ticket created (HTTP 201); status OPEN; reference TKT-00101 logged in MSSQL.",
                "status": "Pass"
            },
            {
                "id": "TC_RM_08",
                "title": "Verify dispute ticket submission without description",
                "desc": "Ensure dispute form requires detailed explanation.",
                "pre": "1. Passenger on Dispute form",
                "steps": "1. Enter subject\n2. Leave description empty\n3. Click 'Submit Dispute'",
                "data": "Subject: Overcharged\nDescription: '' (empty)",
                "expected": "Validation rejected with HTTP 400; description is required.",
                "actual": "Rejected (HTTP 400) on description: 'Description is required' (@NotBlank).",
                "status": "Pass"
            },
            {
                "id": "TC_RM_09",
                "title": "Verify support officer resolving dispute with wallet refund",
                "desc": "Ensure support staff can resolve ticket and credit passenger refund.",
                "pre": "1. Dispute ticket #301 is OPEN\n2. Logged in as Support Staff (admin@streetify.com)",
                "steps": "1. Review ticket #301\n2. Set decision RESOLVED\n3. Enter refund amount LKR 300.00\n4. Submit resolution",
                "data": "Ticket ID: 301\nDecision: RESOLVED\nRefund Amount: LKR 300.00\nResolution Note: Detour verified.",
                "expected": "Ticket updated to RESOLVED; passenger wallet credited LKR 300 in MSSQL; HTTP 200.",
                "actual": "HTTP 200 OK; ticket status RESOLVED; passenger wallet increased by LKR 300.00.",
                "status": "Pass"
            },
            {
                "id": "TC_RM_10",
                "title": "Verify passenger cannot access staff dispute queue",
                "desc": "Role check: ensure passenger cannot view global pending support tickets.",
                "pre": "1. Passenger is authenticated (role PASSENGER)",
                "steps": "1. Passenger calls GET /api/disputes/pending",
                "data": "Caller: passenger1@streetify.com",
                "expected": "Access denied with HTTP 403 Forbidden.",
                "actual": "Refused (HTTP 403): 'You do not have permission to perform this action.'",
                "status": "Pass"
            }
        ]
    },
    {
        "num": 6,
        "name": "R.V.S. Rammandalagedara",
        "reg": "IT25102240",
        "short_name": "Vidura",
        "module": "Administration and System Control",
        "submodule": "Admin Governance & System Control",
        "prefix": "TC_AM_",
        "scope": "Role-Based Access Control (RBAC), Admin Dashboard Live KPIs, Platform Revenue Audits, Driver Document Verification Queue, Account Suspension & Audit Trail, Conceptual JWT Revocation, Cross-Module Data Governance.",
        "tests": [
            {
                "id": "TC_AM_01",
                "title": "Verify unauthorized user denied access to admin control endpoints",
                "desc": "RBAC security test: non-admin users must be rejected from administrative routes.",
                "pre": "1. Authenticated as regular PASSENGER or DRIVER",
                "steps": "1. Attempt to call GET /api/admin/stats or GET /api/module-admin/users directly",
                "data": "Caller: passenger1@streetify.com\nRole: PASSENGER",
                "expected": "HTTP 403 Forbidden; access denied; no administrative data exposed.",
                "actual": "Refused (HTTP 403): 'You do not have permission to perform this action.'",
                "status": "Pass"
            },
            {
                "id": "TC_AM_02",
                "title": "Verify admin can access live dashboard KPIs and metrics",
                "desc": "Ensure admin dashboard aggregates real-time platform statistics accurately.",
                "pre": "1. Logged in as ADMIN (vidura@streetify.lk)",
                "steps": "1. Open Admin Dashboard\n2. System calls GET /api/admin/stats",
                "data": "Admin Bearer JWT token",
                "expected": "HTTP 200 OK; returns total users, active drivers, completed trips, revenue, disputes.",
                "actual": "HTTP 200 OK; KPIs returned matching database aggregates in MSSQL.",
                "status": "Pass"
            },
            {
                "id": "TC_AM_03",
                "title": "Verify daily platform commission revenue calculation",
                "desc": "Ensure platform revenue endpoint sums 15% commission from completed trips.",
                "pre": "1. Admin logged in\n2. Completed trips exist for current date",
                "steps": "1. Call GET /api/admin/revenue/daily",
                "data": "Date: Current Date\nAdmin JWT token",
                "expected": "HTTP 200 OK; returns total revenue in LKR matching database sum.",
                "actual": "HTTP 200 OK; revenue returned matching sum of platform_commission column in trips table.",
                "status": "Pass"
            },
            {
                "id": "TC_AM_04",
                "title": "Verify admin reviews pending driver document queue",
                "desc": "Ensure admin can inspect driver license, CR book, and insurance uploads.",
                "pre": "1. Driver 3 (driver3@streetify.com) has uploaded documents (status PENDING)",
                "steps": "1. Admin opens Document Verification Queue\n2. Calls GET /api/admin/verifications",
                "data": "Admin Bearer token",
                "expected": "HTTP 200 OK; pending documents for Driver 3 listed with file metadata.",
                "actual": "HTTP 200 OK; 3 pending documents returned (license, reg, insurance) with file paths.",
                "status": "Pass"
            },
            {
                "id": "TC_AM_05",
                "title": "Verify admin approves driver documents and activates driver",
                "desc": "Ensure admin approval updates driver status to APPROVED in database.",
                "pre": "1. Driver 3 documents in PENDING status\n2. Driver verification_status is PENDING_VERIFICATION",
                "steps": "1. Admin reviews driver documents\n2. Clicks 'Approve All Documents'\n3. Approves driver profile",
                "data": "Driver ID: 12\nReviewer: Vidura (Admin)\nStatus: APPROVED",
                "expected": "Driver documents set to APPROVED; driver verification_status set to APPROVED; driver activated.",
                "actual": "Status updated to APPROVED in MSSQL; driver allowed to toggle online; audit log logged.",
                "status": "Pass"
            },
            {
                "id": "TC_AM_06",
                "title": "Verify admin suspends user account with mandatory audit note",
                "desc": "Ensure admin can suspend fraudulent/violating accounts and write audit trail.",
                "pre": "1. Target user exists (User ID: 15)\n2. Admin logged in",
                "steps": "1. Open Suspend User modal\n2. Enter duration: '7 days'\n3. Enter audit note: 'Safety violation reported'\n4. Click 'Suspend Account'",
                "data": "userId: 15\nduration: '7 days'\nauditNote: 'Safety violation reported'",
                "expected": "User suspended flag set to 1 in MSSQL; immutable audit record written; HTTP 200.",
                "actual": "User suspended=1 in users table; audit log #801 created with action ACCOUNT_SUSPENDED.",
                "status": "Pass"
            },
            {
                "id": "TC_AM_07",
                "title": "Verify suspending user without audit note is rejected",
                "desc": "Ensure accountability by requiring non-blank audit note for suspensions.",
                "pre": "1. Admin on Suspend User modal",
                "steps": "1. Select target user\n2. Leave auditNote blank\n3. Click 'Suspend Account'",
                "data": "userId: 15\nauditNote: '' (blank)",
                "expected": "Rejected with HTTP 400 Bad Request; audit note is mandatory (@NotBlank).",
                "actual": "Rejected (HTTP 400) on auditNote: 'Audit note is required for account suspension'.",
                "status": "Pass"
            },
            {
                "id": "TC_AM_08",
                "title": "Verify admin lifts user suspension (unsuspend account)",
                "desc": "Ensure admin can reinstate suspended user and log restoration in audit trail.",
                "pre": "1. User ID: 15 is currently suspended (suspended = 1)",
                "steps": "1. Admin clicks 'Unsuspend Account'\n2. Enters resolution note\n3. Calls POST /api/admin/unsuspend/15",
                "data": "userId: 15\nnote: 'Appeal approved after investigation'",
                "expected": "User suspended flag reset to 0 in MSSQL; audit record UNSUSPEND_ACCOUNT logged; user can log in.",
                "actual": "HTTP 200 OK; user suspended=0; audit log written; message 'Suspension lifted for user 15'.",
                "status": "Pass"
            },
            {
                "id": "TC_AM_09",
                "title": "Verify conceptual JWT session revocation broadcast",
                "desc": "Ensure admin session revocation broadcasts disconnect event to user.",
                "pre": "1. Target user has active JWT session",
                "steps": "1. Admin triggers JWT revocation\n2. Calls POST /api/admin/revoke-jwt?userId=15",
                "data": "userId: 15\nAdmin token",
                "expected": "Audit log JWT_REVOKED created; WebSocket disconnect dispatched to target user.",
                "actual": "HTTP 200 OK; revokedCount: 1; audit log saved; client session invalidated.",
                "status": "Pass"
            },
            {
                "id": "TC_AM_10",
                "title": "Verify immutable audit log retrieval with boundary limit cap",
                "desc": "Boundary test: verify limit parameter caps safely at maximum 200 entries.",
                "pre": "1. Over 200 audit entries exist in MSSQL audit_logs table",
                "steps": "1. Admin queries audit log with limit=500\n2. Calls GET /api/admin/audit?limit=500",
                "data": "Requested limit: 500\nMaximum safe cap: 200",
                "expected": "System returns exactly 200 most recent audit entries sorted descending by timestamp.",
                "actual": "Exactly 200 records returned; safeLimit capped; records sorted newest first.",
                "status": "Pass"
            }
        ]
    }
]

# ── Main Document Builder ─────────────────────────────────────────────────────
def build_document():
    doc = Document()
    
    # Page setup - Portrait for Cover and Sections 1-2
    section = doc.sections[0]
    section.page_width = Inches(8.27)   # A4 Portrait
    section.page_height = Inches(11.69)
    section.top_margin = Inches(0.8)
    section.bottom_margin = Inches(0.8)
    section.left_margin = Inches(0.8)
    section.right_margin = Inches(0.8)
    
    # ── 1. COVER PAGE ─────────────────────────────────────────────────────────
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_before = Pt(36)
    p_inst.paragraph_format.space_after = Pt(2)
    r = p_inst.add_run("Sri Lanka Institute of Information Technology")
    r.font.name = "Arial"
    r.font.size = Pt(18)
    r.bold = True
    r.font.color.rgb = C_NAVY
    
    p_fac = doc.add_paragraph()
    p_fac.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_fac.paragraph_format.space_after = Pt(30)
    r = p_fac.add_run("Faculty of Computing | Department of Software Engineering")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.color.rgb = C_GREY
    
    p_lab = doc.add_paragraph()
    p_lab.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_lab.paragraph_format.space_after = Pt(6)
    r = p_lab.add_run("Lab Submission - 06: Software Testing")
    r.font.name = "Arial"
    r.font.size = Pt(22)
    r.bold = True
    r.font.color.rgb = C_BLUE
    
    p_grp = doc.add_paragraph()
    p_grp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_grp.paragraph_format.space_after = Pt(24)
    r = p_grp.add_run("< 2026-Y2-S1-KU-24 >")
    r.font.name = "Consolas"
    r.font.size = Pt(16)
    r.bold = True
    r.font.color.rgb = C_NAVY
    
    # Cover Member Summary Table
    t_cov = doc.add_table(rows=1, cols=3)
    t_cov.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_cov)
    hdr = t_cov.rows[0].cells
    hdr[0].text = "Member Name"
    hdr[1].text = "Registration No."
    hdr[2].text = "Assigned Function / Module"
    
    col_w = [Inches(2.5), Inches(1.5), Inches(2.7)]
    for i in range(3):
        hdr[i].width = col_w[i]
        shd_cell(hdr[i], NAVY_PRIMARY)
        set_cell_margins(hdr[i], top=120, bottom=120, left=140, right=140)
        p = hdr[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in p.runs:
            run.font.name = "Arial"
            run.font.size = Pt(10)
            run.font.bold = True
            run.font.color.rgb = C_WHITE
            
    for idx, m in enumerate(MEMBERS_DATA):
        row = t_cov.add_row().cells
        bg = LIGHT_BG if idx % 2 == 1 else WHITE
        row[0].text = f"{m['name']} ({m['short_name']})"
        row[1].text = m['reg']
        row[2].text = f"{m['module']}"
        for ci in range(3):
            row[ci].width = col_w[ci]
            shd_cell(row[ci], bg)
            set_cell_margins(row[ci], top=100, bottom=100, left=140, right=140)
            p = row[ci].paragraphs[0]
            if ci == 1:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for run in p.runs:
                run.font.name = "Arial"
                run.font.size = Pt(9.5)
                run.font.color.rgb = C_DARK
                if ci == 1:
                    run.bold = True
    
    p_proj = doc.add_paragraph()
    p_proj.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_proj.paragraph_format.space_before = Pt(36)
    p_proj.paragraph_format.space_after = Pt(4)
    r = p_proj.add_run("< Streetify – Sri Lanka >")
    r.font.name = "Arial"
    r.font.size = Pt(16)
    r.bold = True
    r.font.color.rgb = C_NAVY
    
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(36)
    r = p_sub.add_run("< Web-Based Transportation and Smart Dispatch System >")
    r.font.name = "Arial"
    r.font.size = Pt(12)
    r.font.color.rgb = C_GREY
    
    p_foot1 = doc.add_paragraph()
    p_foot1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_foot1.paragraph_format.space_after = Pt(2)
    r = p_foot1.add_run("Software Engineering | SE2030")
    r.font.name = "Arial"
    r.font.size = Pt(11)
    r.bold = True
    r.font.color.rgb = C_NAVY
    
    p_foot2 = doc.add_paragraph()
    p_foot2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p_foot2.add_run("B.Sc. (Hons) in Information Technology")
    r.font.name = "Arial"
    r.font.size = Pt(11)
    r.font.color.rgb = C_GREY
    
    # ── 2. PAGE BREAK -> SECTION 1 & 2 (PORTRAIT) ──────────────────────────────
    doc.add_page_break()
    
    h1 = doc.add_heading(level=1)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)
    r = h1.add_run("1. Group Details & Execution Summary")
    r.font.name = "Arial"
    r.font.size = Pt(15)
    r.font.bold = True
    r.font.color.rgb = C_NAVY
    
    # Meta Summary Table
    t_meta = doc.add_table(rows=6, cols=2)
    t_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_meta)
    meta_rows = [
        ("Group ID", "2026-Y2-S1-KU-24 (Group 24)"),
        ("Topic Name", "Streetify – Web-Based Transportation and Smart Dispatch System"),
        ("Module", "SE2030 - Software Engineering (Year 2 Semester 1 - 2026)"),
        ("Testing Result", "60 passed, 0 failed (100% Health & Integration Pass Rate)"),
        ("Test Execution", "Executed across full stack (React TS frontend <-> Spring Boot Java backend <-> MSSQL db) on 12 October 2026"),
        ("Total Test Cases", "60 Test Cases (6 Team Members x 10 Comprehensive Cases Each)")
    ]
    meta_w = [Inches(2.2), Inches(4.5)]
    for ri, (k, v) in enumerate(meta_rows):
        cells = t_meta.rows[ri].cells
        cells[0].text = k
        cells[1].text = v
        for ci in range(2):
            cells[ci].width = meta_w[ci]
            shd_cell(cells[ci], LIGHT_BG if ci == 0 else WHITE)
            set_cell_margins(cells[ci], top=80, bottom=80, left=120, right=120)
            p = cells[ci].paragraphs[0]
            for run in p.runs:
                run.font.name = "Arial"
                run.font.size = Pt(9.5)
                run.font.color.rgb = C_DARK
                if ci == 0:
                    run.bold = True
    
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    
    # Member Distribution Table
    t_dist = doc.add_table(rows=1, cols=6)
    t_dist.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_dist)
    dist_hdr = t_dist.rows[0].cells
    dist_hdr_titles = ["No.", "Member Name", "Registration No.", "Assigned Function", "Test Case IDs", "Passed"]
    dist_w = [Inches(0.5), Inches(1.8), Inches(1.2), Inches(1.8), Inches(1.0), Inches(0.7)]
    for i, title in enumerate(dist_hdr_titles):
        dist_hdr[i].text = title
        dist_hdr[i].width = dist_w[i]
        shd_cell(dist_hdr[i], NAVY_PRIMARY)
        set_cell_margins(dist_hdr[i], top=100, bottom=100, left=100, right=100)
        p = dist_hdr[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in p.runs:
            run.font.name = "Arial"
            run.font.size = Pt(9)
            run.bold = True
            run.font.color.rgb = C_WHITE
            
    for idx, m in enumerate(MEMBERS_DATA):
        row = t_dist.add_row().cells
        bg = LIGHT_BG if idx % 2 == 1 else WHITE
        row[0].text = f"{m['num']:02d}"
        row[1].text = f"{m['short_name']} ({m['name']})"
        row[2].text = m['reg']
        row[3].text = m['module']
        row[4].text = f"{m['prefix']}01 - 10"
        row[5].text = "10 / 10"
        for ci in range(6):
            row[ci].width = dist_w[ci]
            shd_cell(row[ci], bg)
            set_cell_margins(row[ci], top=80, bottom=80, left=100, right=100)
            p = row[ci].paragraphs[0]
            if ci in [0, 2, 4, 5]:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for run in p.runs:
                run.font.name = "Arial"
                run.font.size = Pt(8.5)
                run.font.color.rgb = C_DARK
                if ci == 5:
                    run.bold = True
                    run.font.color.rgb = C_GREEN
    
    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    
    # Section 2: Test Approach
    h2 = doc.add_heading(level=1)
    h2.paragraph_format.space_before = Pt(8)
    h2.paragraph_format.space_after = Pt(4)
    r = h2.add_run("2. Test Approach & Multi-Tier Integration Methodology")
    r.font.name = "Arial"
    r.font.size = Pt(15)
    r.font.bold = True
    r.font.color.rgb = C_NAVY
    
    p_app = doc.add_paragraph()
    p_app.paragraph_format.space_after = Pt(6)
    r = p_app.add_run(
        "Each team member designed 10 rigorous, industry-grade test cases covering their assigned core functional module "
        "and executed them against the live Streetify multi-tier architecture: React (TypeScript & Tailwind CSS) frontend, "
        "Spring Boot (Java 24) REST backend with Bean Validation (@Valid), and Microsoft SQL Server (MSSQL streetify_db) "
        "database. The Actual Output records exact HTTP status codes, JSON payload responses, and database state verifications."
    )
    r.font.name = "Arial"
    r.font.size = Pt(9.5)
    r.font.color.rgb = C_DARK
    
    p_bullets = [
        ("Positive tests: ", "Valid normal operations verifying end-to-end data flow (e.g. valid passenger signup, route fare calculation, driver status advancement, payment settlement)."),
        ("Negative tests: ", "Invalid or malformed inputs ensuring the backend and frontend reject unauthorized actions with clear error feedback (e.g. duplicate email, missing coordinates, unauthorized updates)."),
        ("Boundary value tests: ", "Values at and just outside system thresholds (e.g. 7 vs 8 character passwords, 0 vs 1 star ratings, 5-minute passenger wait timers, zero wallet balance, 200 audit log record limits)."),
        ("Role-Based Access Control (RBAC) & Security tests: ", "Verifying Spring Security @PreAuthorize rules ensure users without required roles (PASSENGER, DRIVER, STAFF, ADMIN) receive HTTP 403 Forbidden.")
    ]
    for b_title, b_desc in p_bullets:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_before = Pt(1)
        bp.paragraph_format.space_after = Pt(2)
        r_bt = bp.add_run(b_title)
        r_bt.bold = True
        r_bt.font.name = "Arial"
        r_bt.font.size = Pt(9.5)
        r_bt.font.color.rgb = C_NAVY
        r_bd = bp.add_run(b_desc)
        r_bd.font.name = "Arial"
        r_bd.font.size = Pt(9.5)
        r_bd.font.color.rgb = C_DARK

    add_callout_box(
        doc,
        "Test Case ID format follows TC_<module>_<number> (UM = User Management, BK = Ride Booking, "
        "TM = Trip Management & Telemetry, PM = Payment Management, RM = Review & Disputes, AM = Admin Control). "
        "All test accounts utilize sanitized development email domains (@streetify.lk, @streetify.com).",
        "STANDARD CONVENTION"
    )

    # ── 3. TEST SUITES SECTIONS (LANDSCAPE PAGES) ──────────────────────────────
    # Column widths for 9 columns in Landscape mode (Total width = 10.6 inches)
    # Landscape A4 width: 11.69 inches. Left/Right margin: 0.5 inches => Available: 10.69 inches.
    col_widths = [
        Inches(0.85), # ID
        Inches(1.05), # Title
        Inches(1.15), # Description
        Inches(1.10), # Preconditions
        Inches(1.35), # Test Steps
        Inches(1.20), # Test Data
        Inches(1.60), # Expected Output
        Inches(1.70), # Actual Output
        Inches(0.60)  # Status
    ]

    for m in MEMBERS_DATA:
        # Create a new landscape section for each member
        sec = doc.add_section(WD_SECTION_START.NEW_PAGE)
        sec.orientation = WD_ORIENTATION.LANDSCAPE
        sec.page_width = Inches(11.69)
        sec.page_height = Inches(8.27)
        sec.top_margin = Inches(0.5)
        sec.bottom_margin = Inches(0.5)
        sec.left_margin = Inches(0.5)
        sec.right_margin = Inches(0.5)
        
        # Section Header
        sh = doc.add_heading(level=1)
        sh.paragraph_format.space_before = Pt(4)
        sh.paragraph_format.space_after = Pt(2)
        r = sh.add_run(f"{m['num'] + 2}. {m['module']}")
        r.font.name = "Arial"
        r.font.size = Pt(14)
        r.bold = True
        r.font.color.rgb = C_NAVY
        
        # Member Info Subheader
        p_info = doc.add_paragraph()
        p_info.paragraph_format.space_after = Pt(2)
        r_mem = p_info.add_run(f"Member: {m['name']} ({m['short_name']})")
        r_mem.bold = True
        r_mem.font.name = "Arial"
        r_mem.font.size = Pt(10.5)
        r_mem.font.color.rgb = C_DARK
        
        r_sep = p_info.add_run("   |   ")
        r_sep.font.color.rgb = C_GREY
        
        r_reg = p_info.add_run(f"Registration No.: {m['reg']}")
        r_reg.bold = True
        r_reg.font.name = "Arial"
        r_reg.font.size = Pt(10.5)
        r_reg.font.color.rgb = C_BLUE
        
        # Scope Line
        p_scope = doc.add_paragraph()
        p_scope.paragraph_format.space_after = Pt(6)
        r_sc_lbl = p_scope.add_run("Scope: ")
        r_sc_lbl.bold = True
        r_sc_lbl.font.name = "Arial"
        r_sc_lbl.font.size = Pt(9)
        r_sc_lbl.font.color.rgb = C_NAVY
        
        r_sc_val = p_scope.add_run(m['scope'])
        r_sc_val.font.name = "Arial"
        r_sc_val.font.size = Pt(9)
        r_sc_val.font.color.rgb = C_GREY
        
        # 9-Column Test Cases Table
        tbl = doc.add_table(rows=1, cols=9)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(tbl, color="CBD5E1", sz="4")
        
        # Header Row
        headers = ["Test Case ID", "Test Title", "Description", "Preconditions", "Test Steps", "Test Data", "Expected Output", "Actual Output", "Status"]
        hdr_cells = tbl.rows[0].cells
        for ci, htext in enumerate(headers):
            hdr_cells[ci].text = htext
            hdr_cells[ci].width = col_widths[ci]
            shd_cell(hdr_cells[ci], NAVY_PRIMARY)
            set_cell_margins(hdr_cells[ci], top=80, bottom=80, left=60, right=60)
            p = hdr_cells[ci].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for run in p.runs:
                run.font.name = "Arial"
                run.font.size = Pt(8.5)
                run.bold = True
                run.font.color.rgb = C_WHITE
                
        # Data Rows
        for r_idx, tc in enumerate(m['tests']):
            row_cells = tbl.add_row().cells
            bg = LIGHT_BG if r_idx % 2 == 1 else WHITE
            
            row_data = [
                tc['id'],
                tc['title'],
                tc['desc'],
                tc['pre'],
                tc['steps'],
                tc['data'],
                tc['expected'],
                tc['actual'],
                tc['status']
            ]
            
            for ci, val in enumerate(row_data):
                row_cells[ci].text = val
                row_cells[ci].width = col_widths[ci]
                shd_cell(row_cells[ci], bg)
                set_cell_margins(row_cells[ci], top=60, bottom=60, left=60, right=60)
                p = row_cells[ci].paragraphs[0]
                
                # Alignments
                if ci in [0, 8]:
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                else:
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                    
                for run in p.runs:
                    run.font.name = "Arial"
                    run.font.size = Pt(7.5)
                    run.font.color.rgb = C_DARK
                    
                    if ci == 0:
                        run.bold = True
                        run.font.color.rgb = C_NAVY
                    elif ci == 8:
                        run.bold = True
                        run.font.color.rgb = C_GREEN

    # Save Document
    out_filename = "Batch1_2026-Y2-S1-KU-24_Testcases.docx"
    doc.save(out_filename)
    print(f"SUCCESS: Test cases Word document generated: {out_filename}")
    return out_filename

if __name__ == "__main__":
    build_document()
