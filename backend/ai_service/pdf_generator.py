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
    Generate a human-readable reference copy PDF from form analysis results.
    Returns raw PDF bytes.
    """
    buf = io.BytesIO()
    c = rl_canvas.Canvas(buf, pagesize=A4)
    c.setTitle("REFERENCE COPY – Sahayak AI Form Assist")

    fields = analysis.get("fields", [])
    
    # Header for the first page
    _draw_header(c, analysis)
    y = PAGE_H - 45 * mm
    
    for i, f in enumerate(fields):
        # Page break logic
        if y < 25 * mm:
            c.showPage()
            _draw_header(c, analysis, page_num=len(c._pages)+1)
            y = PAGE_H - 45 * mm

        conf_colors = {
            "green": (0.06, 0.65, 0.37),
            "yellow": (0.88, 0.67, 0.01),
            "red": (0.88, 0.18, 0.18),
        }
        conf_level = f.get("conf_level", "yellow")
        rgb = conf_colors.get(conf_level, (0.5, 0.5, 0.5))
        value = f.get("value", "") or "—"
        label = f.get("label", "")
        conf_pct = f"{int(f.get('confidence', 0) * 100)}%"
        status = "✓ Autofilled" if f.get("autofilled") else ("⚠ Missing" if not value or value == "—" else "· Manual")

        # Row background
        if i % 2 == 0:
            c.setFillColorRGB(0.98, 0.98, 0.99)
            c.rect(14 * mm, y - 2 * mm, PAGE_W - 28 * mm, 8 * mm, fill=1, stroke=0)
        
        if f.get("autofilled"):
            c.setFillColorRGB(0.93, 0.99, 0.95)
            c.rect(14 * mm, y - 2 * mm, PAGE_W - 28 * mm, 8 * mm, fill=1, stroke=0)

        c.setFillColorRGB(0.1, 0.1, 0.1)
        c.setFont("Helvetica", 8)
        c.drawString(15 * mm, y, label[:40])

        c.setFont("Helvetica-Bold" if f.get("autofilled") else "Helvetica", 8)
        c.setFillColorRGB(0.07, 0.07, 0.16)
        c.drawString(75 * mm, y, str(value)[:50])

        # Confidence pill
        c.setFillColorRGB(*rgb)
        c.roundRect(144 * mm, y - 1.5 * mm, 18 * mm, 6 * mm, 2, fill=1, stroke=0)
        c.setFillColorRGB(1, 1, 1)
        c.setFont("Helvetica-Bold", 7)
        c.drawCentredString(153 * mm, y + 1 * mm, conf_pct)

        # Status
        c.setFillColorRGB(*rgb)
        c.setFont("Helvetica", 8)
        c.drawString(170 * mm, y, status)

        y -= 9 * mm
        
        if f.get("warning"):
            if y < 20 * mm:
                c.showPage()
                _draw_header(c, analysis, page_num=len(c._pages)+1)
                y = PAGE_H - 45 * mm
            c.setFillColorRGB(0.7, 0.4, 0.0)
            c.setFont("Helvetica-Oblique", 7)
            c.drawString(75 * mm, y + 4 * mm, f"⚠ {f['warning'][:80]}")
            y -= 4 * mm

    c.save()
    buf.seek(0)
    return buf.read()

def _draw_header(c: rl_canvas.Canvas, analysis: dict, page_num: int = 1):
    # Watermark
    c.saveState()
    c.setFont("Helvetica-Bold", 45)
    c.setFillColorRGB(0.92, 0.92, 0.92, alpha=0.3)
    c.translate(PAGE_W / 2, PAGE_H / 2)
    c.rotate(45)
    c.drawCentredString(0, 0, "REFERENCE COPY")
    c.restoreState()

    # Blue header bar
    c.setFillColorRGB(0.07, 0.07, 0.25)
    c.rect(0, PAGE_H - 35 * mm, PAGE_W, 35 * mm, fill=1, stroke=0)
    
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(15 * mm, PAGE_H - 12 * mm, "SAHAYAK AI – Offline Form Assist")
    
    c.setFont("Helvetica", 9)
    c.drawRightString(PAGE_W - 15 * mm, PAGE_H - 12 * mm, f"Page {page_num} | REFERENCE COPY")
    
    c.setFont("Helvetica-Bold", 11)
    title = analysis.get("form_title", "Government Form")
    c.drawString(15 * mm, PAGE_H - 22 * mm, title[:85])
    
    # Sub-header stats
    c.setFont("Helvetica", 8)
    c.setFillColorRGB(0.8, 0.8, 1.0)
    stats = (
        f"Model: {analysis.get('model_used','AI').upper()} | "
        f"Confidence: {int(analysis.get('overall_confidence',0)*100)}% | "
        f"Auto-filled: {analysis.get('autofill_count',0)} | "
        f"Missing: {analysis.get('missing_count',0)}"
    )
    c.drawString(15 * mm, PAGE_H - 28 * mm, stats)

    # Column labels
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(15 * mm, PAGE_H - 42 * mm, "Field Label")
    c.drawString(75 * mm, PAGE_H - 42 * mm, "Extracted / Autofilled Value")
    c.drawString(145 * mm, PAGE_H - 42 * mm, "Conf.")
    c.drawString(170 * mm, PAGE_H - 42 * mm, "Status")
    c.setStrokeColorRGB(1, 1, 1)
    c.line(15 * mm, PAGE_H - 44 * mm, PAGE_W - 15 * mm, PAGE_H - 44 * mm)



def _draw_watermark_only(c: rl_canvas.Canvas):
    c.saveState()
    c.setFont("Helvetica-Bold", 36)
    c.setFillColorRGB(0.85, 0.85, 0.85, alpha=0.35)
    c.translate(PAGE_W / 2, PAGE_H / 2)
    c.rotate(45)
    c.drawCentredString(0, 0, "REFERENCE COPY")
    c.restoreState()
