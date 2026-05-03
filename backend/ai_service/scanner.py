"""
LayoutLMv3 + Donut + Tesseract form analysis pipeline.
"""
import io
import re
import logging
import json
from dataclasses import dataclass, field
from typing import Any, Optional
from pathlib import Path

import cv2
import numpy as np
import pytesseract
from PIL import Image

logger = logging.getLogger("sahayak.scanner")

# ── Tesseract path (Windows default) ──────────────────────────────────────
TESSERACT_CMD = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
if Path(TESSERACT_CMD).exists():
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD


# ── Data structures ────────────────────────────────────────────────────────

@dataclass
class FormField:
    field_id: str
    label: str
    value: str
    confidence: float          # 0.0 – 1.0
    field_type: str            # text | checkbox | date | number | select
    required: bool
    autofilled: bool
    bbox: list[int]            # [x0, y0, x1, y1] normalised 0-1000
    explanation: str = ""
    warning: str = ""
    suggested_docs: list[str] = field(default_factory=list)

    def conf_level(self) -> str:
        if self.confidence >= 0.75:
            return "green"
        if self.confidence >= 0.40:
            return "yellow"
        return "red"

    def to_dict(self) -> dict:
        return {
            "field_id": self.field_id,
            "label": self.label,
            "value": self.value,
            "confidence": round(self.confidence, 3),
            "field_type": self.field_type,
            "required": self.required,
            "autofilled": self.autofilled,
            "bbox": self.bbox,
            "conf_level": self.conf_level(),
            "explanation": self.explanation,
            "warning": self.warning,
            "suggested_docs": self.suggested_docs,
        }


@dataclass
class FormAnalysisResult:
    fields: list[FormField]
    raw_text: str
    form_title: str
    instructions: list[str]
    model_used: str            # "layoutlmv3" | "donut" | "tesseract-only"
    overall_confidence: float
    page_count: int
    image_width: int
    image_height: int

    def to_dict(self) -> dict:
        return {
            "fields": [f.to_dict() for f in self.fields],
            "raw_text": self.raw_text[:3000],
            "form_title": self.form_title,
            "instructions": self.instructions,
            "model_used": self.model_used,
            "overall_confidence": round(self.overall_confidence, 3),
            "page_count": self.page_count,
            "image_width": self.image_width,
            "image_height": self.image_height,
            "autofill_count": sum(1 for f in self.fields if f.autofilled),
            "missing_count": sum(1 for f in self.fields if not f.value),
        }


# ── Preprocessing ──────────────────────────────────────────────────────────

def preprocess_image(pil_img: Image.Image) -> Image.Image:
    """OpenCV pipeline: greyscale → denoise → threshold → deskew."""
    arr = np.array(pil_img.convert("RGB"))
    grey = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
    denoised = cv2.fastNlMeansDenoising(grey, h=10)
    _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Deskew
    coords = np.column_stack(np.where(thresh < 128))
    if len(coords) > 10:
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = 90 + angle
        if abs(angle) > 0.5:
            h, w = thresh.shape
            M = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
            thresh = cv2.warpAffine(thresh, M, (w, h), flags=cv2.INTER_CUBIC,
                                    borderMode=cv2.BORDER_REPLICATE)

    return Image.fromarray(thresh)


def pdf_to_images(file_bytes: bytes) -> list[Image.Image]:
    """Convert PDF bytes → list of PIL images (one per page) using PyMuPDF (fitz)."""
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        pages = []
        for page in doc:
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for 144 DPI
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            pages.append(img)
        doc.close()
        return pages
    except Exception as e:
        logger.warning(f"PyMuPDF conversion failed ({e}), trying fallback")
        return []


def bytes_to_image(file_bytes: bytes, mime: str) -> list[Image.Image]:
    if "pdf" in mime.lower():
        pages = pdf_to_images(file_bytes)
        if pages:
            return pages
    try:
        img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        return [img]
    except Exception as e:
        raise ValueError(f"Cannot open image: {e}")


# ── EasyOCR helper ─────────────────────────────────────────────────────────

def easy_ocr(img: Image.Image, reader) -> tuple[str, list[dict]]:
    """Return (full_text, word_data) using EasyOCR reader."""
    try:
        # Convert PIL to numpy
        img_np = np.array(img.convert("RGB"))
        # EasyOCR: [[bbox], text, conf]
        results = reader.readtext(img_np)
        
        words = []
        full_words = []
        w, h = img.size
        
        for (bbox, text, conf) in results:
            txt = text.strip()
            if not txt:
                continue
            
            # bbox: [[x0,y0], [x1,y0], [x1,y1], [x0,y1]]
            # Normalise to 0-1000
            x0 = int(min(p[0] for p in bbox) * 1000 / w)
            y0 = int(min(p[1] for p in bbox) * 1000 / h)
            x1 = int(max(p[0] for p in bbox) * 1000 / w)
            y1 = int(max(p[1] for p in bbox) * 1000 / h)
            
            words.append({"text": txt, "bbox": [x0, y0, x1, y1], "conf": float(conf)})
            full_words.append(txt)
            
        return " ".join(full_words), words
    except Exception as e:
        logger.error(f"EasyOCR failed: {e}")
        return "", []


# ── LayoutLMv3 inference ───────────────────────────────────────────────────

LAYOUTLM_LABELS = ["O", "B-HEADER", "B-LABEL", "B-VALUE", "B-CHECKBOX", "B-INSTRUCTION",
                   "I-HEADER", "I-LABEL", "I-VALUE", "I-CHECKBOX", "I-INSTRUCTION"]

def run_layoutlmv3(processor, model, image: Image.Image, words: list[dict]):
    """Run LayoutLMv3 inference. Returns list of (word, label, score)."""
    import torch
    if not words:
        return []
    try:
        texts = [w["text"] for w in words]
        boxes = [w["bbox"] for w in words]
        encoding = processor(
            image,
            texts,
            boxes=boxes,
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding="max_length",
        )
        with torch.no_grad():
            outputs = model(**encoding)

        logits = outputs.logits[0]  # [seq_len, num_labels]
        probs = torch.softmax(logits, dim=-1)
        preds = torch.argmax(logits, dim=-1).tolist()
        scores = probs.max(dim=-1).values.tolist()

        # Map back to word tokens (skip special tokens)
        input_ids = encoding["input_ids"][0].tolist()
        word_ids = encoding.word_ids(batch_index=0)

        seen_word_ids = set()
        results = []
        for token_idx, word_id in enumerate(word_ids):
            if word_id is None or word_id in seen_word_ids:
                continue
            seen_word_ids.add(word_id)
            if word_id < len(words):
                label_idx = preds[token_idx]
                label = LAYOUTLM_LABELS[label_idx] if label_idx < len(LAYOUTLM_LABELS) else "O"
                score = scores[token_idx]
                results.append({
                    "word": words[word_id]["text"],
                    "label": label,
                    "score": score,
                    "bbox": words[word_id]["bbox"],
                })
        return results
    except Exception as e:
        logger.error(f"LayoutLMv3 inference error: {e}")
        return []


# ── Field extraction from token labels ────────────────────────────────────

def extract_fields_from_tokens(token_results: list[dict], raw_text: str) -> list[FormField]:
    """
    Group consecutive LABEL+VALUE token sequences into FormField objects.
    Falls back to heuristic regex if LayoutLMv3 returns no useful labels.
    """
    if not token_results:
        return _heuristic_extract(raw_text)

    fields = []
    current_label = ""
    current_value_parts = []
    current_bbox = [1000, 1000, 0, 0]
    field_idx = 0

    def flush():
        nonlocal current_label, current_value_parts, current_bbox, field_idx
        if current_label:
            lbl = current_label.strip()
            val = " ".join(current_value_parts).strip()
            ftype = _infer_field_type(lbl, val)
            ff = FormField(
                field_id=f"field_{field_idx}",
                label=lbl,
                value=val,
                confidence=0.0,
                field_type=ftype,
                required=_is_required(lbl),
                autofilled=False,
                bbox=current_bbox[:],
                explanation=_explain_label(lbl),
                suggested_docs=_suggest_docs(lbl),
            )
            fields.append(ff)
            field_idx += 1
        current_label = ""
        current_value_parts = []
        current_bbox = [1000, 1000, 0, 0]

    for tok in token_results:
        lbl = tok["label"]
        word = tok["word"]
        bb = tok["bbox"]

        if lbl in ("B-LABEL", "I-LABEL"):
            if lbl == "B-LABEL":
                flush()
                current_label = word
            else:
                current_label += " " + word
        elif lbl in ("B-VALUE", "I-VALUE"):
            current_value_parts.append(word)
            current_bbox[0] = min(current_bbox[0], bb[0])
            current_bbox[1] = min(current_bbox[1], bb[1])
            current_bbox[2] = max(current_bbox[2], bb[2])
            current_bbox[3] = max(current_bbox[3], bb[3])
        elif lbl == "B-HEADER":
            flush()

    flush()

    # If LayoutLMv3 found no label/value pairs, fall back
    if len(fields) == 0:
        return _heuristic_extract(raw_text)

    return fields


def _heuristic_extract(text: str) -> list[FormField]:
    """Regex-based fallback: detect 'Label: Value' patterns."""
    pattern = re.compile(
        r"(?P<label>[A-Za-z][A-Za-z\s/().]{2,50}?)"
        r"\s*[:\-–]\s*"
        r"(?P<value>[^\n\r]{0,100})",
        re.MULTILINE,
    )
    fields = []
    seen = set()
    for i, m in enumerate(pattern.finditer(text)):
        lbl = m.group("label").strip()
        val = m.group("value").strip()
        if lbl.lower() in seen or len(lbl) < 3:
            continue
        seen.add(lbl.lower())
        ftype = _infer_field_type(lbl, val)
        fields.append(FormField(
            field_id=f"field_{i}",
            label=lbl,
            value=val,
            confidence=0.55,
            field_type=ftype,
            required=_is_required(lbl),
            autofilled=False,
            bbox=[0, i * 50, 500, i * 50 + 40],
            explanation=_explain_label(lbl),
            suggested_docs=_suggest_docs(lbl),
        ))
    return fields[:100]


# ── Heuristic helpers ──────────────────────────────────────────────────────

_REQUIRED_KEYWORDS = {"name", "dob", "date of birth", "aadhaar", "income", "address",
                      "mobile", "phone", "bank account", "ifsc", "marks", "percentage",
                      "father", "mother", "signature", "place", "date"}

def _is_required(label: str) -> bool:
    l = label.lower()
    return any(k in l for k in _REQUIRED_KEYWORDS)


def _infer_field_type(label: str, value: str) -> str:
    l = label.lower()
    if any(k in l for k in ("date", "dob", "born")):
        return "date"
    if any(k in l for k in ("income", "amount", "marks", "percentage", "account", "pincode", "mobile")):
        return "number"
    if any(k in l for k in ("yes/no", "checkbox", "tick", "select")):
        return "checkbox"
    return "text"


_EXPLANATIONS = {
    "aadhaar": "Your 12-digit unique government identity number issued by UIDAI.",
    "income": "Total annual household income from all sources in Indian Rupees.",
    "dob": "Your date of birth in DD/MM/YYYY format as on your birth certificate.",
    "marks": "Percentage marks obtained in your last qualifying examination.",
    "ifsc": "11-character bank branch code printed on your cheque book or passbook.",
    "account": "Your bank savings account number (do not enter loan/credit account).",
    "address": "Your current residential address including district, state, and PIN code.",
    "caste": "Your caste category as per government records (SC/ST/OBC/General).",
    "father": "Your father's full name as on official documents.",
    "mother": "Your mother's full name as on official documents.",
    "gender": "Your gender (Male/Female/Other) as per official records.",
    "mobile": "Your 10-digit mobile number for communication.",
}

def _explain_label(label: str) -> str:
    l = label.lower()
    for key, exp in _EXPLANATIONS.items():
        if key in l:
            return exp
    return f"Please enter your {label.lower()} accurately as per your official documents."


_DOC_SUGGESTIONS = {
    "income": ["Income Certificate issued by Tahsildar"],
    "aadhaar": ["Aadhaar Card (front and back)"],
    "marks": ["Marks Card / Hall Ticket"],
    "caste": ["Caste Certificate from Tahsildar"],
    "bank": ["Bank Passbook first page", "Cancelled Cheque"],
    "address": ["Ration Card", "Utility Bill", "Aadhaar Card"],
}

def _suggest_docs(label: str) -> list[str]:
    l = label.lower()
    for key, docs in _DOC_SUGGESTIONS.items():
        if key in l:
            return docs
    return []


# ── Profile autofill cross-reference ──────────────────────────────────────

_PROFILE_FIELD_MAP = {
    "name": ["name", "applicant", "student", "full name", "candidate"],
    "dob": ["date of birth", "dob", "birth date", "born on"],
    "income": ["income", "annual", "family income", "household income", "earnings"],
    "marks": ["marks", "percentage", "cgpa", "grade", "total score"],
    "accountNumber": ["account number", "bank account", "a/c no", "account no"],
    "ifsc": ["ifsc", "ifsc code", "branch code", "bank code"],
    "fatherName": ["father", "guardian", "father's name"],
    "motherName": ["mother", "mother's name"],
    "address": ["address", "residential", "communication address"],
    "mobile": ["mobile", "phone", "contact number", "cell"],
}

def autofill_from_profile(fields: list[FormField], profile: dict) -> list[FormField]:
    """Cross-reference extracted fields against user profile and autofill known values."""
    for f in fields:
        lbl = f.label.lower()
        for profile_key, synonyms in _PROFILE_FIELD_MAP.items():
            if any(syn in lbl for syn in synonyms):
                val = profile.get(profile_key, "")
                if val:
                    f.value = str(val)
                    f.autofilled = True
                    f.confidence = max(f.confidence, 0.90)
                break

        # Expiry / age warning
        if "income" in lbl and f.value:
            f.warning = "Income certificate must be issued within the last 6 months."
        if "marks" in lbl and f.value:
            try:
                m = float(re.sub(r"[^0-9.]", "", f.value))
                if m < 50:
                    f.warning = "Most scholarships require ≥50% marks. Verify eligibility."
            except Exception:
                pass

    return fields


# ── Main scanner class ─────────────────────────────────────────────────────

class FormScanner:
    def __init__(self):
        self.model_loaded = False
        self._processor = None
        self._model = None
        self._ocr_reader = None
        self._load_ocr()
        self._load_layoutlmv3()

    def _load_ocr(self):
        try:
            import easyocr
            logger.info("Initializing EasyOCR reader…")
            self._ocr_reader = easyocr.Reader(['en', 'hi']) # Support English and Hindi
            logger.info("✅ EasyOCR ready.")
        except Exception as e:
            logger.error(f"Failed to load EasyOCR: {e}")

    def _load_layoutlmv3(self):
        try:
            from transformers import LayoutLMv3Processor, LayoutLMv3ForTokenClassification
            from transformers import LayoutLMv3Config

            logger.info("Loading LayoutLMv3Processor…")
            self._processor = LayoutLMv3Processor.from_pretrained(
                "microsoft/layoutlmv3-base", apply_ocr=False
            )

            logger.info("Loading LayoutLMv3ForTokenClassification…")
            # Using the exact config class from the spec
            config = LayoutLMv3Config.from_pretrained("microsoft/layoutlmv3-base")
            config.num_labels = len(LAYOUTLM_LABELS)
            self._model = LayoutLMv3ForTokenClassification.from_pretrained(
                "microsoft/layoutlmv3-base",
                config=config,
                ignore_mismatched_sizes=True,
            )
            self._model.eval()
            self.model_loaded = True
            logger.info("✅ LayoutLMv3 loaded successfully.")
        except Exception as e:
            logger.warning(f"LayoutLMv3 load failed ({e}). Will use Tesseract-only mode.")
            self.model_loaded = False

    def analyze(
        self,
        file_bytes: bytes,
        filename: str,
        mime_type: str,
        user_profile: dict,
        language: str = "en",
    ) -> FormAnalysisResult:
        # Step 1: Decode to images
        images = bytes_to_image(file_bytes, mime_type)
        if not images:
            raise ValueError("Could not decode file into image(s).")

        primary_img = images[0]
        w, h = primary_img.size

        # Step 2: OpenCV preprocess
        clean_img = preprocess_image(primary_img)

        # Step 3: OCR (EasyOCR)
        raw_text, word_data = easy_ocr(primary_img, self._ocr_reader)
        logger.info(f"OCR extracted {len(word_data)} words.")

        # Step 4: LayoutLMv3 token classification (if available)
        model_used = "easyocr-only"
        token_results = []

        if self.model_loaded and word_data:
            logger.info("Running LayoutLMv3 inference…")
            token_results = run_layoutlmv3(
                self._processor, self._model,
                primary_img.resize((224, 224)),
                word_data[:512],
            )
            if token_results:
                labeled_count = sum(1 for t in token_results if t["label"] != "O")
                avg_score = sum(t["score"] for t in token_results) / len(token_results)
                logger.info(f"LayoutLMv3: {labeled_count} labeled tokens, avg conf={avg_score:.2f}")

                if avg_score >= 0.40:
                    model_used = "layoutlmv3"
                else:
                    # Low confidence → try Donut fallback
                    logger.info("Low LayoutLMv3 confidence. Attempting Donut fallback…")
                    donut_fields = self._try_donut(primary_img)
                    if donut_fields:
                        model_used = "donut"
                        fields = donut_fields
                        fields = autofill_from_profile(fields, user_profile)
                        return self._build_result(fields, raw_text, images, model_used, w, h)

        # Step 5: Extract fields from tokens (or heuristic fallback)
        fields = extract_fields_from_tokens(token_results, raw_text)

        # Step 6: Assign confidence from token scores
        if token_results and model_used == "layoutlmv3":
            score_map: dict[str, float] = {}
            for t in token_results:
                if t["label"] in ("B-VALUE", "I-VALUE"):
                    score_map[t["word"]] = t["score"]
            for f in fields:
                parts = f.value.split()
                if parts:
                    avg = sum(score_map.get(p, 0.5) for p in parts) / len(parts)
                    f.confidence = round(avg, 3)
                else:
                    f.confidence = 0.3

        # Step 7: Profile autofill
        fields = autofill_from_profile(fields, user_profile)

        return self._build_result(fields, raw_text, images, model_used, w, h)

    def _try_donut(self, img: Image.Image) -> list[FormField]:
        """Attempt Donut inference as secondary model."""
        try:
            from transformers import DonutProcessor, VisionEncoderDecoderModel
            logger.info("Loading Donut model…")
            proc = DonutProcessor.from_pretrained("naver-clova-ix/donut-base")
            mdl = VisionEncoderDecoderModel.from_pretrained("naver-clova-ix/donut-base")
            mdl.eval()

            import torch
            pixel_values = proc(img.convert("RGB"), return_tensors="pt").pixel_values
            task_prompt = "<s_cord-v2>"
            decoder_input_ids = proc.tokenizer(
                task_prompt, add_special_tokens=False, return_tensors="pt"
            ).input_ids
            outputs = mdl.generate(
                pixel_values,
                decoder_input_ids=decoder_input_ids,
                max_length=mdl.decoder.config.max_position_embeddings,
                early_stopping=True,
                pad_token_id=proc.tokenizer.pad_token_id,
                eos_token_id=proc.tokenizer.eos_token_id,
                use_cache=True,
                num_beams=1,
                bad_words_ids=[[proc.tokenizer.unk_token_id]],
                return_dict_in_generate=True,
            )
            seq = proc.batch_decode(outputs.sequences)[0]
            seq = seq.replace(proc.tokenizer.eos_token, "").replace(proc.tokenizer.pad_token, "")
            # Parse simple JSON output from Donut
            result = proc.token2json(seq)
            fields = []
            if isinstance(result, dict):
                for i, (k, v) in enumerate(result.items()):
                    fields.append(FormField(
                        field_id=f"donut_{i}",
                        label=k,
                        value=str(v),
                        confidence=0.65,
                        field_type=_infer_field_type(k, str(v)),
                        required=_is_required(k),
                        autofilled=False,
                        bbox=[0, i * 60, 500, i * 60 + 50],
                        explanation=_explain_label(k),
                        suggested_docs=_suggest_docs(k),
                    ))
            return fields
        except Exception as e:
            logger.warning(f"Donut fallback failed: {e}")
            return []

    def _build_result(
        self,
        fields: list[FormField],
        raw_text: str,
        images: list[Image.Image],
        model_used: str,
        w: int,
        h: int,
    ) -> FormAnalysisResult:
        overall = (
            sum(f.confidence for f in fields) / len(fields) if fields else 0.0
        )
        instructions = _extract_instructions(raw_text)
        form_title = _extract_title(raw_text)
        return FormAnalysisResult(
            fields=fields,
            raw_text=raw_text,
            form_title=form_title,
            instructions=instructions,
            model_used=model_used,
            overall_confidence=overall,
            page_count=len(images),
            image_width=w,
            image_height=h,
        )


def _extract_title(text: str) -> str:
    lines = [l.strip() for l in text.splitlines() if len(l.strip()) > 8]
    for line in lines[:6]:
        if any(k in line.lower() for k in ("form", "application", "scheme", "scholarship",
                                             "certificate", "government", "department")):
            return line[:100]
    return lines[0][:100] if lines else "Government Form"


def _extract_instructions(text: str) -> list[str]:
    patterns = [
        r"(?:note|instruction|important)[:\-–]?\s*([^\n.]{20,200})",
        r"\*\s*([A-Z][^\n]{20,200})",
    ]
    found = []
    for pat in patterns:
        for m in re.finditer(pat, text, re.IGNORECASE):
            inst = m.group(1).strip()
            if inst not in found:
                found.append(inst)
    return found[:8]
