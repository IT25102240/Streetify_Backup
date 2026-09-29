"""
build_report.py — Master runner: assembles all parts into one .docx
Run: python build_report.py
"""
import sys
sys.path.insert(0, ".")

from docx import Document
from docx.shared import Pt
from rpt_helpers import *

# Build the document
doc = Document()
style = doc.styles["Normal"]
style.font.name = "Calibri"
style.font.size = Pt(11)

print("Building Cover + Part A + Part B ...")
import gen_cover_a
gen_cover_a.build(doc)

print("Building Part C + Part D ...")
import gen_c_d
gen_c_d.build(doc)

print("Building Part E + Part F + Part G + References ...")
import gen_e_g
gen_e_g.build(doc)

out_files = ["Streetify_DDD_Assignment2_FINAL.docx", "Streetify_DDD_Assignment2_UPDATED.docx", "Streetify_DDD_Assignment2_v3.docx"]
saved = False
for fname in out_files:
    try:
        doc.save(fname)
        print(f"\n SUCCESS: Document saved as: {fname}")
        saved = True
        break
    except PermissionError:
        print(f" NOTE: '{fname}' is currently open in Word. Trying next filename...")
if not saved:
    import time
    ts_name = f"Streetify_DDD_Assignment2_{int(time.time())}.docx"
    doc.save(ts_name)
    print(f"\n SUCCESS: Document saved as: {ts_name}")

print(f"  Estimated pages: ~35-40 when screenshots are added.")
