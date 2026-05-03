"""
Reference PDF generation using ReportLab.
Overlays autofilled data and stamps REFERENCE COPY watermark.
"""
import io
import logging
from typing import Any

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.pdfgen import canvas as rl_canvas

logger = logging.getLogger("sahayak.pdf_generator")

PAGE_W, PAGE_H = A4  # 595.27 x 841.89 pts


def generate_reference_pdf(analysis: dict, user_profile: dict) -> bytes:
    """
    Generate a high-fidelity 'Official Form' style PDF that mimics the user's reference layout.
    """
    buf = io.BytesIO()
    c = rl_canvas.Canvas(buf, pagesize=A4)
    c.setTitle("APPLICATION FORM – Sahayak AI Reference Copy")

    fields = {f['label'].lower(): f['value'] for f in analysis.get('fields', [])}
    
    # helper to draw a section header
    def section_header(y, title):
        c.setFillColorRGB(0.9, 0.9, 0.9)
        c.rect(10 * mm, y - 5 * mm, PAGE_W - 20 * mm, 6 * mm, fill=1, stroke=1)
        c.setFillColorRGB(0, 0, 0)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(12 * mm, y - 1 * mm, title)
        return y - 5 * mm

    # helper to draw a label-value row
    def draw_row(y, label, value, x_label=12*mm, x_value=60*mm, height=7*mm):
        c.setLineWidth(0.2)
        c.rect(10 * mm, y - height, PAGE_W - 20 * mm, height, stroke=1)
        c.line(x_value - 5 * mm, y, x_value - 5 * mm, y - height) # Vertical separator
        c.setFont("Helvetica", 8)
        c.drawString(x_label, y - 5 * mm, label)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(x_value, y - 5 * mm, str(value or "—")[:80])
        return y - height

    # ── PAGE 1 ───────────────────────────────────────────────────────────
    # Outer Border
    c.setLineWidth(1)
    c.rect(5 * mm, 5 * mm, PAGE_W - 10 * mm, PAGE_H - 10 * mm)

    # Main Title
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 15 * mm, "APPLICATION FORM")
    c.setFont("Helvetica", 9)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 20 * mm, "(TO BE FILLED IN BLOCK LETTERS)")

    # Date / App No Box
    c.rect(PAGE_W - 70 * mm, PAGE_H - 22 * mm, 60 * mm, 12 * mm)
    c.setFont("Helvetica", 8)
    c.drawString(PAGE_W - 68 * mm, PAGE_H - 15 * mm, "Date : " + datetime.now().strftime("%d-%m-%Y"))
    c.drawString(PAGE_W - 68 * mm, PAGE_H - 20 * mm, "Application No. : ________________")

    curr_y = PAGE_H - 28 * mm

    # 1. PERSONAL DETAILS
    curr_y = section_header(curr_y, "1. PERSONAL DETAILS")
    curr_y = draw_row(curr_y, "Full Name (As per Documents)", fields.get("name") or fields.get("full name"))
    curr_y = draw_row(curr_y, "Father's Name", fields.get("father's name") or fields.get("father name"))
    curr_y = draw_row(curr_y, "Mother's Name", fields.get("mother's name") or fields.get("mother name"))
    curr_y = draw_row(curr_y, "Date of Birth", fields.get("date of birth") or fields.get("dob"))
    curr_y = draw_row(curr_y, "Gender", fields.get("gender"))
    curr_y = draw_row(curr_y, "Category", fields.get("category"))
    curr_y = draw_row(curr_y, "Nationality", fields.get("nationality", "INDIAN"))
    curr_y = draw_row(curr_y, "Religion", fields.get("religion"))
    curr_y = draw_row(curr_y, "Mobile Number", fields.get("mobile number") or fields.get("mobile"))
    curr_y = draw_row(curr_y, "Email ID", fields.get("email id") or fields.get("email"))

    # 2. ADDRESS DETAILS
    curr_y -= 2 * mm
    curr_y = section_header(curr_y, "2. ADDRESS DETAILS")
    curr_y = draw_row(curr_y, "Permanent Address", fields.get("permanent address") or fields.get("address"), height=15*mm)
    curr_y = draw_row(curr_y, "District", fields.get("district"), x_value=40*mm, height=7*mm)
    # Split row for Pincode
    c.line(100 * mm, curr_y, 100 * mm, curr_y + 7 * mm)
    c.drawString(102 * mm, curr_y + 2 * mm, "Pincode : " + str(fields.get("pincode", "—")))

    # 3. AADHAAR DETAILS
    curr_y -= 2 * mm
    curr_y = section_header(curr_y, "3. AADHAAR DETAILS")
    curr_y = draw_row(curr_y, "Aadhaar Number", fields.get("aadhaar number") or fields.get("aadhaar"), x_value=50*mm)
    curr_y = draw_row(curr_y, "Enrolment No.", fields.get("enrolment no"), x_value=50*mm)

    # 4. ACADEMIC DETAILS
    curr_y -= 2 * mm
    curr_y = section_header(curr_y, "4. ACADEMIC DETAILS (PUC / 12th)")
    # Table header for marks
    c.setLineWidth(0.2)
    c.rect(10 * mm, curr_y - 35 * mm, PAGE_W - 20 * mm, 35 * mm)
    c.line(60 * mm, curr_y, 60 * mm, curr_y - 35 * mm)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(15 * mm, curr_y - 5 * mm, "Subject")
    c.drawString(65 * mm, curr_y - 5 * mm, "Marks Obtained")
    
    subjects = ["ENGLISH", "HINDI/KANNADA", "PHYSICS", "CHEMISTRY", "MATHEMATICS", "BIOLOGY"]
    for i, sub in enumerate(subjects):
        sy = curr_y - 10 * mm - (i * 4 * mm)
        c.setFont("Helvetica", 7)
        c.drawString(15 * mm, sy, sub)
        val = fields.get(sub.lower(), "—")
        c.drawString(65 * mm, sy, str(val))
    
    curr_y -= 35 * mm

    # 5. INCOME & CASTE
    curr_y -= 2 * mm
    curr_y = section_header(curr_y, "5. INCOME & CASTE CERTIFICATE DETAILS")
    curr_y = draw_row(curr_y, "Annual Family Income", fields.get("annual family income") or fields.get("income"))
    curr_y = draw_row(curr_y, "Caste / Category", fields.get("caste"))

    # 6. BANK ACCOUNT DETAILS
    curr_y -= 2 * mm
    curr_y = section_header(curr_y, "6. BANK ACCOUNT DETAILS")
    curr_y = draw_row(curr_y, "Account Holder Name", fields.get("account holder name") or fields.get("name"))
    curr_y = draw_row(curr_y, "Account Number", fields.get("account number") or fields.get("account"))
    curr_y = draw_row(curr_y, "IFSC Code", fields.get("ifsc code") or fields.get("ifsc"))

    # 7. DECLARATION
    curr_y -= 2 * mm
    curr_y = section_header(curr_y, "7. DECLARATION")
    c.setFont("Helvetica-Oblique", 7)
    decl_text = "I hereby declare that the information provided above is true and correct to the best of my knowledge and belief. I understand that in case any information is found to be false, my application is liable to be rejected."
    c.drawString(12 * mm, curr_y - 5 * mm, decl_text[:110])
    c.drawString(12 * mm, curr_y - 8 * mm, decl_text[110:])
    
    c.setFont("Helvetica", 8)
    c.drawString(12 * mm, curr_y - 25 * mm, "Date : " + datetime.now().strftime("%d-%m-%Y"))
    c.drawString(PAGE_W - 50 * mm, curr_y - 25 * mm, "Signature of Applicant")

    # Watermark
    c.saveState()
    c.setFont("Helvetica-Bold", 60)
    c.setFillColorRGB(0.9, 0.9, 0.9, alpha=0.2)
    c.translate(PAGE_W / 2, PAGE_H / 2)
    c.rotate(45)
    c.drawCentredString(0, 0, "REFERENCE COPY")
    c.restoreState()

    c.save()
    buf.seek(0)
    return buf.read()



def _draw_watermark_only(c: rl_canvas.Canvas):
    c.saveState()
    c.setFont("Helvetica-Bold", 36)
    c.setFillColorRGB(0.85, 0.85, 0.85, alpha=0.35)
    c.translate(PAGE_W / 2, PAGE_H / 2)
    c.rotate(45)
    c.drawCentredString(0, 0, "REFERENCE COPY")
    c.restoreState()
