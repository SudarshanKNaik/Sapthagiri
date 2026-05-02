const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const { GoogleGenerativeAI } = require("@google/generative-ai");

require("dotenv").config();

const { runOcr } = require("./ocrService");
const { classifyDocument } = require("./classify");
const { extractProfileFields, extractIssueDate } = require("./extractors");
const { readJson, writeJson, ensureDir } = require("./storage");
const { listSchemes, computeEligibility } = require("./eligibility");
const { simplifyInstruction } = require("./instructionSimplifier");
const {
  sendEligibilitySMS,
  sendMissingDocumentSMS,
  sendSubmissionSMS,
  sendStatusUpdateSMS,
} = require("./smsService");

const PORT = process.env.PORT || 3002;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash-latest";
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const UPLOAD_DIR = path.resolve(__dirname, "..", "uploads");
const LOCKER_PATH = path.resolve(__dirname, "..", "data", "locker.json");
const HISTORY_PATH = path.resolve(__dirname, "..", "data", "history.json");

ensureDir(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || "");
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({ storage });

const app = express();
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});
app.use(cors({ origin: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

function getSessionId(req) {
  return req.headers["x-session-id"] || req.body?.sessionId || req.query?.sessionId || "";
}

function lockerRead(sessionId) {
  const db = readJson(LOCKER_PATH, { users: {} });
  return db.users[sessionId] || {};
}

function lockerUpsert(sessionId, patch) {
  const db = readJson(LOCKER_PATH, { users: {} });
  const old = db.users[sessionId] || {};
  
  db.users[sessionId] = {
    ...old,
    ...patch,
    profile: {
      ...(old.profile || {}),
      ...Object.fromEntries(Object.entries(patch.profile || {}).filter(([_, v]) => v !== "" && v !== null)),
    },
    verification: {
      ...(old.verification || {}),
      ...(patch.verification || {}),
    },
    documents: {
      ...(old.documents || {}),
      ...(patch.documents || {}),
    },
    updatedAt: new Date().toISOString(),
  };
  writeJson(LOCKER_PATH, db);
  return db.users[sessionId];
}

function historyAppend(sessionId, entry) {
  const db = readJson(HISTORY_PATH, { users: {} });
  db.users[sessionId] = db.users[sessionId] || [];
  db.users[sessionId].unshift(entry);
  writeJson(HISTORY_PATH, db);
  return db.users[sessionId];
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/login", (req, res) => {
  const sessionId = uuidv4();
  lockerUpsert(sessionId, { phone: (req.body?.phone || "").toString(), language: "en" });
  res.json({ sessionId });
});

app.post("/api/language", (req, res) => {
  const sessionId = getSessionId(req);
  if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });
  const language = (req.body?.language || "en").toString();
  const locker = lockerUpsert(sessionId, { language });
  res.json({ ok: true, locker });
});

app.post("/api/ocr/upload", upload.single("file"), async (req, res) => {
  console.log("[UPLOAD] Received file upload request");
  const sessionId = getSessionId(req);
  if (!sessionId) {
    console.error("[UPLOAD] Error: Missing sessionId");
    return res.status(400).json({ error: "Missing sessionId" });
  }
  if (!req.file?.path) {
    console.error("[UPLOAD] Error: Missing file");
    return res.status(400).json({ error: "Missing file" });
  }

  console.log(`[UPLOAD] Processing for session: ${sessionId}, file: ${req.file.path}`);

  const reuse = String(req.body?.reuse || "false") === "true";
  const preferredLang = (req.body?.ocrLang || "eng").toString();

  const filePath = req.file.path;

  let ocr;
  try {
    try {
      console.log(`[OCR] Request initiated for session ${sessionId}`);
      ocr = await runOcr(filePath, preferredLang);
    } catch (e) {
      console.warn(`[OCR] Primary failed, retrying with eng. Error: ${e.message}`);
      ocr = await runOcr(filePath, "eng");
    }

    const docTypeDetected = classifyDocument(ocr.text);
    const issueDate = extractIssueDate(ocr.text);
    const profileFields = extractProfileFields(ocr.text);

    const extracted = {
      name: profileFields.name.value,
      dob: profileFields.dob.value,
      income: profileFields.income.value,
      marks: profileFields.marks.value,
      accountNumber: profileFields.accountNumber.value,
      ifsc: profileFields.ifsc.value,
    };

    const confidence = {
      name: profileFields.name.confidence,
      dob: profileFields.dob.confidence,
      income: profileFields.income.confidence,
      marks: profileFields.marks.confidence,
      accountNumber: profileFields.accountNumber.confidence,
      ifsc: profileFields.ifsc.confidence,
    };

    // expiry detection: default 365 days for certificates (income)
    let expiry = { status: "unknown" };
    if (issueDate) {
      const parts = issueDate.split(/\//g);
      const [dd, mm, yyyy] = parts.map((p) => Number(p));
      const issued = new Date(yyyy, (mm || 1) - 1, dd || 1);
      const ageDays = Math.floor((Date.now() - issued.getTime()) / (1000 * 60 * 60 * 24));
      const expired = ageDays > 365;
      expiry = { issueDate, expired, ageDays };
    }

    const locker = lockerUpsert(sessionId, {
      profile: {
        ...(readJson(LOCKER_PATH, { users: {} }).users?.[sessionId]?.profile || {}),
        ...extracted,
      },
      verification: confidence,
      documents: {
        ...(readJson(LOCKER_PATH, { users: {} }).users?.[sessionId]?.documents || {}),
        [docTypeDetected]: true,
      },
      reuse,
    });

    // 1) Eligibility Detected SMS
    // Trigger: OCR complete + profile generated + at least one eligible scheme.
    try {
      const phone = (locker.phone || "").toString();
      const alreadySent = locker?.smsFlags?.eligibilitySent === true;
      if (phone && !alreadySent) {
        const profileForEligibility = {
          ...(locker.profile || {}),
          documents: locker.documents || {},
          state: "Karnataka",
        };

        const results = computeEligibility(profileForEligibility);
        const eligibleSchemes = results
          .filter((r) => r.status === "eligible" || r.status === "needs_documents")
          .map((r) => r.scheme?.name)
          .filter(Boolean);

        if (eligibleSchemes.length > 0) {
          await sendEligibilitySMS({
            to: phone,
            scholarshipNames: eligibleSchemes.slice(0, 2),
          });

          lockerUpsert(sessionId, { smsFlags: { ...(locker.smsFlags || {}), eligibilitySent: true } });
        }
      }
    } catch {
      // ignore SMS failures
    }

    res.json({
      message: "Successfully extracted fields",
      extracted,
      docTypeDetected,
      confidence,
      profile: {
        ...(locker.profile || {}),
        documents: locker.documents || {},
      },
    });
  } catch (e) {
    res.status(500).json({ error: "OCR failed", details: String(e?.message || e) });
  } finally {
    if (!reuse) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        // ignore
      }
    }
  }
});

app.get("/api/locker", (req, res) => {
  const sessionId = getSessionId(req);
  if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });
  const db = readJson(LOCKER_PATH, { users: {} });
  res.json({ locker: db.users[sessionId] || null });
});

app.get("/api/profile", (req, res) => {
  const sessionId = getSessionId(req);
  const locker = lockerRead(sessionId);
  res.json({
    ...(locker.profile || {}),
    documents: locker.documents || {},
  });
});

app.post("/api/locker/upsert", (req, res) => {
  const sessionId = getSessionId(req);
  if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });
  const patch = req.body?.patch || {};
  const locker = lockerUpsert(sessionId, patch);
  res.json({ locker });
});

app.get("/api/schemes", (req, res) => {
  res.json({ schemes: listSchemes() });
});

app.post("/api/eligibility", (req, res) => {
  const sessionId = getSessionId(req);
  if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

  const db = readJson(LOCKER_PATH, { users: {} });
  const locker = db.users[sessionId] || {};
  const profile = {
    ...(locker.profile || {}),
    documents: locker.documents || {},
    state: "Karnataka",
  };

  const results = computeEligibility(profile);
  res.json({ profile, results });
});

// 2) Missing Document Alert SMS
// Trigger: when user selects a scheme to apply and required docs are missing.
app.post("/api/sms/missing-documents", async (req, res) => {
  const sessionId = getSessionId(req);
  if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

  const schemeId = (req.body?.schemeId || "").toString();
  if (!schemeId) return res.status(400).json({ error: "Missing schemeId" });

  const db = readJson(LOCKER_PATH, { users: {} });
  const locker = db.users[sessionId] || {};
  const phone = (locker.phone || "").toString();
  if (!phone) return res.json({ ok: false, reason: "No phone on file" });

  const scheme = listSchemes().find((s) => s.id === schemeId);
  if (!scheme) return res.status(404).json({ error: "Scheme not found" });

  const docs = locker.documents || {};
  const missing = (scheme.required_documents || []).filter((d) => !docs[d]);

  if (missing.length === 0) return res.json({ ok: true, sent: false, reason: "No missing documents" });

  try {
    const result = await sendMissingDocumentSMS({ to: phone, documents: missing });
    res.json({ ok: true, result });
  } catch (e) {
    res.json({ ok: false, error: String(e?.message || e) });
  }
});

app.post("/api/sms/ocr-alert", async (req, res) => {
  const sessionId = getSessionId(req);
  if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });
  const locker = lockerRead(sessionId);
  const phone = (locker.phone || "").toString();
  if (!phone) return res.status(400).json({ error: "No phone number" });

  try {
    const { sendMissingDocumentSMS } = require("./smsService");
    const result = await sendMissingDocumentSMS({ to: phone, documents: ["Unclear Document"] });
    res.json({ ok: true, result });
  } catch (e) {
    res.json({ ok: false, error: String(e?.message || e) });
  }
});

app.post("/api/sms/missing-core", async (req, res) => {
  const sessionId = getSessionId(req);
  console.log(`[SMS] Request for missing-core. Session: ${sessionId}`);
  if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });
  
  const locker = lockerRead(sessionId);
  const phone = (locker.phone || "").toString();
  console.log(`[SMS] Target phone: ${phone}`);
  if (!phone) return res.status(400).json({ error: "No phone number found in session" });
  
  const missing = req.body?.missing || [];
  if (!missing.length) return res.json({ ok: true, sent: false });

  try {
    const { sendMissingDocumentSMS } = require("./smsService");
    const result = await sendMissingDocumentSMS({ to: phone, documents: missing });
    console.log(`[SMS] Result:`, result);
    res.json({ ok: true, result });
  } catch (e) {
    console.error(`[SMS] Error:`, e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.post("/api/chat", async (req, res) => {
  if (!genAI) return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
  const text = (req.body?.text || "").toString().trim();
  if (!text) return res.status(400).json({ error: "Missing text" });

  try {
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-flash" });
    const prompt = `You are Sahayak AI, a helpful scholarship assistant. Reply concisely and clearly.\n\nUser: ${text}`;
    const result = await model.generateContent(prompt);
    const reply = result?.response?.text?.() || "";
    res.json({ reply });
  } catch (e) {
    res.status(500).json({ error: e?.message || "Chat failed" });
  }
});

app.post("/api/simplify", (req, res) => {
  const text = (req.body?.text || "").toString();
  res.json({ simplified: simplifyInstruction(text) });
});

app.post("/api/submit", async (req, res) => {
  const sessionId = getSessionId(req);
  if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

  const schemeId = (req.body?.schemeId || "").toString();
  const trackingId = `TRK-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;

  const entry = {
    schemeId,
    trackingId,
    status: "submitted",
    submittedAt: new Date().toISOString(),
  };

  historyAppend(sessionId, entry);

  // 3) Application Submitted Confirmation SMS
  try {
    const scheme = listSchemes().find((s) => s.id === schemeId);
    await sendSubmissionSMS({
      to: (req.body?.phone || "").toString(),
      scholarshipName: scheme?.name || schemeId,
      trackingId,
    });
  } catch {
    // ignore
  }

  res.json({ ok: true, trackingId });
});

// 4) Application Status Update SMS (demo endpoint)
app.post("/api/status/update", async (req, res) => {
  const sessionId = getSessionId(req);
  if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });
  const trackingId = (req.body?.trackingId || "").toString();
  const applicationStatus = (req.body?.status || "").toString();
  if (!trackingId || !applicationStatus) return res.status(400).json({ error: "Missing trackingId or status" });

  const db = readJson(HISTORY_PATH, { users: {} });
  const entries = db.users[sessionId] || [];
  const found = entries.find((e) => e.trackingId === trackingId);
  if (!found) return res.status(404).json({ error: "Tracking ID not found" });

  found.status = applicationStatus;
  writeJson(HISTORY_PATH, db);

  const lockerDb = readJson(LOCKER_PATH, { users: {} });
  const locker = lockerDb.users[sessionId] || {};
  const phone = (locker.phone || "").toString();
  const scheme = listSchemes().find((s) => s.id === found.schemeId);

  try {
    const result = await sendStatusUpdateSMS({
      to: phone,
      scholarshipName: scheme?.name || found.schemeId,
      applicationStatus,
      trackingId,
    });
    res.json({ ok: true, updated: true, sms: result });
  } catch (e) {
    res.json({ ok: true, updated: true, sms: { sent: false, error: String(e?.message || e) } });
  }
});

app.get("/api/history", (req, res) => {
  const sessionId = getSessionId(req);
  if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });
  const db = readJson(HISTORY_PATH, { users: {} });
  res.json({ history: db.users[sessionId] || [] });
});

app.post("/api/assistant", async (req, res) => {
  const { prompt, sessionId } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  // Build rich context from user's locker data
  const lockerDb = readJson(LOCKER_PATH, { users: {} });
  const locker = lockerDb.users[sessionId] || {};
  const profile = locker.profile || {};
  const docs = locker.documents || {};
  const verification = locker.verification || {};

  const systemPrompt = `You are SAHAYAK AI, a highly advanced scholarship assistant for students in Karnataka, India.
Here is the student's verified profile from their uploaded documents:
- Name: ${profile.name || "Not provided"}
- Date of Birth: ${profile.dob || "Not provided"}
- Marks/Percentage: ${profile.marks || "Not provided"}
- Annual Family Income: ₹${profile.income || "Not provided"}
- Bank Account: ${profile.accountNumber || "Not provided"}
- IFSC: ${profile.ifsc || "Not provided"}
- Documents Uploaded: ${Object.keys(docs).filter(k => docs[k]).join(", ") || "None"}
- OCR Confidence: ${JSON.stringify(verification)}

Use this real data to answer questions about their eligibility. Be concise, empathetic, and professional. If they ask about percentage, calculate it from their marks. If they ask about eligibility, cross-reference their income and marks with Karnataka scholarship criteria.`;

  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey || !genAI) {
    return res.status(500).json({ error: "Google Gemini API key not configured. Please set GEMINI_API_KEY in .env" });
  }

  try {
    // Using gemini-3.1-pro-preview for maximum context window and reasoning (2026 standard)
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: prompt }
    ]);
    
    const response = await result.response;
    res.json({ reply: response.text() });
  } catch (e) {
    console.error("Gemini API Error:", e.message);
    res.status(500).json({ error: "Gemini AI encountered an error: " + e.message });
  }
});

const http = require("http");
http.createServer(app).listen(PORT, () => {
  console.log(`SAHAYAK AI backend listening on http://localhost:${PORT}`);
});
