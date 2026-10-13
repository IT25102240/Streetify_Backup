"""
generate_final_report_guide_doc.py
==================================
Builds the complete SLIIT SE2030 Final Report Blueprint & Writing Guide for Streetify.
Outputs:
  - Streetify_Final_Report_Guide.docx
Followed by PowerShell Word COM conversion to:
  - Streetify_Final_Report_Guide.pdf

Group: 2026-Y2-S1-KU-24 (Group 24, Batch 1)
Optimized for mobile viewing, clarity, visual hierarchy, and full 30-mark rubric coverage.
"""

import os
import sys
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

# ── Color Palette ─────────────────────────────────────────────────────────────
HEX_NAVY    = "0D2B55"      # Dark Navy Blue (Primary Brand)
HEX_ROYAL   = "1A56DB"      # Royal Blue (Secondary Accent)
HEX_LIGHT_BG= "F4F6F9"      # Light grey/blue background for zebra rows
HEX_CARD_BG = "EBF2FE"      # Light blue for Canva tip cards & callout boxes
HEX_BORDER  = "D1D5DB"      # Subtle grey border
HEX_WHITE   = "FFFFFF"      # White
HEX_CODE_BG = "1E293B"      # Dark Slate for code snippets
HEX_GREEN   = "059669"      # Green for high priority / pass
HEX_ORANGE  = "D97706"      # Orange for medium priority

C_NAVY   = RGBColor(0x0D, 0x2B, 0x55)
C_ROYAL  = RGBColor(0x1A, 0x56, 0xDB)
C_DARK   = RGBColor(0x1F, 0x29, 0x37)
C_GREY   = RGBColor(0x4B, 0x55, 0x63)
C_WHITE  = RGBColor(0xFF, 0xFF, 0xFF)
C_GREEN  = RGBColor(0x05, 0x96, 0x69)
C_ORANGE = RGBColor(0xD9, 0x77, 0x06)
C_CODE   = RGBColor(0xE2, 0xE8, 0xF0)

# ── XML Styling Helpers ────────────────────────────────────────────────────────

def shd_cell(cell, hex_color):
    """Sets background shading of a table cell."""
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_color)
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    """Sets internal cell margins in dxa (1 pt = 20 dxa)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color="D1D5DB", sz="4"):
    """Applies neat borders across all table cells."""
    tblPr = table._tbl.tblPr
    tblBorders = OxmlElement('w:tblBorders')
    for b_name in ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']:
        b = OxmlElement(f'w:{b_name}')
        b.set(qn('w:val'), 'single')
        b.set(qn('w:sz'), sz)
        b.set(qn('w:space'), '0')
        b.set(qn('w:color'), color)
        tblBorders.append(b)
    tblPr.append(tblBorders)

def set_callout_border(cell, color="1A56DB", sz="24"):
    """Applies a thick left accent border and clears top/right/bottom."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    
    # Left border: thick accent
    left = OxmlElement('w:left')
    left.set(qn('w:val'), 'single')
    left.set(qn('w:sz'), sz)
    left.set(qn('w:space'), '0')
    left.set(qn('w:color'), color)
    tcBorders.append(left)
    
    # Others: none
    for b_name in ['top', 'bottom', 'right']:
        b = OxmlElement(f'w:{b_name}')
        b.set(qn('w:val'), 'none')
        tcBorders.append(b)
        
    tcPr.append(tcBorders)

# ── Document Elements Builders ────────────────────────────────────────────────

def add_heading_1(doc, text, icon=""):
    """Adds a primary Section Heading (Heading 1)."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(16)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    
    prefix = f"{icon} " if icon else ""
    r = p.add_run(f"{prefix}{text.upper()}")
    r.bold = True
    r.font.name = "Arial"
    r.font.size = Pt(14)
    r.font.color.rgb = C_NAVY
    return p

def add_heading_2(doc, text, icon=""):
    """Adds a Subsection Heading (Heading 2)."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(11)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    
    prefix = f"{icon} " if icon else ""
    r = p.add_run(f"{prefix}{text}")
    r.bold = True
    r.font.name = "Arial"
    r.font.size = Pt(11.5)
    r.font.color.rgb = C_ROYAL
    return p

def add_heading_3(doc, text):
    """Adds a Sub-subsection Heading (Heading 3)."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    
    r = p.add_run(text)
    r.bold = True
    r.font.name = "Arial"
    r.font.size = Pt(10)
    r.font.color.rgb = C_DARK
    return p

def add_body_p(doc, text, bold_prefix="", italic=False):
    """Adds standard clean paragraph."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(5)
    p.paragraph_format.line_spacing = 1.15
    
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.bold = True
        r_pre.font.name = "Arial"
        r_pre.font.size = Pt(9.5)
        r_pre.font.color.rgb = C_DARK
        
    r = p.add_run(text)
    r.italic = italic
    r.font.name = "Arial"
    r.font.size = Pt(9.5)
    r.font.color.rgb = C_DARK
    return p

def add_bullet_p(doc, text, bold_prefix=""):
    """Adds bullet item with indent."""
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.bold = True
        r_pre.font.name = "Arial"
        r_pre.font.size = Pt(9.5)
        r_pre.font.color.rgb = C_DARK
        
    r = p.add_run(text)
    r.font.name = "Arial"
    r.font.size = Pt(9.5)
    r.font.color.rgb = C_DARK
    return p

def add_card_box(doc, title, bullet_items, icon="🎨", bg_hex=HEX_CARD_BG, border_color=HEX_ROYAL):
    """Creates an attractive card box for Canva Tips, Notes, and Highlights."""
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.rows[0].cells[0]
    cell.width = Inches(7.1)
    shd_cell(cell, bg_hex)
    set_cell_margins(cell, top=120, bottom=120, left=180, right=160)
    set_callout_border(cell, color=border_color, sz="24")
    
    # Title paragraph inside card
    p_title = cell.paragraphs[0]
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(4)
    r_title = p_title.add_run(f"{icon} {title}")
    r_title.bold = True
    r_title.font.name = "Arial"
    r_title.font.size = Pt(10)
    r_title.font.color.rgb = C_ROYAL
    
    # Items inside card
    for item in bullet_items:
        p_item = cell.add_paragraph()
        p_item.paragraph_format.space_before = Pt(1)
        p_item.paragraph_format.space_after = Pt(2)
        p_item.paragraph_format.left_indent = Inches(0.15)
        
        r_dot = p_item.add_run("• ")
        r_dot.bold = True
        r_dot.font.color.rgb = C_ROYAL
        
        if isinstance(item, tuple):
            prefix, text = item
            r_p = p_item.add_run(prefix)
            r_p.bold = True
            r_p.font.name = "Arial"
            r_p.font.size = Pt(9)
            r_p.font.color.rgb = C_DARK
            
            r_t = p_item.add_run(text)
            r_t.font.name = "Arial"
            r_t.font.size = Pt(9)
            r_t.font.color.rgb = C_DARK
        else:
            r_t = p_item.add_run(item)
            r_t.font.name = "Arial"
            r_t.font.size = Pt(9)
            r_t.font.color.rgb = C_DARK
            
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def add_code_snippet(doc, code_text, caption=""):
    """Adds a dark-themed code block for formulas and schemas."""
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.rows[0].cells[0]
    cell.width = Inches(7.1)
    shd_cell(cell, HEX_CODE_BG)
    set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
    
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for b_name in ['top', 'bottom', 'left', 'right']:
        b = OxmlElement(f'w:{b_name}')
        b.set(qn('w:val'), 'single')
        b.set(qn('w:sz'), '6')
        b.set(qn('w:space'), '0')
        b.set(qn('w:color'), '334155')
        tcBorders.append(b)
    tcPr.append(tcBorders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    
    for i, line in enumerate(code_text.split("\n")):
        if i > 0:
            p = cell.add_paragraph()
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.05
            
        r = p.add_run(line)
        r.font.name = "Consolas"
        r.font.size = Pt(8.5)
        r.font.color.rgb = C_CODE
        
    if caption:
        p_cap = doc.add_paragraph()
        p_cap.paragraph_format.space_before = Pt(2)
        p_cap.paragraph_format.space_after = Pt(6)
        r_c = p_cap.add_run(f"Figure: {caption}")
        r_c.italic = True
        r_c.font.size = Pt(8.5)
        r_c.font.color.rgb = C_GREY
    else:
        doc.add_paragraph().paragraph_format.space_after = Pt(3)

# ── Main Document Construction ────────────────────────────────────────────────

def build_streetify_final_guide():
    doc = Document()
    
    # ── Page Setup (Portrait, 0.7" margins for maximum mobile screen area)
    section = doc.sections[0]
    section.top_margin = Inches(0.7)
    section.bottom_margin = Inches(0.7)
    section.left_margin = Inches(0.7)
    section.right_margin = Inches(0.7)
    section.page_width = Inches(8.5)
    section.page_height = Inches(11.0)
    
    # Header & Footer
    hdr = section.header
    p_hdr = hdr.paragraphs[0]
    p_hdr.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r_hdr = p_hdr.add_run("Streetify — SLIIT SE2030 Final Report Blueprint & Rubric Guide")
    r_hdr.font.name = "Arial"
    r_hdr.font.size = Pt(8)
    r_hdr.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)
    
    ftr = section.footer
    p_ftr = ftr.paragraphs[0]
    p_ftr.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_ftr = p_ftr.add_run("Group 2026-Y2-S1-KU-24 (Group 24, Batch 1) | Streetify Urban Ride-Hailing Platform")
    r_ftr.font.name = "Arial"
    r_ftr.font.size = Pt(8)
    r_ftr.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)

    # ════════════════════════════════════════════════════════════════════════════
    # COVER PAGE
    # ════════════════════════════════════════════════════════════════════════════
    p_top = doc.add_paragraph()
    p_top.paragraph_format.space_before = Pt(12)
    p_top.paragraph_format.space_after = Pt(4)
    r_uni = p_top.add_run("SRI LANKA INSTITUTE OF INFORMATION TECHNOLOGY (SLIIT)\nFACULTY OF COMPUTING — DEPARTMENT OF SOFTWARE ENGINEERING")
    r_uni.bold = True
    r_uni.font.name = "Arial"
    r_uni.font.size = Pt(10)
    r_uni.font.color.rgb = C_ROYAL
    
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(8)
    p_title.paragraph_format.space_after = Pt(2)
    r_t = p_title.add_run("STREETIFY")
    r_t.bold = True
    r_t.font.name = "Arial"
    r_t.font.size = Pt(26)
    r_t.font.color.rgb = C_NAVY
    
    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(12)
    r_sub = p_sub.add_run("Web-Based Urban Transportation & Smart Dispatch Platform\nFINAL SOFTWARE ENGINEERING REPORT MASTER WRITING BLUEPRINT")
    r_sub.bold = True
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(12)
    r_sub.font.color.rgb = C_ROYAL
    
    # Meta Box
    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.space_before = Pt(0)
    p_meta.paragraph_format.space_after = Pt(12)
    p_meta.paragraph_format.line_spacing = 1.2
    runs = [
        ("Module: ", "SE2030 – Software Engineering (Year 2 Semester 1 – 2026)\n"),
        ("Group ID: ", "2026-Y2-S1-KU-24 (Group 24, Batch 1)\n"),
        ("Project Scope: ", "Full-Stack Ride Hailing (React Vite + Spring Boot 3 + MSSQL)\n"),
        ("Report Target: ", "30/30 Marks (Strict alignment with evaluation rubric)"),
    ]
    for b_lbl, val in runs:
        r_l = p_meta.add_run(b_lbl)
        r_l.bold = True
        r_l.font.size = Pt(9.5)
        r_l.font.color.rgb = C_NAVY
        r_v = p_meta.add_run(val)
        r_v.font.size = Pt(9.5)
        r_v.font.color.rgb = C_DARK

    # Group Members Table
    p_lbl = doc.add_paragraph()
    p_lbl.paragraph_format.space_before = Pt(4)
    p_lbl.paragraph_format.space_after = Pt(4)
    r_lbl = p_lbl.add_run("PROJECT TEAM & MODULE OWNERSHIP")
    r_lbl.bold = True
    r_lbl.font.size = Pt(10)
    r_lbl.font.color.rgb = C_NAVY

    members = [
        ("A.R.L.P. Nayanamina (Lahiru)", "IT25102208", "User Account Management", "User Account & Verification Module"),
        ("W.A.C.B. Dharmakeerthi (Chanuka)", "IT25102207", "Ride Booking & Management", "Ride Booking & Dispatch Engine"),
        ("K.A.T. Senaka (Tharindu)", "IT25102241", "Driver Trip Request Management", "Trip Progress & Telemetry"),
        ("E.A.R.N.D. Edirisinghe (Daham)", "IT25102225", "Payment and Receipt Management", "Payment & Ledger Management"),
        ("W.A.M.B. Weerasingha (Mithun)", "IT25102193", "Review, Rating & Feedback", "Review & Dispute Form"),
        ("R.V.S. Rammandalagedara (Vidura)", "IT25102240", "Administration & System Control", "Admin Governance & System Control"),
    ]

    t_m = doc.add_table(rows=1, cols=4)
    t_m.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_m)
    widths_m = [Inches(2.1), Inches(1.1), Inches(1.9), Inches(2.0)]
    
    headers_m = ["Student Name", "Student ID", "Core Function", "Assigned Submodule"]
    for j, h in enumerate(headers_m):
        cell = t_m.rows[0].cells[j]
        cell.width = widths_m[j]
        shd_cell(cell, HEX_NAVY)
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = C_WHITE

    for idx, (name, sid, fn, sub) in enumerate(members):
        row = t_m.add_row()
        bg = HEX_LIGHT_BG if idx % 2 == 1 else HEX_WHITE
        for j, val in enumerate([name, sid, fn, sub]):
            cell = row.cells[j]
            cell.width = widths_m[j]
            shd_cell(cell, bg)
            set_cell_margins(cell, 60, 60, 100, 100)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8.5)
            if j == 0:
                r.bold = True
                r.font.color.rgb = C_NAVY
            elif j == 1:
                r.font.name = "Consolas"
                r.font.color.rgb = C_ROYAL
            else:
                r.font.color.rgb = C_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 30-Mark Rubric Summary Card
    add_card_box(
        doc,
        title="30-MARK EVALUATION CRITERIA AT A GLANCE",
        bullet_items=[
            ("Introduction (4 Marks): ", "Overview, objectives, users/stakeholders, scope, limitations."),
            ("Requirements (4 Marks): ", "Functional requirements (structured priority table), non-functional, constraints."),
            ("Design (6 Marks): ", "Use case specifications, ER schema & relationships, UI sketches & screen architecture."),
            ("Implementation (4 Marks): ", "Tech stack table, design patterns (Observer, Decorator, Factory), key functions & screenshots."),
            ("Project Management (3 Marks): ", "Agile approach, 8-sprint summaries, task distribution table, milestone roadmap."),
            ("Conclusion & Future Work (3 Marks): ", "Achievements summary, technical challenges addressed, realistic improvements."),
            ("Individual Contribution (3 Marks): ", "Meaningful reflection table where EVERY student has their own complete row."),
            ("Written Communication (3 Marks): ", "Logical structure, clear typography, professional Canva formatting, IEEE references."),
        ],
        icon="🏆",
        bg_hex="F8FAFC",
        border_color=HEX_NAVY
    )

    doc.add_page_break()

    # ════════════════════════════════════════════════════════════════════════════
    # SECTION 1 — COVER PAGE DESIGN & CANVA GUIDELINES
    # ════════════════════════════════════════════════════════════════════════════
    add_heading_1(doc, "Section 1 — Cover Page Design & Visual Standards", icon="📄")
    add_body_p(doc, "The cover page creates the first academic and professional impression for the evaluators. In your final Canva report, this must be a visually striking single-page layout adhering to modern UI/UX design standards.")

    add_heading_2(doc, "1.1 Mandatory Elements for the Cover Page")
    add_bullet_p(doc, "Full Project Title: Streetify — Smart Urban Ride-Hailing & Real-Time Dispatch Platform")
    add_bullet_p(doc, "Subtitle: Sri Lanka's Modern Web-Based Transportation Ecosystem")
    add_bullet_p(doc, "University & Faculty: Sri Lanka Institute of Information Technology (SLIIT), Faculty of Computing")
    add_bullet_p(doc, "Module & Year: SE2030 – Software Engineering (Year 2 Semester 1 – 2026)")
    add_bullet_p(doc, "Group Identification: Batch 1, Group ID: 2026-Y2-S1-KU-24")
    add_bullet_p(doc, "Complete Group Member Details: All 6 members with full name, student registration number, and assigned module")
    add_bullet_p(doc, "Date of Submission & Official GitHub Repository URL")

    add_card_box(
        doc,
        title="CANVA VISUAL LAYOUT TIPS — COVER PAGE",
        bullet_items=[
            ("Color Palette: ", "Deep Navy Blue (#0D2B55) dominant background with Royal Blue (#1A56DB) and White accents."),
            ("Branding Icon: ", "Place a custom vehicle route icon or Streetify logo at the top center with clean typography."),
            ("Background Accent: ", "Use a high-resolution dark Colombo/urban map aerial wireframe with 15% opacity."),
            ("Typography: ", "Use Montserrat Bold or Poppins Bold (28-32pt) for title, and Inter Regular for student metadata."),
            ("Tagline Strip: ", "Include a bottom colored banner: 'Empowering Urban Mobility Through Real-Time WebSocket Telemetry'."),
        ],
        icon="🎨"
    )

    # ════════════════════════════════════════════════════════════════════════════
    # SECTION 2 — INTRODUCTION (4 MARKS)
    # ════════════════════════════════════════════════════════════════════════════
    add_heading_1(doc, "Section 2 — Introduction (Rubric: 4 Marks)", icon="📝")
    add_body_p(doc, "Evaluator Criterion: Clear and detailed project overview. Objectives, users, scope, and limitations are well-defined and easy to understand (4/4 marks).")

    add_heading_2(doc, "2.1 Project Overview")
    add_body_p(doc, "Streetify is an enterprise-grade, full-stack, web-based urban transportation platform specifically engineered to modernize point-to-point urban transit across Sri Lankan metropolitan areas. Built with an event-driven three-tier architecture (React 19 TypeScript frontend, Spring Boot 3.3.4 Java 24 backend, and Microsoft SQL Server), the platform bridges passengers and licensed commercial drivers. It features real-time STOMP WebSocket dispatching, Haversine geospatial fare calculation, an ACID-compliant digital payment ledger with automated platform commission deduction, post-trip passenger feedback loops, and an immutable administrative governance console.")

    add_heading_2(doc, "2.2 System Objectives")
    objectives = [
        ("OBJ-1: Real-Time Dispatch Engine — ", "Deploy a low-latency STOMP WebSocket messaging broker enabling immediate broadcasting of trip requests from passengers to active, nearby drivers without polling delays."),
        ("OBJ-2: Geospatial Fare Engine — ", "Implement an automated fare computation model based on the Haversine spherical distance formula, standardizing vehicle-tiered pricing (Tuk-Tuk, Car, XL, Moto) in Sri Lankan Rupees (LKR)."),
        ("OBJ-3: Trip Lifecycle State Machine — ", "Enforce strict state progression (REQUESTED → ACCEPTED → EN_ROUTE → ARRIVED → IN_PROGRESS → COMPLETED) preventing invalid state bypasses and automating no-show fee penalties."),
        ("OBJ-4: ACID-Compliant Digital Ledger — ", "Support multi-mode payments (Cash, Card, Digital Wallet) ensuring transactional consistency, 15% platform commission splits, and driver debt recording."),
        ("OBJ-5: Quality Assurance & Dispute Resolution — ", "Provide verified rating aggregations and structured dispute arbitration, allowing staff to investigate complaints and issue wallet refunds."),
        ("OBJ-6: Enterprise Governance & Auditing — ", "Enforce Role-Based Access Control (RBAC), multi-tenant tab session isolation, driver document verification, and an immutable audit log trail."),
    ]
    for o_id, o_desc in objectives:
        add_bullet_p(doc, o_desc, bold_prefix=o_id)

    add_heading_2(doc, "2.3 Target Users & Stakeholders Matrix")
    users_data = [
        ("Passenger", "Commuters seeking reliable, safe, and transparent urban transport.", "Search routes on interactive maps, view upfront fare estimates, book rides, track drivers via live GPS, pay via wallet/card/cash, rate drivers, file dispute tickets."),
        ("Driver", "Registered vehicle owners seeking reliable trip dispatch and instant earnings.", "Receive live ride broadcast alerts, accept requests, navigate through state transitions, manage earnings ledger, view performance ratings."),
        ("Support Staff", "Customer service officers mediating operational disputes.", "Review submitted dispute tickets, investigate trip logs, communicate with passengers, authorize wallet refunds, inspect driver onboarding documents."),
        ("System Administrator", "Platform administrators governing system health and compliance.", "Access full CRUD tables, monitor live revenue and commission metrics, audit staff actions, suspend/unsuspend user accounts, revoke active JWT sessions."),
        ("Platform Operator", "Streetify corporate entity managing commercial operations.", "Monitors system uptime, tracks 15% transaction fee revenue, oversees driver regulatory compliance, monitors fleet-wide metrics."),
    ]
    t_u = doc.add_table(rows=1, cols=3)
    t_u.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_u)
    w_u = [Inches(1.2), Inches(2.2), Inches(3.7)]
    for j, h in enumerate(["Stakeholder", "Description / Profile", "Core Responsibilities in Streetify"]):
        cell = t_u.rows[0].cells[j]
        cell.width = w_u[j]
        shd_cell(cell, HEX_NAVY)
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = C_WHITE

    for idx, (st, desc, resp) in enumerate(users_data):
        row = t_u.add_row()
        bg = HEX_LIGHT_BG if idx % 2 == 1 else HEX_WHITE
        for j, val in enumerate([st, desc, resp]):
            cell = row.cells[j]
            cell.width = w_u[j]
            shd_cell(cell, bg)
            set_cell_margins(cell, 60, 60, 100, 100)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8.5)
            if j == 0:
                r.bold = True
                r.font.color.rgb = C_NAVY
            else:
                r.font.color.rgb = C_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_heading_2(doc, "2.4 Scope and Limitations")
    add_body_p(doc, "Clearly defining the boundaries ensures realistic project evaluation and transparency regarding operational context.")
    
    add_heading_3(doc, "In-Scope Boundaries (Fully Implemented & Verified):")
    add_bullet_p(doc, "Full passenger and driver authentication with BCrypt hashing and role-based JWT issuance.")
    add_bullet_p(doc, "Geospatial fare estimation across 4 vehicle tiers using the Haversine formula and OpenStreetMap coordinates.")
    add_bullet_p(doc, "Real-time dispatch broadcasting via STOMP WebSocket topic channels (/topic/trips).")
    add_bullet_p(doc, "Comprehensive 6-state lifecycle tracking with 5-minute no-show cancellation fee enforcement.")
    add_bullet_p(doc, "Tri-modal payment settlement (Cash with debt ledger, Card with 3-retry loop, and Digital Wallet debit).")
    add_bullet_p(doc, "Driver rating recalculation and dispute arbitration with wallet refund capabilities.")
    add_bullet_p(doc, "Full-scale administrative dashboard covering all 8 database tables with immutable audit logging.")

    add_heading_3(doc, "Out-of-Scope Limitations (Academic Context & Boundaries):")
    add_bullet_p(doc, "Native mobile OS binaries (iOS .ipa / Android .apk) — fully responsive web client built for desktop/tablet/mobile browsers.")
    add_bullet_p(doc, "Live production banking gateways (PayHere/Commercial Bank API) — simulated via 3DS card payment simulation engine.")
    add_bullet_p(doc, "SMS/Email gateway integration — password reset OTPs are outputted to backend application logs for viva evaluation.")
    add_bullet_p(doc, "Multi-region distributed database replication — executed on localized Microsoft SQL Server instance.")

    add_card_box(
        doc,
        title="CANVA VISUAL LAYOUT TIPS — INTRODUCTION SECTION",
        bullet_items=[
            ("Two-Column Layout: ", "Place the project overview and objectives on the left; use a 3-tier box diagram on the right."),
            ("Stakeholder Grid: ", "Render the 4 primary stakeholders as modern cards with vector avatars and bullet points."),
            ("Scope Comparison Box: ", "Create a side-by-side green (In-Scope) and amber (Out-of-Scope) comparison card with checkmark and cross icons."),
        ],
        icon="🎨"
    )

    doc.add_page_break()

    # ════════════════════════════════════════════════════════════════════════════
    # SECTION 3 — REQUIREMENTS SPECIFICATION (4 MARKS)
    # ════════════════════════════════════════════════════════════════════════════
    add_heading_1(doc, "Section 3 — System Requirements Specification (Rubric: 4 Marks)", icon="📋")
    add_body_p(doc, "Evaluator Criterion: Functional, non-functional, and constraints well-defined and structured (4/4 marks).")

    add_heading_2(doc, "3.1 Functional Requirements (FR)")
    add_body_p(doc, "The functional requirements encompass all user interactions, domain operations, and system business rules implemented across the Streetify platform.")

    fr_data = [
        ("FR01", "User Registration", "Allow passengers and drivers to register with email, phone, name, and 8+ char password. Hash with BCrypt (strength 12).", "High"),
        ("FR02", "Driver Compliance Verification", "Collect driver NIC, driving license, and vehicle details. Enforce Sri Lankan phone format (+94 or 0 prefix).", "High"),
        ("FR03", "Role-Based Authentication", "Authenticate users via JWT access tokens (15-min expiry) and refresh tokens (7-day). Authorize endpoints by role.", "High"),
        ("FR04", "Haversine Fare Estimation", "Compute geodesic distance and upfront fare based on pickup/dropoff coordinates, base fare, and per-km rate.", "High"),
        ("FR05", "Real-Time Trip Broadcasting", "Broadcast REQUESTED trips to all online drivers through WebSocket STOMP topic (/topic/trips).", "High"),
        ("FR06", "Lifecycle State Machine", "Enforce strict state flow: REQUESTED → ACCEPTED → EN_ROUTE → ARRIVED → IN_PROGRESS → COMPLETED.", "High"),
        ("FR07", "No-Show Fee Enforcement", "Charge LKR 100 no-show fee if passenger fails to appear within 5 minutes of driver reaching ARRIVED state.", "Medium"),
        ("FR08", "Tri-Modal Payment Settlement", "Process payments via Cash, Card, or Wallet; automate 15% platform commission and 85% driver net earnings.", "High"),
        ("FR09", "Duplicate Payment Guard", "Prevent double billing on completed trips via unique constraints and transaction rollback.", "High"),
        ("FR10", "Driver Rating & Recalculation", "Accept 1-5 star ratings for completed trips and recalculate driver's rolling average rating automatically.", "Medium"),
        ("FR11", "Dispute Resolution & Refunds", "Allow passengers to submit dispute tickets; allow support staff to resolve tickets with optional wallet refunds.", "Medium"),
        ("FR12", "User Account Governance", "Allow Admins to suspend/unsuspend user accounts with mandatory reason logging in audit_logs.", "High"),
        ("FR13", "Executive Dashboard KPIs", "Provide real-time statistics: total users, active drivers, completed trips, revenue, and pending disputes.", "Medium"),
        ("FR14", "Document Verification Workflow", "Enable Staff/Admin to inspect and approve/reject driver licenses, registrations, and insurance documents.", "High"),
        ("FR15", "Remote Session Revocation", "Broadcast force-logout signals over WebSocket to terminate compromised or suspended user sessions.", "Low"),
    ]

    t_fr = doc.add_table(rows=1, cols=4)
    t_fr.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_fr)
    w_fr = [Inches(0.9), Inches(1.8), Inches(3.6), Inches(0.8)]
    for j, h in enumerate(["ID", "Requirement Title", "Detailed Functional Description", "Priority"]):
        cell = t_fr.rows[0].cells[j]
        cell.width = w_fr[j]
        shd_cell(cell, HEX_NAVY)
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = C_WHITE

    for idx, (fid, title, desc, prio) in enumerate(fr_data):
        row = t_fr.add_row()
        bg = HEX_LIGHT_BG if idx % 2 == 1 else HEX_WHITE
        for j, val in enumerate([fid, title, desc, prio]):
            cell = row.cells[j]
            cell.width = w_fr[j]
            shd_cell(cell, bg)
            set_cell_margins(cell, 60, 60, 100, 100)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8.5)
            if j == 0:
                r.bold = True
                r.font.name = "Consolas"
                r.font.color.rgb = C_NAVY
            elif j == 1:
                r.bold = True
                r.font.color.rgb = C_DARK
            elif j == 3:
                r.bold = True
                if val == "High":
                    r.font.color.rgb = C_GREEN
                elif val == "Medium":
                    r.font.color.rgb = C_ORANGE
                else:
                    r.font.color.rgb = C_GREY
            else:
                r.font.color.rgb = C_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_heading_2(doc, "3.2 Non-Functional Requirements (NFR)")
    nfr_data = [
        ("NFR01", "Security & Encryption", "BCrypt hashing (strength 12) for all credentials. HMAC-SHA256 JWT tokens. SQL injection immunity through JPA parameterized queries. Cross-Origin Resource Sharing (CORS) restricted to authorized origins."),
        ("NFR02", "Performance & Latency", "REST API endpoint responses resolve in under 500ms under standard loads. WebSocket GPS telemetry broadcasts propagate to clients in under 150ms."),
        ("NFR03", "Data Integrity & Consistency", "Financial transactions maintain strict ACID properties using Spring @Transactional boundaries. Any mid-flight payment exception triggers atomic rollback."),
        ("NFR04", "Usability & Responsiveness", "Single-Page Application (SPA) with responsive Tailwind CSS. Zero layout breakdown across 360px (mobile) to 1920px (desktop) viewports."),
        ("NFR05", "Maintainability & Clean Code", "Strict separation of concerns (Controller → Service → DAO → Entity). Jakarta Bean Validation prevents invalid DTO payloads from reaching services."),
        ("NFR06", "Scalability & Statelessness", "Stateless session design enables horizontal scaling behind a reverse proxy. STOMP message broker is decoupling client-server communication."),
        ("NFR07", "Auditability & Traceability", "All administrative state mutations (account lockouts, document decisions, refunds) append immutable audit logs with actor timestamp and IP."),
        ("NFR08", "System Availability", "Resilient error handling via GlobalExceptionHandler prevents unhandled exceptions from terminating backend services."),
    ]
    t_nfr = doc.add_table(rows=1, cols=3)
    t_nfr.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_nfr)
    w_nfr = [Inches(1.0), Inches(1.8), Inches(4.3)]
    for j, h in enumerate(["NFR ID", "Quality Dimension", "Requirement Specification & Criteria"]):
        cell = t_nfr.rows[0].cells[j]
        cell.width = w_nfr[j]
        shd_cell(cell, HEX_NAVY)
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = C_WHITE

    for idx, (nid, dim, spec) in enumerate(nfr_data):
        row = t_nfr.add_row()
        bg = HEX_LIGHT_BG if idx % 2 == 1 else HEX_WHITE
        for j, val in enumerate([nid, dim, spec]):
            cell = row.cells[j]
            cell.width = w_nfr[j]
            shd_cell(cell, bg)
            set_cell_margins(cell, 60, 60, 100, 100)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8.5)
            if j == 0:
                r.bold = True
                r.font.name = "Consolas"
                r.font.color.rgb = C_ROYAL
            elif j == 1:
                r.bold = True
                r.font.color.rgb = C_DARK
            else:
                r.font.color.rgb = C_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_heading_2(doc, "3.3 System Constraints & Environmental Boundaries")
    add_bullet_p(doc, "Runtime & Toolchain Constraints: Backend requires Java SE Development Kit 24 with Spring Boot 3.3.4. Frontend requires Node.js v18+ and Vite 6 build engine.")
    add_bullet_p(doc, "Database Constraints: Built on Microsoft SQL Server 2022 (Express or Developer Edition). Relies on T-SQL dialect, triggers, and stored procedures.")
    add_bullet_p(doc, "Client Platform Constraints: Web-based execution across modern desktop and mobile browsers supporting WebSockets and ES6 Modules (Chrome 115+, Firefox 115+, Edge 115+, Safari 16+).")
    add_bullet_p(doc, "Network & Geospatial Dependencies: Leaflet map tiles rely on OpenStreetMap servers; requires active Internet connection to render interactive map layers.")
    add_bullet_p(doc, "Regional Locale Constraints: Pre-configured for Sri Lankan Rupee (LKR) currency formatting and Sri Lankan mobile numbering conventions (+94 / 0 prefix).")

    add_card_box(
        doc,
        title="CANVA VISUAL LAYOUT TIPS — REQUIREMENTS SECTION",
        bullet_items=[
            ("Priority Badges: ", "Render the Priority column using colored pill tags: Green for High, Orange for Medium, Slate for Low."),
            ("Quality Attribute Grid: ", "Display the 8 NFRs as a 2x4 card grid with relevant icons (Lock for Security, Lightning for Performance, Shield for Integrity)."),
            ("Constraints Callout: ", "Enclose constraints within a bordered tech badge container highlighting the Java 24 / MSSQL / React stack."),
        ],
        icon="🎨"
    )

    doc.add_page_break()

    # ════════════════════════════════════════════════════════════════════════════
    # SECTION 4 — SYSTEM DESIGN (6 MARKS)
    # ════════════════════════════════════════════════════════════════════════════
    add_heading_1(doc, "Section 4 — System Design & Architecture (Rubric: 6 Marks)", icon="🎨")
    add_body_p(doc, "Evaluator Criterion: Accurate and complete Use Case, ER diagram, and UI sketches, clearly explained (5–6/6 marks).")

    add_heading_2(doc, "4.1 Use Case Specifications & Actor Interaction Matrix")
    add_body_p(doc, "The Streetify platform coordinates four primary human actors and one external system actor across unified business workflows:")
    
    uc_matrix = [
        ("Passenger", "UC-P1: Register & Login\nUC-P2: View Fare Estimate\nUC-P3: Book Ride Request\nUC-P4: Track Driver Telemetry\nUC-P5: Pay for Trip\nUC-P6: Submit Rating & Review\nUC-P7: Submit Dispute Ticket"),
        ("Driver", "UC-D1: Register & Upload Documents\nUC-D2: Toggle Online / Offline Status\nUC-D3: Accept Broadcasted Trip\nUC-D4: Advance Trip State (En Route / Arrived / In Progress / Completed)\nUC-D5: Claim No-Show Cancellation\nUC-D6: View Earnings & Commission Debt"),
        ("Customer Support Staff", "UC-S1: Inspect Driver Registration Documents\nUC-S2: Approve / Reject Driver Credentials\nUC-S3: Review Pending Dispute Tickets\nUC-S4: Arbitrate & Resolve Disputes with Wallet Refunds"),
        ("System Administrator", "UC-A1: Authenticate via Super Admin Role\nUC-A2: Monitor Executive Real-Time KPIs\nUC-A3: Manage Full User Lifecycle (Suspend/Unsuspend)\nUC-A4: Inspect Append-Only Audit Logs\nUC-A5: Revoke Live JWT Sessions Over WebSocket\nUC-A6: Execute Database-Wide CRUD Operations"),
    ]
    t_uc = doc.add_table(rows=1, cols=2)
    t_uc.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_uc)
    w_uc = [Inches(2.0), Inches(5.1)]
    for j, h in enumerate(["System Actor", "Mapped Use Cases (docs/Batch1_2026-Y2-S1-KU-24_Usecase_Updated.pdf)"]):
        cell = t_uc.rows[0].cells[j]
        cell.width = w_uc[j]
        shd_cell(cell, HEX_NAVY)
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = C_WHITE

    for idx, (actor, ucs) in enumerate(uc_matrix):
        row = t_uc.add_row()
        bg = HEX_LIGHT_BG if idx % 2 == 1 else HEX_WHITE
        for j, val in enumerate([actor, ucs]):
            cell = row.cells[j]
            cell.width = w_uc[j]
            shd_cell(cell, bg)
            set_cell_margins(cell, 60, 60, 100, 100)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8.5)
            if j == 0:
                r.bold = True
                r.font.color.rgb = C_NAVY
            else:
                r.font.color.rgb = C_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_heading_2(doc, "4.2 Multi-Tier System Architecture")
    add_body_p(doc, "Streetify implements an enterprise Three-Tier Layered Architecture decoupling UI rendering, business orchestration, and relational data storage:")

    arch_box = (
        "┌────────────────────────────────────────────────────────────────────────┐\n"
        "│  TIER 1: PRESENTATION LAYER (React 19 + TypeScript + Vite 6)           │\n"
        "│  • Interactive Screens: Booking, Driver, Payment, Admin, Support, Profile│\n"
        "│  • Real-Time Clients: STOMP.js over SockJS WebSockets, Axios REST Client│\n"
        "│  • UI Primitives: Tailwind CSS, Leaflet OpenStreetMap Route Engine     │\n"
        "└───────────────────────────────────┬────────────────────────────────────┘\n"
        "                                    │ HTTPS REST APIs & WSS WebSocket\n"
        "┌───────────────────────────────────▼────────────────────────────────────┐\n"
        "│  TIER 2: APPLICATION & BUSINESS LAYER (Spring Boot 3.3.4, Java 24)     │\n"
        "│  • Security & Auth: Spring Security 6, JWT Filter, BCrypt Hashing      │\n"
        "│  • Domain Services: DispatchService, TripTrackingService, PaymentService│\n"
        "│  • Design Patterns: Observer (Telemetry), Decorator (Dispute), Factory │\n"
        "│  • Message Broker: SimpMessagingTemplate (STOMP WebSocket channels)    │\n"
        "└───────────────────────────────────┬────────────────────────────────────┘\n"
        "                                    │ JDBC / JPA Hibernate 6 (ACID)\n"
        "┌───────────────────────────────────▼────────────────────────────────────┐\n"
        "│  TIER 3: PERSISTENCE & DATA LAYER (Microsoft SQL Server 2022)          │\n"
        "│  • 8 Relational Tables: users, vehicles, driver_documents, trips,       │\n"
        "│                         payments, reviews, dispute_tickets, audit_logs │\n"
        "│  • Integrity: Foreign Keys, Cascade Constraints, Triggers & Procedures │\n"
        "└────────────────────────────────────────────────────────────────────────┘"
    )
    add_code_snippet(doc, arch_box, caption="Streetify Three-Tier Enterprise Architectural Flow")

    add_heading_2(doc, "4.3 Entity-Relationship (ER) Schema Specifications")
    add_body_p(doc, "The database design adheres to 3NF relational normalization while employing Single-Table Inheritance for high-performance polymorphic user querying:")

    db_tables = [
        ("users", "id (BIGINT, PK)", "email (UNIQUE)", "Polymorphic base table for Passengers, Drivers, and Admins. Dtype column discriminates roles. Stores BCrypt hash, wallet balance, active/suspended flags, and driver telemetry lat/lng."),
        ("vehicles", "id (BIGINT, PK)", "driver_id → users.id", "Stores vehicle registration data (TUK, CAR, VAN, BIKE), number plate (UNIQUE), make, model, color, and year of manufacture. 1-to-1 with Driver."),
        ("driver_documents", "id (BIGINT, PK)", "driver_id → users.id", "Maintains compliance files (License, Registration, Insurance). Stores file path, status (PENDING, APPROVED, REJECTED), and staff review notes."),
        ("trips", "id (BIGINT, PK)", "passenger_id, driver_id → users.id", "Core ride transactional entity. Stores pickup/dropoff coordinates, distance in km, fare breakdown, 15% platform commission, and 6-state lifecycle tracking."),
        ("payments", "id (BIGINT, PK)", "trip_id (UNIQUE) → trips.id", "ACID financial record. Captures gross amount, 85% driver net, 15% platform fee, payment method (CASH, CARD, WALLET), and status (SUCCESS, FAILED)."),
        ("reviews", "id (BIGINT, PK)", "trip_id (UNIQUE) → trips.id", "Post-trip passenger feedback. Stores 1-5 star rating and optional comments. 1-to-1 per completed trip; cascades to driver average rating."),
        ("dispute_tickets", "id (BIGINT, PK)", "passenger_id, trip_id → users.id", "Customer grievance tickets (OVERCHARGED, LOST_ITEM, DRIVER_BEHAVIOR). Tracks status (OPEN, RESOLVED) and staff authorized refund amounts."),
        ("audit_logs", "id (BIGINT, PK)", "performed_by_staff_id → users.id", "Append-only security audit trail. Logs administrative events (suspensions, approvals, revocations) with actor email and timestamp."),
    ]

    t_db = doc.add_table(rows=1, cols=4)
    t_db.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_db)
    w_db = [Inches(1.3), Inches(1.2), Inches(1.6), Inches(3.0)]
    for j, h in enumerate(["Table Name", "Primary Key", "Foreign Keys / Unique", "Domain Purpose & Relational Role"]):
        cell = t_db.rows[0].cells[j]
        cell.width = w_db[j]
        shd_cell(cell, HEX_NAVY)
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = C_WHITE

    for idx, (tbl, pk, fk, desc) in enumerate(db_tables):
        row = t_db.add_row()
        bg = HEX_LIGHT_BG if idx % 2 == 1 else HEX_WHITE
        for j, val in enumerate([tbl, pk, fk, desc]):
            cell = row.cells[j]
            cell.width = w_db[j]
            shd_cell(cell, bg)
            set_cell_margins(cell, 60, 60, 100, 100)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8.5)
            if j == 0:
                r.bold = True
                r.font.name = "Consolas"
                r.font.color.rgb = C_NAVY
            elif j in (1, 2):
                r.font.name = "Consolas"
                r.font.color.rgb = C_ROYAL
            else:
                r.font.color.rgb = C_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_heading_2(doc, "4.4 RESTful API Endpoints & WebSocket Specifications")
    api_specs = [
        ("POST", "/api/auth/register/passenger", "Public", "Passenger registration with validation & BCrypt hashing."),
        ("POST", "/api/auth/register/driver", "Public", "Driver registration (credentials, vehicle, and documents)."),
        ("POST", "/api/auth/login", "Public", "Credential verification returning JWT access & refresh tokens."),
        ("POST", "/api/rides/estimate", "PASSENGER", "Haversine distance calculation and multi-tier fare quotation."),
        ("POST", "/api/rides/book", "PASSENGER", "Persists REQUESTED trip and initiates WebSocket driver broadcast."),
        ("POST", "/api/rides/accept/{id}", "DRIVER", "Driver accepts trip; locks record against concurrent drivers."),
        ("PUT", "/api/trips/{id}/status", "DRIVER", "Validates and transitions trip state machine forward."),
        ("POST", "/api/trips/{id}/noshow", "DRIVER", "Enforces LKR 100 penalty fee after 5-minute passenger absence."),
        ("POST", "/api/payments/process", "PASSENGER", "ACID payment execution (Wallet/Card/Cash) & ledger credit."),
        ("POST", "/api/reviews", "PASSENGER", "Submits 1-5 star review and recalculates driver rolling rating."),
        ("POST", "/api/disputes/create", "PASSENGER", "Creates dispute ticket for overcharging, behavior, or items."),
        ("PUT", "/api/disputes/{id}/resolve", "STAFF/ADMIN", "Resolves ticket with optional automated wallet refund credit."),
        ("GET", "/api/admin/stats", "ADMIN", "Fetches real-time KPIs: revenue, trips, users, and disputes."),
        ("POST", "/api/admin/suspend", "ADMIN", "Locks user account and records reason into audit_logs table."),
    ]
    t_api = doc.add_table(rows=1, cols=4)
    t_api.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_api)
    w_api = [Inches(0.8), Inches(2.3), Inches(1.2), Inches(2.8)]
    for j, h in enumerate(["Method", "Endpoint URI", "RBAC Role", "Operation Description"]):
        cell = t_api.rows[0].cells[j]
        cell.width = w_api[j]
        shd_cell(cell, HEX_NAVY)
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = C_WHITE

    for idx, (m, uri, role, desc) in enumerate(api_specs):
        row = t_api.add_row()
        bg = HEX_LIGHT_BG if idx % 2 == 1 else HEX_WHITE
        for j, val in enumerate([m, uri, role, desc]):
            cell = row.cells[j]
            cell.width = w_api[j]
            shd_cell(cell, bg)
            set_cell_margins(cell, 60, 60, 100, 100)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8.5)
            if j == 0:
                r.bold = True
                r.font.name = "Consolas"
                r.font.color.rgb = C_GREEN if m == "GET" else C_ROYAL if m == "POST" else C_ORANGE
            elif j == 1:
                r.font.name = "Consolas"
                r.font.color.rgb = C_DARK
            elif j == 2:
                r.bold = True
                r.font.size = Pt(8)
                r.font.color.rgb = C_NAVY
            else:
                r.font.color.rgb = C_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_heading_2(doc, "4.5 UI Screen Inventory & Visual Architecture")
    add_body_p(doc, "The frontend application is constructed as an interactive suite of 10 primary screens tailored to distinct user roles:")
    screens = [
        ("Login Screen (Login.tsx)", "Features role-based persona quick-switchers (Passenger, Driver, Staff, Admin) for immediate demonstration, JWT token lifecycle storage, and 5-minute OTP password reset modal."),
        ("Booking Screen (Booking.tsx)", "Integrates Leaflet OpenStreetMap with interactive pin-dropping, vehicle category selection (Tuk, Car, XL, Moto), dynamic fare calculation card, and WebSocket dispatch trigger."),
        ("Driver Dashboard (Driver.tsx)", "Real-time trip dispatch queue displaying incoming trip requests with accept actions, multi-state transition controls, 5-minute no-show countdown timer, and earnings telemetry."),
        ("Payment Screen (Payment.tsx)", "Summary breakdown of trip charges, interactive payment tabs (Cash, 3DS Card Simulation, Wallet Balance), instant wallet debit, and receipt generation with printable breakdown."),
        ("Review & Feedback (Review.tsx)", "Interactive 5-star rating selector with sentiment text area, duplicate review prevention check, and embedded link to file dispute tickets."),
        ("Admin Governance Console (Admin.tsx)", "Comprehensive command center with KPI summary cards, tabbed views across all 8 database tables, inline user account suspension, driver document inspection, and audit logging."),
        ("Support & Dispute Screen (Support.tsx)", "Customer grievance interface allowing passengers to track ticket resolution progress, and staff to inspect disputes and disburse wallet refunds."),
        ("User Profile Screen (Profile.tsx)", "Personal profile management, current digital wallet balance top-up display, password modification form, and active role credential badges."),
        ("Trip History Screen (History.tsx)", "Historical archive of all past passenger journeys featuring colored status badges, distance metrics, payment method indicators, and review shortcuts."),
        ("Branch Kiosk Terminal (BranchKiosk.tsx)", "Walk-in manual dispatch terminal allowing physical kiosk operators to book trips for street customers without smartphones."),
    ]
    for s_name, s_desc in screens:
        add_bullet_p(doc, s_desc, bold_prefix=f"{s_name}: ")

    add_card_box(
        doc,
        title="CANVA VISUAL LAYOUT TIPS — DESIGN SECTION",
        bullet_items=[
            ("Use Case Diagram: ", "Re-embed the official UCD diagram from docs/ with high resolution and clear boundary boxes."),
            ("ER Diagram Styling: ", "Import the EER diagram from docs/ and annotate the 8 primary tables with highlighted entity boxes."),
            ("UI Screenshot Mockups: ", "Arrange screenshots inside modern laptop/browser device frames in a neat 2x3 or 2x4 grid with explanatory captions."),
        ],
        icon="🎨"
    )

    doc.add_page_break()

    # ════════════════════════════════════════════════════════════════════════════
    # SECTION 5 — IMPLEMENTATION (4 MARKS)
    # ════════════════════════════════════════════════════════════════════════════
    add_heading_1(doc, "Section 5 — Implementation & Technical Architecture (Rubric: 4 Marks)", icon="🛠️")
    add_body_p(doc, "Evaluator Criterion: Clear explanation of tools, features, and screenshots of key functions (4/4 marks).")

    add_heading_2(doc, "5.1 Technology Stack Inventory")
    tech_stack = [
        ("Frontend UI Framework", "React 19 (TypeScript 5.x)", "Component-driven single page application architecture with strict type safety."),
        ("Frontend Build Tool", "Vite 6", "Lightning-fast Hot Module Replacement (HMR) and optimized ES module bundling."),
        ("CSS & Styling", "Tailwind CSS v3", "Utility-first design system enabling custom dark navy / royal blue themes."),
        ("Geospatial & Maps", "Leaflet 1.9 + OpenStreetMap", "Client-side interactive vector map rendering, routing polylines, and GPS geocoding."),
        ("Real-Time Client", "STOMP.js & SockJS Client", "WebSocket pub/sub client handling live trip dispatches and telemetry streams."),
        ("Backend Framework", "Spring Boot 3.3.4 (Java 24)", "Enterprise micro-framework providing dependency injection, JPA, and REST services."),
        ("Security Engine", "Spring Security 6 + JWT", "Stateless bearer token authentication with role-based method security (@PreAuthorize)."),
        ("Password Encryption", "BCryptPasswordEncoder (Strength 12)", "Cryptographic one-way password hashing resistant to dictionary attacks."),
        ("Message Broker", "Spring WebSocket (STOMP)", "In-memory real-time message broker routing topics (/topic/trips, /topic/fleet)."),
        ("Relational Database", "Microsoft SQL Server 2022", "Enterprise relational database executing ACID transactions, triggers, and procedures."),
        ("ORM & Persistence", "Hibernate 6 / Spring Data JPA", "Object-relational mapping managing single-table user inheritance and entity cascades."),
        ("API Documentation", "Springdoc OpenAPI 2.6 (Swagger UI)", "Interactive API catalog and live test console at /swagger-ui.html."),
        ("Data Validation", "Jakarta Bean Validation (Hibernate Validator)", "Declarative constraint annotations (@NotBlank, @Email, @Min, @Max) on all DTOs."),
        ("Version Control", "Git + GitHub Monorepo", "Distributed source code repository structured for multi-member branch collaboration."),
    ]
    t_tech = doc.add_table(rows=1, cols=3)
    t_tech.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_tech)
    w_tech = [Inches(1.8), Inches(1.8), Inches(3.5)]
    for j, h in enumerate(["Layer / Category", "Technology & Version", "Architectural Responsibility in Streetify"]):
        cell = t_tech.rows[0].cells[j]
        cell.width = w_tech[j]
        shd_cell(cell, HEX_NAVY)
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = C_WHITE

    for idx, (cat, tech, resp) in enumerate(tech_stack):
        row = t_tech.add_row()
        bg = HEX_LIGHT_BG if idx % 2 == 1 else HEX_WHITE
        for j, val in enumerate([cat, tech, resp]):
            cell = row.cells[j]
            cell.width = w_tech[j]
            shd_cell(cell, bg)
            set_cell_margins(cell, 60, 60, 100, 100)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8.5)
            if j == 0:
                r.bold = True
                r.font.color.rgb = C_NAVY
            elif j == 1:
                r.bold = True
                r.font.color.rgb = C_ROYAL
            else:
                r.font.color.rgb = C_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_heading_2(doc, "5.2 Gang of Four (GoF) Design Patterns Implemented")
    add_body_p(doc, "To demonstrate robust software engineering design principles, three classic Gang of Four (GoF) patterns were engineered into the backend:")
    
    add_heading_3(doc, "1. Observer Pattern (package com.streetify.observer):")
    add_bullet_p(doc, "TripEventSubject & TripEventPublisher manage live trip state transitions. When a driver accepts or advances a trip, WebSocketTripObserver automatically pushes telemetry updates to passenger private queues (/user/{email}/queue/trip/{id}) without coupling tracking logic to the core trip service.")
    add_bullet_p(doc, "AuditLogVerificationObserver automatically records an append-only audit record whenever DriverVerificationObserver approves or rejects driver identity credentials.")

    add_heading_3(doc, "2. Decorator Pattern (package com.streetify.decorator):")
    add_bullet_p(doc, "DisputeView provides base ticket representation. AdminResponseDecorator dynamically wraps dispute presentations to inject administrative resolution timestamps and handler credentials.")
    add_bullet_p(doc, "EscalationDecorator attaches urgency warnings to disputes exceeding financial or temporal thresholds without altering the underlying entity.")
    add_bullet_p(doc, "RefundNoteDecorator conditionally enriches dispute objects with authorized ledger debit notes when passenger refunds are approved.")

    add_heading_3(doc, "3. Factory Pattern (package com.streetify.factory):")
    add_bullet_p(doc, "AuditLogFactory provides standardized creation of immutable audit entities based on AdminActionType (ACCOUNT_SUSPENDED, DOCUMENT_APPROVED, JWT_REVOKED, REFUND_ISSUED). Centralizes audit metadata assembly across disparate controllers.")

    add_heading_2(doc, "5.3 Core Algorithmic Features & Business Logic")
    
    add_heading_3(doc, "Feature 1: Haversine Geodesic Fare Calculation (DispatchService.java)")
    fare_calc_box = (
        "// Great-Circle Distance via Haversine Formula:\n"
        "dLat = toRadians(lat2 - lat1); dLng = toRadians(lng2 - lng1);\n"
        "a = sin²(dLat/2) + cos(lat1) * cos(lat2) * sin²(dLng/2);\n"
        "distanceKm = 6371.0 * (2 * atan2(√a, √(1-a)));\n\n"
        "// Fare Pricing Formula (in Sri Lankan Rupees - LKR):\n"
        "totalFare = baseFare + (distanceKm * perKmRate) + platformFee;\n\n"
        "// Rates: Tuk-Tuk (Base 120, 24/km) | Standard (Base 200, 33/km)\n"
        "//        XL (Base 340, 48/km)      | Moto (Base 80, 18/km)\n"
        "// Platform Fee = LKR 4.00 (fixed)  | Platform Commission = 15%"
    )
    add_code_snippet(doc, fare_calc_box, caption="Haversine Mathematical Geodesic Formula & Fare Config")

    add_heading_3(doc, "Feature 2: Finite State Machine & No-Show Cancellation (TripTrackingService.java)")
    state_box = (
        "Valid State Progression: REQUESTED ➔ ACCEPTED ➔ EN_ROUTE ➔ ARRIVED ➔ IN_PROGRESS ➔ COMPLETED\n"
        "                                                   │ (Wait > 5 min)\n"
        "                                                   ▼\n"
        "                                            CANCELLED (LKR 100 Penalty Applied)"
    )
    add_code_snippet(doc, state_box, caption="Trip State Machine Transitions & Inactivity Enforcement")

    add_heading_3(doc, "Feature 3: ACID Tri-Modal Financial Settlement (PaymentService.java)")
    add_bullet_p(doc, "Spring @Transactional guarantees atomic rollback across the database if any intermediate step fails.")
    add_bullet_p(doc, "Digital Wallet: Debits passenger balance, credits 85% driver net earnings to driver wallet, and records 15% platform commission.")
    add_bullet_p(doc, "Cash Settlement: Passenger pays driver physically; system appends 15% platform fee to driver's commission_debt ledger for subsequent reconciliation.")
    add_bullet_p(doc, "Card Simulation: Executes 3DS simulated payment gateway with an automated 3-retry resilience loop before flagging status as FAILED.")

    add_heading_2(doc, "5.4 Mandatory Screenshot Portfolio for Canva Report")
    add_bullet_p(doc, "Screenshot 1: Booking screen showing live Leaflet map route, polyline between pickup and dropoff, and vehicle category cards.")
    add_bullet_p(doc, "Screenshot 2: Upfront fare breakdown card displaying base fare, per-km charge, platform fee, and total LKR price.")
    add_bullet_p(doc, "Screenshot 3: Driver Dashboard showing incoming broadcasted trips in the live queue with 'Accept Ride' action.")
    add_bullet_p(doc, "Screenshot 4: Trip state machine progression buttons ('Start Navigation', 'I Have Arrived', 'Start Trip', 'Complete Trip').")
    add_bullet_p(doc, "Screenshot 5: Payment screen with Cash / Card / Wallet tabs and generated customer payment receipt.")
    add_bullet_p(doc, "Screenshot 6: Review & rating modal with 5-star selection and dispute filing submission form.")
    add_bullet_p(doc, "Screenshot 7: Admin Console dashboard with executive KPI stat cards (Total Users, Trips, Revenue, Disputes).")
    add_bullet_p(doc, "Screenshot 8: Admin audit logging table showing timestamped, staff-attributed action logs.")
    add_bullet_p(doc, "Screenshot 9: Swagger interactive API console (localhost:8080/swagger-ui.html) proving live REST contracts.")

    add_card_box(
        doc,
        title="CANVA VISUAL LAYOUT TIPS — IMPLEMENTATION SECTION",
        bullet_items=[
            ("Tech Badge Collage: ", "Present the 14 tools as colorful technology icon badges with version tags."),
            ("Code Callout Cards: ", "Place the Haversine formula and State Machine diagrams inside dark slate code cards."),
            ("Screenshot Grouping: ", "Pair each functional screenshot with an explanatory callout box detailing the underlying Java controller and database table."),
        ],
        icon="🎨"
    )

    doc.add_page_break()

    # ════════════════════════════════════════════════════════════════════════════
    # SECTION 6 — PROJECT MANAGEMENT (3 MARKS)
    # ════════════════════════════════════════════════════════════════════════════
    add_heading_1(doc, "Section 6 — Project Management & Agile Delivery (Rubric: 3 Marks)", icon="📅")
    add_body_p(doc, "Evaluator Criterion: Agile approach, sprint summaries, and task distribution clearly explained with a timeline of milestones (3/3 marks).")

    add_heading_2(doc, "6.1 Agile Scrum Methodology & Team Collaboration")
    add_body_p(doc, "The team executed an Agile Scrum framework structured around 2-week sprint cycles across 16 academic weeks. Work was coordinated through a centralized GitHub repository with branch protection rules, weekly sprint planning meetings, daily asynchronous standups, and bi-weekly sprint reviews.")

    add_heading_2(doc, "6.2 Sprint Schedule & Deliverables Breakdown")
    sprints = [
        ("Sprint 1", "Weeks 1–2", "Requirements gathering, feasibility study, Use Case Diagram drafting, EER schema modeling, and monorepo scaffolding."),
        ("Sprint 2", "Weeks 3–4", "MSSQL schema creation (01_schema_ddl.sql), Spring Boot 3 initialization, Vite setup, User entity modeling, and BCrypt security."),
        ("Sprint 3", "Weeks 5–6", "JWT authentication implementation, login/registration screens, tab-isolated session storage, and Leaflet map integration."),
        ("Sprint 4", "Weeks 7–8", "Haversine fare estimation engine, Trip entity persistence, and STOMP WebSocket broker integration for real-time dispatch."),
        ("Sprint 5", "Weeks 9–10", "Driver dashboard development, 6-state trip lifecycle progression, 5-minute no-show detection, and GPS telemetry streaming."),
        ("Sprint 6", "Weeks 11–12", "Payment module implementation (Cash, Card, Wallet), 15% platform commission logic, driver debt tracking, and receipt generation."),
        ("Sprint 7", "Weeks 13–14", "Review & rating aggregation, dispute ticket submission, support staff arbitration, and Observer/Decorator/Factory design patterns."),
        ("Sprint 8", "Weeks 15–16", "Admin Console full CRUD implementation, audit logging, system integration testing (60 test cases), UI polish, and final documentation."),
    ]
    t_sp = doc.add_table(rows=1, cols=3)
    t_sp.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_sp)
    w_sp = [Inches(1.1), Inches(1.2), Inches(4.8)]
    for j, h in enumerate(["Sprint", "Timeline", "Core Objectives & Deliverables Completed"]):
        cell = t_sp.rows[0].cells[j]
        cell.width = w_sp[j]
        shd_cell(cell, HEX_NAVY)
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = C_WHITE

    for idx, (sp, time_span, deliv) in enumerate(sprints):
        row = t_sp.add_row()
        bg = HEX_LIGHT_BG if idx % 2 == 1 else HEX_WHITE
        for j, val in enumerate([sp, time_span, deliv]):
            cell = row.cells[j]
            cell.width = w_sp[j]
            shd_cell(cell, bg)
            set_cell_margins(cell, 60, 60, 100, 100)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8.5)
            if j == 0:
                r.bold = True
                r.font.color.rgb = C_NAVY
            elif j == 1:
                r.font.name = "Consolas"
                r.font.color.rgb = C_ROYAL
            else:
                r.font.color.rgb = C_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_heading_2(doc, "6.3 Individual Task Distribution & File Ownership")
    team_tasks = [
        ("Lahiru\n(IT25102208)", "User Account & Verification", "AuthController.java, AuthService.java, User.java, Driver.java, Passenger.java, Login.tsx, Profile.tsx, validators.ts, storage.ts"),
        ("Chanuka\n(IT25102207)", "Ride Booking & Dispatch", "TripController.java, DispatchService.java, Trip.java, FareEstimateDTO.java, Booking.tsx, OsmMap.tsx, fareCalculationService.ts"),
        ("Tharindu\n(IT25102241)", "Trip Progress & Telemetry", "TripTrackingController.java, TripTrackingService.java, TelemetryDTO.java, Driver.tsx, TripStatusObserver.java, WebSocketTripObserver.java"),
        ("Daham\n(IT25102225)", "Payment & Ledger Management", "PaymentController.java, PaymentService.java, Payment.java, PaymentRequestDTO.java, PaymentReceiptDTO.java, Payment.tsx, ReceiptDisplay.tsx"),
        ("Mithun\n(IT25102193)", "Review & Dispute Form", "ReviewController.java, ReviewService.java, DisputeController.java, SupportService.java, Review.java, DisputeTicket.java, Review.tsx, Support.tsx, Decorators"),
        ("Vidura\n(IT25102240)", "Admin Governance & Control", "AdminController.java, ModuleAdminController.java, AdminGovernanceService.java, AuditLog.java, SecurityConfig.java, WebSocketConfig.java, Admin.tsx, Factory"),
    ]
    t_task = doc.add_table(rows=1, cols=3)
    t_task.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_task)
    w_task = [Inches(1.3), Inches(2.2), Inches(3.6)]
    for j, h in enumerate(["Team Member", "Assigned Functional Module", "Key Codebase Files & Classes Developed"]):
        cell = t_task.rows[0].cells[j]
        cell.width = w_task[j]
        shd_cell(cell, HEX_NAVY)
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = C_WHITE

    for idx, (mem, mod, files) in enumerate(team_tasks):
        row = t_task.add_row()
        bg = HEX_LIGHT_BG if idx % 2 == 1 else HEX_WHITE
        for j, val in enumerate([mem, mod, files]):
            cell = row.cells[j]
            cell.width = w_task[j]
            shd_cell(cell, bg)
            set_cell_margins(cell, 60, 60, 100, 100)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8.5)
            if j == 0:
                r.bold = True
                r.font.color.rgb = C_NAVY
            elif j == 1:
                r.bold = True
                r.font.color.rgb = C_ROYAL
            else:
                r.font.name = "Consolas"
                r.font.size = Pt(8)
                r.font.color.rgb = C_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_heading_2(doc, "6.4 Key Development Milestones")
    add_bullet_p(doc, "Milestone 1 (Week 2): Project proposal and requirements baseline approved.")
    add_bullet_p(doc, "Milestone 2 (Week 4): Database schema DDL validated and seeded with test credentials.")
    add_bullet_p(doc, "Milestone 3 (Week 6): End-to-end JWT registration and login flows certified.")
    add_bullet_p(doc, "Milestone 4 (Week 8): Live WebSocket dispatching and Haversine map routing operational.")
    add_bullet_p(doc, "Milestone 5 (Week 10): Trip state machine and no-show fee enforcement validated.")
    add_bullet_p(doc, "Milestone 6 (Week 12): ACID payment settlement and platform commission ledger verified.")
    add_bullet_p(doc, "Milestone 7 (Week 14): Review, dispute arbitration, and GoF design patterns integrated.")
    add_bullet_p(doc, "Milestone 8 (Week 15): Full Admin Console CRUD and immutable audit logging deployed.")
    add_bullet_p(doc, "Milestone 9 (Week 16): 60-test case integration suite executed (100% pass rate) and final submission.")

    add_card_box(
        doc,
        title="CANVA VISUAL LAYOUT TIPS — PROJECT MANAGEMENT SECTION",
        bullet_items=[
            ("Gantt Chart Timeline: ", "Render the 8 sprints as a horizontal colored Gantt bar chart across Weeks 1 to 16."),
            ("Member Contribution Rings: ", "Display 6 circular progress or role indicator cards with each member's photo and ownership area."),
            ("Milestone Flagpole: ", "Create a vertical milestone roadmap with colored flag icons marking Milestones 1 through 9."),
        ],
        icon="🎨"
    )

    doc.add_page_break()

    # ════════════════════════════════════════════════════════════════════════════
    # SECTION 7 — CONCLUSION & FUTURE WORK (3 MARKS)
    # ════════════════════════════════════════════════════════════════════════════
    add_heading_1(doc, "Section 7 — Conclusion & Future Enhancements (Rubric: 3 Marks)", icon="🔮")
    add_body_p(doc, "Evaluator Criterion: Strong summary, key challenges addressed, and realistic suggestions for improvement (3/3 marks).")

    add_heading_2(doc, "7.1 Summary of Project Achievements")
    add_body_p(doc, "The Streetify project successfully achieved all core objectives outlined in the software requirements specification. The team delivered a fully functional, enterprise-grade ride-hailing and dispatch platform adhering to modern software engineering standards. Notable accomplishments include:")
    add_bullet_p(doc, "Seamless full-stack integration across React TypeScript, Spring Boot 3 (Java 24), and Microsoft SQL Server.")
    add_bullet_p(doc, "Robust security foundation utilizing BCrypt password hashing, stateless JWT authentication, and role-based endpoint protection.")
    add_bullet_p(doc, "Real-time dispatching and GPS telemetry streaming using STOMP WebSockets, eliminating polling overhead.")
    add_bullet_p(doc, "Accurate geospatial fare estimation powered by the Haversine formula across 4 vehicle tiers in Sri Lankan Rupees.")
    add_bullet_p(doc, "ACID-compliant tri-modal payment processing guaranteeing zero transactional loss and automated commission calculation.")
    add_bullet_p(doc, "Architectural maturity demonstrated through the implementation of Observer, Decorator, and Factory design patterns.")
    add_bullet_p(doc, "Zero-defect validation verified across 60 rigorous integration test cases spanning all 6 team member submodules.")

    add_heading_2(doc, "7.2 Technical Challenges Encountered & Resolutions")
    challenges = [
        ("Real-Time WebSocket Authentication", "Standard Spring Security filters intercept HTTP requests but do not automatically validate WebSocket CONNECT frames, creating an unauthenticated socket vulnerability.", "Engineered a custom ChannelInterceptor inside WebSocketConfig.java that intercepts the STOMP CONNECT header, extracts and validates the Bearer JWT token, and populates the SecurityContext with verified user authorities."),
        ("Single-Table Inheritance in MSSQL", "Mapping Passenger, Driver, and Admin entities with distinct fields into a unified users table caused JPA schema mismatches and discriminator column errors.", "Applied JPA @Inheritance(strategy = InheritanceType.SINGLE_TABLE) with @DiscriminatorColumn(name = 'dtype') and manual getter/setter encapsulation to ensure clean polymorphic queries."),
        ("Multi-User Cross-Tab Session Clashes", "Testing passenger, driver, and admin workflows simultaneously in one browser caused localStorage token collisions, logging out opposing users.", "Engineered a custom tabStorage utility using sessionStorage keyed by unique browser tab identifiers, enabling concurrent multi-role testing in separate browser tabs."),
        ("Race Conditions in Trip Acceptance", "Simultaneous trip acceptance by multiple online drivers risked double-booking the same passenger trip.", "Implemented database-level optimistic locking and unique constraint checks in TripDAO; the first driver claims the ride, while subsequent requests receive an immediate HTTP 409 Conflict."),
        ("Java 24 and Lombok Incompatibility", "Lombok bytecode generation failed to compile under the new Java 24 compiler AST changes.", "Refactored all 21 entities and 19 DTOs to use standard Java encapsulation with clean, hand-crafted getters, setters, and constructors, ensuring zero reliance on third-party annotation processors."),
        ("Transactional Integrity in Payments", "Simulated card gateway failures mid-transaction risked leaving passenger wallets debited without completing trip records.", "Annotated PaymentService methods with Spring @Transactional; any runtime failure triggers an immediate rollback across all database tables."),
    ]
    t_ch = doc.add_table(rows=1, cols=3)
    t_ch.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_ch)
    w_ch = [Inches(1.8), Inches(2.5), Inches(2.8)]
    for j, h in enumerate(["Technical Challenge", "Root Cause & Architectural Impact", "Engineered Resolution & Outcome"]):
        cell = t_ch.rows[0].cells[j]
        cell.width = w_ch[j]
        shd_cell(cell, HEX_NAVY)
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = C_WHITE

    for idx, (ch, cause, res) in enumerate(challenges):
        row = t_ch.add_row()
        bg = HEX_LIGHT_BG if idx % 2 == 1 else HEX_WHITE
        for j, val in enumerate([ch, cause, res]):
            cell = row.cells[j]
            cell.width = w_ch[j]
            shd_cell(cell, bg)
            set_cell_margins(cell, 60, 60, 100, 100)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8.5)
            if j == 0:
                r.bold = True
                r.font.color.rgb = C_NAVY
            else:
                r.font.color.rgb = C_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_heading_2(doc, "7.3 Realistic Suggestions for Improvement (Future Work)")
    add_bullet_p(doc, "1. Native Mobile Applications: Develop React Native mobile applications for iOS and Android, re-using existing REST and WebSocket endpoints for background GPS tracking and push notifications.")
    add_bullet_p(doc, "2. Production Payment Gateway Integration: Replace the 3DS card simulation with a live licensed Sri Lankan payment gateway (such as PayHere or Commercial Bank IPG) for real LKR credit/debit settlement.")
    add_bullet_p(doc, "3. SMS & Automated Push Notifications: Integrate Twilio or Firebase Cloud Messaging (FCM) to deliver SMS OTPs and instant push notifications to mobile devices when trips are accepted.")
    add_bullet_p(doc, "4. Machine Learning Dynamic Surge Pricing: Implement a predictive pricing model utilizing historical demand, weather forecasts, and route traffic density to dynamically adjust per-km rates during peak hours.")
    add_bullet_p(doc, "5. Distributed Redis Cache & Token Blacklisting: Introduce Redis to manage distributed caching of active driver coordinates and maintain a real-time revoked JWT blacklist.")
    add_bullet_p(doc, "6. Real-Time Spatial Indexing: Migrate driver coordinate tracking to Microsoft SQL Server Spatial Geography types or Redis GEO for sub-millisecond proximity radius queries.")
    add_bullet_p(doc, "7. Driver In-App Turn-by-Turn Navigation: Integrate OpenRouteService navigation API directly into Driver.tsx for live turn-by-turn voice directions on interactive maps.")
    add_bullet_p(doc, "8. Automated Sentiment Analysis: Apply Natural Language Processing (NLP) to passenger review comments to automatically flag high-risk disputes and toxic driver behavior for priority staff escalation.")

    add_card_box(
        doc,
        title="CANVA VISUAL LAYOUT TIPS — CONCLUSION SECTION",
        bullet_items=[
            ("Achievement Icons: ", "Summarize the 7 core project achievements using bold stat metrics (100% Tests Passed, 3 GoF Patterns, 8 Relational Tables, 6 State Lifecycles)."),
            ("Challenge ➔ Solution Cards: ", "Format the technical challenges as side-by-side problem and solution cards with an arrow connecting them."),
            ("Future Roadmap Timeline: ", "Display the 8 future improvements as a numbered 2-year forward-looking technology roadmap."),
        ],
        icon="🎨"
    )

    doc.add_page_break()

    # ════════════════════════════════════════════════════════════════════════════
    # SECTION 8 — INDIVIDUAL CONTRIBUTIONS & LESSONS LEARNED (3 MARKS)
    # ════════════════════════════════════════════════════════════════════════════
    add_heading_1(doc, "Section 8 — Individual Contribution, Teamwork & Lessons Learned (Rubric: 3 Marks)", icon="👤")
    add_body_p(doc, "Evaluator Criterion: Meaningful, realistic reflections on contributions, challenges, solutions, and lessons learned. MUST BE PRESENTED AS A TABLE WHERE EACH ROW REPRESENTS A GROUP MEMBER'S REFLECTION (3/3 marks).")

    add_body_p(doc, "Below is the complete, comprehensive reflection table where all six team members have completed their individual reflections covering their specific module tasks, technical challenges, problem-solving strategies, key lessons learned, and future improvement perspectives:")

    # 6-Member Individual Reflection Cards (Ideal for phone reading)
    reflections = [
        {
            "name": "Lahiru (A.R.L.P. Nayanamina - IT25102208)",
            "role": "User Account Management & Verification Module",
            "tasks": "Engineered the complete user identity layer: passenger and driver registration workflows, JWT token issuance with 15-minute access and 7-day refresh rotation, BCrypt password hashing, 5-minute OTP password reset mechanism, Sri Lankan phone format validation (+94 / 0 prefix), profile management screen, and tabStorage session isolation.",
            "challenge": "Balancing phone validation rules across passenger and driver registrations. Drivers strictly required valid Sri Lankan telecommunication prefixes (+947X or 07X with exactly 9 subsequent digits) to ensure SMS reachability, while passenger accounts needed flexibility for international numbers without introducing regex security bypasses.",
            "solution": "Architected separate declarative Bean Validation annotations on DriverRegistrationDTO.java and UserRegistrationDTO.java, mirrored with instant client-side regex validators in validators.ts, ensuring immediate visual UI feedback alongside unbreakable backend validation.",
            "lessons": "Learned that security cannot rely on client-side validation alone. The browser validation enhances user experience, but robust server-side DTO validation is the true defensive boundary against malicious payload injection.",
            "improvement": "Integrate an actual SMTP email delivery service (such as SendGrid or AWS SES) to send OTP codes and welcome emails rather than printing OTP tokens to server console logs."
        },
        {
            "name": "Chanuka (W.A.C.B. Dharmakeerthi - IT25102207)",
            "role": "Ride Booking and Management & Dispatch Engine",
            "tasks": "Built the complete Ride Booking and Dispatch engine: Leaflet OpenStreetMap interactive pin-dropping, reverse geocoding address search, Haversine spherical geodesic fare calculation engine, STOMP WebSocket trip broadcasting (/topic/trips), vehicle tier selection (Tuk, Car, XL, Moto), and ride history.",
            "challenge": "Eliminating fare calculation discrepancies between client-side estimate previews and backend persisted records, and ensuring the Haversine formula correctly handled floating-point coordinate precision across Colombo metropolitan routes.",
            "solution": "Centralized fare rate constants (base fares and per-km rates) across both DispatchService.java and Booking.tsx. Created automated unit tests comparing computed Haversine distances against known Google Maps landmark distances to achieve millimeter precision.",
            "lessons": "Mastered the mechanics of asynchronous WebSocket pub/sub messaging. Learned how topic-based message brokers decouple dispatch senders from receivers, eliminating polling overhead and enabling instant multi-driver broadcast.",
            "improvement": "Incorporate live traffic density data from an external traffic API (such as TomTom or Mapbox) to provide dynamic traffic-aware travel time estimates (ETAs)."
        },
        {
            "name": "Tharindu (K.A.T. Senaka - IT25102241)",
            "role": "Driver Trip Request Management & Telemetry",
            "tasks": "Developed the Driver Trip Management engine: the 6-state finite state machine (REQUESTED → ACCEPTED → EN_ROUTE → ARRIVED → IN_PROGRESS → COMPLETED), invalid state jump prevention, 5-minute no-show penalty timer, real-time GPS telemetry via STOMP, driver dashboard UI, and the Observer design pattern.",
            "challenge": "Enforcing the 5-minute no-show cancellation fee securely. If handled exclusively on the frontend, malicious drivers could manipulate client timestamps to trigger no-show fees immediately without waiting for the passenger.",
            "solution": "Moved all no-show validation to TripTrackingService.java, which queries the database-generated arrived_at timestamp and calculates server-side elapsed minutes using java.time.Duration. If less than 5 minutes have elapsed, the cancellation fee is strictly blocked.",
            "lessons": "Recognized that even in stateless REST architectures, the server database is the single immutable source of truth for temporal and stateful business rules. Critical monetary penalties must never trust client-provided timestamps.",
            "improvement": "Integrate background HTML5 Geolocation WatchPosition with automated bearing calculation so the vehicle icon rotates smoothly along the road heading on passenger maps."
        },
        {
            "name": "Daham (E.A.R.N.D. Edirisinghe - IT25102225)",
            "role": "Payment and Receipt Management & Ledger",
            "tasks": "Engineered the complete Payment & Ledger subsystem: tri-modal payment processing (Cash, Card, Wallet), 15% platform commission splits, 85% driver net earnings calculation, driver commission_debt ledger for cash trips, Spring @Transactional rollback, 3-retry gateway simulation, and receipt generation.",
            "challenge": "Ensuring strict transactional atomicity when simulated card payments failed mid-flight. Needed to guarantee that passenger wallet balances were never debited if the corresponding payment entity failed to persist.",
            "solution": "Enforced Spring @Transactional boundaries across PaymentService.java. Conducted failure-injection tests in local SSMS to verify that unexpected runtime exceptions triggered a complete database rollback, leaving wallet balances intact.",
            "lessons": "Deepened understanding of ACID database principles in fintech systems. In financial software, an unhandled exception without transactional rollback causes balance discrepancies that undermine user trust.",
            "improvement": "Integrate a real localized payment gateway (such as PayHere Sri Lanka) with webhook signature verification for production automated card tokenization."
        },
        {
            "name": "Mithun (W.A.M.B. Weerasingha - IT25102193)",
            "role": "Review, Rating, and Feedback Management & Disputes",
            "tasks": "Built the Review & Dispute subsystem: 1-to-5 star rating interface, driver rolling average rating recalculation, duplicate review prevention, dispute ticket submission form (OVERCHARGED, LOST_ITEM, DRIVER_BEHAVIOR), staff dispute resolution with wallet refund capability, and the Decorator design pattern.",
            "challenge": "Recalculating driver average ratings efficiently without triggering full-table scan bottlenecks across millions of historical review rows as the platform scales.",
            "solution": "Formulated an optimized SQL aggregate query executed immediately upon review insertion, updating the denormalized average_rating field on the Driver entity directly, enabling O(1) rating reads on driver profiles.",
            "lessons": "Understood the trade-offs between database normalization and query performance. Pre-computing frequently accessed summary aggregates on parent entities dramatically improves read throughput.",
            "improvement": "Implement automated text sentiment analysis on review comments using machine learning to instantly flag abusive or urgent passenger complaints for immediate staff intervention."
        },
        {
            "name": "Vidura (R.V.S. Rammandalagedara - IT25102240)",
            "role": "Administration and System Control & Governance",
            "tasks": "Architected the Administrative Governance engine: ModuleAdminController (1895-line enterprise CRUD controller), Admin Console frontend, immutable audit logging system, account suspension/unsuspension, driver document verification, WebSocket JWT session revocation, Spring Security configuration, and the Factory design pattern.",
            "challenge": "Managing architectural cohesion and maintainability as the central administrative controller expanded to govern all 8 relational database tables with full CRUD capabilities without violating clean code principles.",
            "solution": "Structured ModuleAdminController into modular logical regions with standardized error handling and security verification hooks. Leveraged AuditLogFactory to encapsulate and standardize audit entity creation across all administrative operations.",
            "lessons": "Gained deep insights into enterprise access control and defensive programming. Centralized admin consoles must enforce strict least-privilege principles, input sanitization, and immutable auditing to prevent insider threats.",
            "improvement": "Decompose ModuleAdminController into dedicated domain-specific admin micro-controllers and implement cursor-based pagination for large administrative datasets."
        },
    ]

    for ref in reflections:
        add_heading_2(doc, ref["name"])
        add_bullet_p(doc, ref["role"], bold_prefix="Module Ownership: ")
        add_bullet_p(doc, ref["tasks"], bold_prefix="Key Tasks & Components: ")
        add_bullet_p(doc, ref["challenge"], bold_prefix="Technical Challenge Faced: ")
        add_bullet_p(doc, ref["solution"], bold_prefix="How Challenge Was Overcame: ")
        add_bullet_p(doc, ref["lessons"], bold_prefix="Key Lessons Learned: ")
        add_bullet_p(doc, ref["improvement"], bold_prefix="Area for Future Improvement: ")
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    add_heading_2(doc, "8.2 Master Individual Contribution Table (Rubric Compliant)")
    add_body_p(doc, "This consolidated matrix presents the exact required rubric format where each row represents a team member's reflection across all five dimensions:")

    t_ref = doc.add_table(rows=1, cols=6)
    t_ref.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_ref)
    w_ref = [Inches(1.0), Inches(1.3), Inches(1.3), Inches(1.3), Inches(1.1), Inches(1.1)]
    ref_hdrs = ["Member", "Assigned Tasks", "Challenge Faced", "How Overcame", "Lessons Learned", "What Could Improve"]
    for j, h in enumerate(ref_hdrs):
        cell = t_ref.rows[0].cells[j]
        cell.width = w_ref[j]
        shd_cell(cell, HEX_NAVY)
        set_cell_margins(cell, 80, 80, 80, 80)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(8.5)
        r.font.color.rgb = C_WHITE

    for idx, ref in enumerate(reflections):
        row = t_ref.add_row()
        bg = HEX_LIGHT_BG if idx % 2 == 1 else HEX_WHITE
        vals = [
            ref["name"].split(" ")[0] + f"\n({ref['name'].split('- ')[1].replace(')', '')})",
            ref["tasks"],
            ref["challenge"],
            ref["solution"],
            ref["lessons"],
            ref["improvement"]
        ]
        for j, val in enumerate(vals):
            cell = row.cells[j]
            cell.width = w_ref[j]
            shd_cell(cell, bg)
            set_cell_margins(cell, 60, 60, 80, 80)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(7.5)
            if j == 0:
                r.bold = True
                r.font.color.rgb = C_NAVY
            else:
                r.font.color.rgb = C_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_card_box(
        doc,
        title="CANVA VISUAL LAYOUT TIPS — CONTRIBUTIONS SECTION",
        bullet_items=[
            ("Individual Profile Cards: ", "Create 6 full-page or half-page member cards featuring a professional headshot avatar, student ID badge, and 5 structured reflection bullet points."),
            ("Color Accent Strips: ", "Assign each team member a unique accent color strip on their profile card for distinct visual personality."),
            ("Rubric Table Inclusion: ", "Include the consolidated 6-row reflection table at the end of the section to strictly satisfy rubric compliance."),
        ],
        icon="🎨"
    )

    doc.add_page_break()

    # ════════════════════════════════════════════════════════════════════════════
    # SECTION 9 — REFERENCES (IEEE STYLE)
    # ════════════════════════════════════════════════════════════════════════════
    add_heading_1(doc, "Section 9 — References (IEEE Referencing Standard)", icon="📚")
    add_body_p(doc, "All academic citations adhere strictly to the IEEE standard formatting guidelines:")

    refs = [
        "[1]  Spring Boot Documentation, 'Spring Boot 3.3.x Reference Documentation,' spring.io. [Online]. Available: https://docs.spring.io/spring-boot/docs/3.3.x/reference/html/ [Accessed: Oct. 2026].",
        "[2]  Spring Security Reference, 'Spring Security 6 Reference Guide,' spring.io. [Online]. Available: https://docs.spring.io/spring-security/reference/ [Accessed: Oct. 2026].",
        "[3]  E. Gamma, R. Helm, R. Johnson, and J. Vlissides, Design Patterns: Elements of Reusable Object-Oriented Software. Boston, MA: Addison-Wesley, 1994.",
        "[4]  React Documentation, 'React 19 – The library for web and native user interfaces,' react.dev. [Online]. Available: https://react.dev [Accessed: Oct. 2026].",
        "[5]  Vite Documentation, 'Vite 6 – Next Generation Frontend Tooling,' vitejs.dev. [Online]. Available: https://vitejs.dev [Accessed: Oct. 2026].",
        "[6]  Microsoft, 'Microsoft SQL Server 2022 Documentation,' docs.microsoft.com. [Online]. Available: https://docs.microsoft.com/en-us/sql/sql-server/ [Accessed: Oct. 2026].",
        "[7]  Leaflet JS, 'Leaflet — an open-source JavaScript library for mobile-friendly interactive maps,' leafletjs.com. [Online]. Available: https://leafletjs.com [Accessed: Oct. 2026].",
        "[8]  OpenStreetMap Contributors, 'OpenStreetMap,' openstreetmap.org. [Online]. Available: https://www.openstreetmap.org [Accessed: Oct. 2026].",
        "[9]  JSON Web Tokens, 'Introduction to JSON Web Tokens,' jwt.io. [Online]. Available: https://jwt.io/introduction [Accessed: Oct. 2026].",
        "[10] W. A. Sookocheff, 'A Guide to OAuth 2.0,' sookocheff.com, 2019. [Online]. Available: https://sookocheff.com/post/oauth/oauth/ [Accessed: Oct. 2026].",
        "[11] Tailwind CSS Documentation, 'Tailwind CSS — A utility-first CSS framework,' tailwindcss.com. [Online]. Available: https://tailwindcss.com/docs [Accessed: Oct. 2026].",
        "[12] R. C. Martin, Clean Code: A Handbook of Agile Software Craftsmanship. Upper Saddle River, NJ: Prentice Hall, 2009.",
        "[13] OWASP Foundation, 'OWASP Top 10 Application Security Risks,' owasp.org. [Online]. Available: https://owasp.org/www-project-top-ten/ [Accessed: Oct. 2026].",
        "[14] Jakarta EE Specification, 'Jakarta Bean Validation 3.0 Specification,' jakarta.ee. [Online]. Available: https://jakarta.ee/specifications/bean-validation/ [Accessed: Oct. 2026].",
        "[15] Springdoc OpenAPI, 'Springdoc-openapi — Library for Spring Boot projects,' springdoc.org. [Online]. Available: https://springdoc.org [Accessed: Oct. 2026].",
    ]
    for r_item in refs:
        p_ref = doc.add_paragraph()
        p_ref.paragraph_format.space_before = Pt(2)
        p_ref.paragraph_format.space_after = Pt(4)
        p_ref.paragraph_format.left_indent = Inches(0.3)
        p_ref.paragraph_format.first_line_indent = Inches(-0.3)
        r = p_ref.add_run(r_item)
        r.font.name = "Arial"
        r.font.size = Pt(8.5)
        r.font.color.rgb = C_DARK

    doc.add_page_break()

    # ════════════════════════════════════════════════════════════════════════════
    # SECTION 10 — APPENDIX & VIVA REFERENCE
    # ════════════════════════════════════════════════════════════════════════════
    add_heading_1(doc, "Section 10 — Appendix & Viva Evaluation Quick Reference", icon="📎")
    
    add_heading_2(doc, "Appendix A: Master Test Credentials (Pre-Seeded)")
    creds = [
        ("Admin (Super Admin)", "admin@streetify.com", "1111", "SUPER_ADMIN", "Full platform governance, all CRUD modules, audit log inspection."),
        ("Admin (Vidura)", "vidura@streetify.lk", "admin123", "SUPER_ADMIN", "Governance lead; document verification & account suspensions."),
        ("Admin (Lahiru)", "lahiru@streetify.lk", "admin123", "USER_MGMT", "Scoped to User Account Management and password resets."),
        ("Admin (Chanuka)", "chanuka@streetify.lk", "admin123", "BOOKING_MGMT", "Scoped to Ride Booking and Dispatch inspection."),
        ("Admin (Tharindu)", "tharindu@streetify.lk", "admin123", "DRIVER_MGMT", "Scoped to Driver Tracking, verification, and telemetry."),
        ("Admin (Daham)", "daham@streetify.lk", "admin123", "PAYMENT_MGMT", "Scoped to Payment and Ledger audits and commission debts."),
        ("Admin (Mithun)", "mithun@streetify.lk", "admin123", "REVIEW_MGMT", "Scoped to Review, Rating, and Dispute arbitration."),
        ("Passenger 1 (Lahiru)", "passenger1@streetify.com", "1111", "PASSENGER", "Active passenger account with pre-seeded wallet balance (LKR 5,000)."),
        ("Passenger 2 (Gihan)", "passenger2@streetify.com", "1111", "PASSENGER", "Secondary test passenger for multi-user booking tests."),
        ("Driver 1 (Kamal)", "driver1@streetify.com", "1111", "DRIVER", "Verified driver (Toyota Prius - CAB-1234), status APPROVED, online."),
        ("Driver 2 (Nimal)", "driver2@streetify.com", "1111", "DRIVER", "Verified Tuk-Tuk driver (Bajaj RE - AA-5678), status APPROVED."),
        ("Driver 3 (Sunil)", "driver3@streetify.com", "1111", "DRIVER", "Pending verification driver for testing document approval workflow."),
    ]
    t_c = doc.add_table(rows=1, cols=5)
    t_c.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_c)
    w_c = [Inches(1.5), Inches(1.8), Inches(0.8), Inches(1.1), Inches(1.9)]
    for j, h in enumerate(["Persona Role", "Email Address", "Password", "Admin Role", "Demonstration Purpose"]):
        cell = t_c.rows[0].cells[j]
        cell.width = w_c[j]
        shd_cell(cell, HEX_NAVY)
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(8.5)
        r.font.color.rgb = C_WHITE

    for idx, (role, email, pw, arole, purp) in enumerate(creds):
        row = t_c.add_row()
        bg = HEX_LIGHT_BG if idx % 2 == 1 else HEX_WHITE
        for j, val in enumerate([role, email, pw, arole, purp]):
            cell = row.cells[j]
            cell.width = w_c[j]
            shd_cell(cell, bg)
            set_cell_margins(cell, 50, 50, 100, 100)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8)
            if j == 0:
                r.bold = True
                r.font.color.rgb = C_NAVY
            elif j in (1, 2):
                r.font.name = "Consolas"
                r.font.color.rgb = C_ROYAL
            elif j == 3:
                r.font.name = "Consolas"
                r.font.color.rgb = C_DARK
            else:
                r.font.color.rgb = C_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_heading_2(doc, "Appendix B: Essential SQL Queries for Viva Verification")
    sql_box = (
        "-- 1. Verify User Count & Breakdown by Role:\n"
        "SELECT role, COUNT(*) AS TotalCount FROM users GROUP BY role;\n\n"
        "-- 2. Inspect Active In-Flight Trips (Non-Completed):\n"
        "SELECT id, passenger_id, driver_id, status, ride_type, total_fare\n"
        "FROM trips WHERE status NOT IN ('COMPLETED', 'CANCELLED');\n\n"
        "-- 3. Calculate Platform Revenue & Commission Earnings:\n"
        "SELECT SUM(platform_commission) AS TotalCommissionLKR,\n"
        "       SUM(driver_net) AS TotalDriverEarningsLKR\n"
        "FROM payments WHERE status = 'SUCCESS';\n\n"
        "-- 4. Audit Log Verification Trail:\n"
        "SELECT TOP 10 id, action_type, performed_by_email, description, created_at\n"
        "FROM audit_logs ORDER BY created_at DESC;\n\n"
        "-- 5. Pending Driver Compliance Documents:\n"
        "SELECT d.id, u.email, d.doc_type, d.status, d.uploaded_at\n"
        "FROM driver_documents d JOIN users u ON d.driver_id = u.id\n"
        "WHERE d.status = 'PENDING';"
    )
    add_code_snippet(doc, sql_box, caption="Key SQL Queries for Live Lab / Viva Evaluation Demonstrations")

    add_heading_2(doc, "Appendix C: Canva Page Budget Allocation (Max 25 Pages)")
    budget = [
        ("Cover Page", "1 Page", "Title banner, logo, metadata, group member table with registration numbers."),
        ("Table of Contents & Exec Summary", "1 Page", "Navigational page index, 30-mark rubric breakdown, and executive summary."),
        ("Introduction", "2 Pages", "Project overview, 6 technical objectives, stakeholder matrix, in/out scope."),
        ("Requirements Specification", "2 Pages", "15 functional requirements table, 8 non-functional requirements, constraints."),
        ("System Design & Architecture", "5 Pages", "UCD diagram, 3-tier architecture, ER schema & 8 tables, API list, 10 screens."),
        ("Implementation & Technology", "3 Pages", "Tech stack table, 3 GoF design patterns, Haversine formula, screenshot guide."),
        ("Project Management", "2 Pages", "Agile methodology, 8-sprint deliverables table, task distribution, milestones."),
        ("Conclusion & Future Work", "2 Pages", "Achievements summary, 6 technical challenges & resolutions, 8 future goals."),
        ("Individual Contributions", "3 Pages", "Individual reflections for all 6 members and master 6-member rubric matrix table."),
        ("References", "1 Page", "15 IEEE-formatted formal academic and industry technical citations."),
        ("Appendices & Test Credentials", "2 Pages", "Pre-seeded credentials table, SQL demonstration queries, and rubric self-check."),
    ]
    t_b = doc.add_table(rows=1, cols=3)
    t_b.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_b)
    w_b = [Inches(2.2), Inches(1.1), Inches(3.8)]
    for j, h in enumerate(["Report Section", "Suggested Budget", "Target Content to Fit Within Page Boundary"]):
        cell = t_b.rows[0].cells[j]
        cell.width = w_b[j]
        shd_cell(cell, HEX_NAVY)
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(8.5)
        r.font.color.rgb = C_WHITE

    total_pages = 0
    for idx, (sec_name, pages, desc) in enumerate(budget):
        row = t_b.add_row()
        bg = HEX_LIGHT_BG if idx % 2 == 1 else HEX_WHITE
        for j, val in enumerate([sec_name, pages, desc]):
            cell = row.cells[j]
            cell.width = w_b[j]
            shd_cell(cell, bg)
            set_cell_margins(cell, 50, 50, 100, 100)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8)
            if j == 0:
                r.bold = True
                r.font.color.rgb = C_NAVY
            elif j == 1:
                r.bold = True
                r.font.color.rgb = C_ROYAL
            else:
                r.font.color.rgb = C_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # Final Success Callout
    add_card_box(
        doc,
        title="READY FOR CANVA & MOBILE DEFENSE",
        bullet_items=[
            ("Target Marks: ", "30 / 30 Marks. Every rubric line item has been addressed with exact, rich technical detail."),
            ("Mobile Ready: ", "This document and its companion PDF are styled with high-contrast fonts, clean cell padding, and portrait layout for effortless mobile reading."),
            ("Next Step: ", "Open Canva, apply your Navy Blue (#0D2B55) theme, copy the text and tables section by section, and embed screenshots taken from localhost:5173!"),
        ],
        icon="🚀",
        bg_hex="F0FDF4",
        border_color="059669"
    )

    out_docx = r"e:\2Y1S\2Y1S_Projects\SE_project\Streetify\Streetify_Backup\Streetify_Final_Report_Guide.docx"
    doc.save(out_docx)
    print(f"SUCCESS: DOCX generated successfully at: {out_docx}")
    return out_docx

if __name__ == "__main__":
    build_streetify_final_guide()
