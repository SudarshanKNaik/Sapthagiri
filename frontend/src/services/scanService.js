/**
 * Sahayak AI – Scan Service
 * Communicates with the Python FastAPI microservice on port 8001.
 * Gracefully degrades to Tesseract-only mode if AI service is unavailable.
 */

const AI_SERVICE_URL = "http://localhost:8001";

/** Check if the Python AI service is reachable */
export async function checkScanServiceHealth() {
  try {
    const res = await fetch(`${AI_SERVICE_URL}/scan/health`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { ok: false, reason: "non-200" };
    return await res.json();
  } catch {
    return { ok: false, reason: "unreachable" };
  }
}

/**
 * Submit a file to the AI analysis pipeline.
 * @param {File} file - The form file (PDF, JPG, PNG)
 * @param {object} userProfile - Existing user profile for autofill cross-reference
 * @param {string} language - UI language code
 * @param {function} onProgress - Called with (stage, pct) during processing
 * @returns {Promise<FormAnalysisResult>}
 */
export async function analyzeForm(file, userProfile = {}, language = "en", onProgress = () => {}) {
  onProgress("upload", 10);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("user_profile", JSON.stringify(userProfile));
  formData.append("language", language);

  onProgress("ocr", 30);

  let res;
  try {
    res = await fetch(`${AI_SERVICE_URL}/scan/analyze`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(120_000), // 2-min timeout for large PDFs
    });
  } catch (err) {
    throw new Error(
      `AI service unreachable. Make sure the Python microservice is running on port 8001.\n\nDetails: ${err.message}`
    );
  }

  onProgress("layoutlmv3", 65);

  if (!res.ok) {
    const detail = await res.text().catch(() => "unknown error");
    throw new Error(`Analysis failed (${res.status}): ${detail}`);
  }

  const data = await res.json();
  onProgress("autofill", 85);

  // Validate response shape
  if (!Array.isArray(data.fields)) {
    throw new Error("Invalid response from AI service: missing fields array.");
  }

  onProgress("done", 100);
  return data;
}

/**
 * Generate a reference PDF from analysis results.
 * @param {object} analysis - Result from analyzeForm()
 * @param {object} userProfile - User profile for additional context
 * @returns {Promise<string>} Base64-encoded PDF string
 */
export async function generateReferencePdf(analysis, userProfile = {}) {
  let res;
  try {
    res = await fetch(`${AI_SERVICE_URL}/scan/generate-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysis, user_profile: userProfile }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    throw new Error(`PDF generation failed: ${err.message}`);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "unknown");
    throw new Error(`PDF generation error (${res.status}): ${detail}`);
  }

  const data = await res.json();
  if (!data.pdf_base64) throw new Error("No PDF data in response.");
  return data.pdf_base64;
}

/**
 * Convert base64 PDF to a downloadable Blob URL.
 */
export function base64ToBlobUrl(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}

/**
 * Trigger browser download of a PDF from base64 string.
 */
export function downloadPdf(base64, filename = "sahayak-reference-copy.pdf") {
  const url = base64ToBlobUrl(base64);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ── Confidence helpers (used by UI) ────────────────────────────────────────

export const CONF_COLORS = {
  green: {
    border: "border-emerald-400",
    bg: "bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-500",
    label: "High Confidence",
  },
  yellow: {
    border: "border-amber-400",
    bg: "bg-amber-50",
    badge: "bg-amber-100 text-amber-800",
    dot: "bg-amber-400",
    label: "Review Needed",
  },
  red: {
    border: "border-red-400",
    bg: "bg-red-50",
    badge: "bg-red-100 text-red-800",
    dot: "bg-red-500",
    label: "Missing / Critical",
  },
};

export function getConfStyle(confLevel) {
  return CONF_COLORS[confLevel] || CONF_COLORS.yellow;
}
