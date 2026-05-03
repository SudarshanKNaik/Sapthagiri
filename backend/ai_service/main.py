"""
SAHAYAK AI – Offline Scan Microservice
FastAPI entry point, Port 8001
"""
import os
import io
import base64
import logging
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from scanner import FormScanner, FormAnalysisResult
from pdf_generator import generate_reference_pdf

# ─── Logging ───────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("sahayak.ai_service")

# ─── App ────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="SAHAYAK AI Form Scanner",
    description="LayoutLMv3-powered offline form analysis microservice",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Global scanner (loaded once at startup) ────────────────────────────────
scanner: Optional[FormScanner] = None


@app.on_event("startup")
async def startup_event():
    global scanner
    logger.info("Loading LayoutLMv3 model… (first run downloads ~500 MB)")
    try:
        scanner = FormScanner()
        logger.info("✅ FormScanner ready.")
    except Exception as e:
        logger.error(f"❌ Scanner init failed: {e}")
        scanner = None


# ─── Models ─────────────────────────────────────────────────────────────────
class PdfGenerationRequest(BaseModel):
    analysis: dict
    user_profile: Optional[dict] = None


# ─── Endpoints ──────────────────────────────────────────────────────────────

@app.get("/scan/health")
async def health():
    return {
        "ok": True,
        "scanner_ready": scanner is not None and scanner.model_loaded,
        "model": "microsoft/layoutlmv3-base",
    }


@app.post("/scan/analyze")
async def analyze_form(
    file: UploadFile = File(...),
    user_profile: str = Form(default="{}"),
    language: str = Form(default="en"),
):
    """
    Accepts a PDF or image file.
    Returns structured form fields with confidence scores,
    autofilled values from user_profile, and field metadata.
    """
    if scanner is None:
        raise HTTPException(status_code=503, detail="Scanner not initialised. Check logs.")

    # Read file bytes
    content = await file.read()
    filename = file.filename or "upload"
    mime = file.content_type or "application/octet-stream"

    logger.info(f"Analyzing: {filename} ({mime}, {len(content)} bytes)")

    try:
        import json
        profile = json.loads(user_profile) if user_profile else {}
        result: FormAnalysisResult = scanner.analyze(
            file_bytes=content,
            filename=filename,
            mime_type=mime,
            user_profile=profile,
            language=language,
        )
        return JSONResponse(content=result.to_dict())
    except Exception as e:
        logger.exception("Analysis failed")
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")


@app.post("/scan/generate-pdf")
async def generate_pdf(request: PdfGenerationRequest):
    """
    Generates a Reference Copy PDF with autofilled data overlaid.
    Returns base64-encoded PDF.
    """
    try:
        pdf_bytes = generate_reference_pdf(
            analysis=request.analysis,
            user_profile=request.user_profile or {},
        )
        pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")
        return {"ok": True, "pdf_base64": pdf_b64, "size_bytes": len(pdf_bytes)}
    except Exception as e:
        logger.exception("PDF generation failed")
        raise HTTPException(status_code=500, detail=f"PDF error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=False)
