const path = require("path");
const { readJson, writeJson } = require("./storage");
const { sendSmsIfConfigured } = require("./twilioSms");

const TEMPLATES_PATH = path.resolve(__dirname, "..", "data", "sms_templates.json");

function loadTemplates() {
  return readJson(TEMPLATES_PATH, {});
}

function applyVars(template, vars) {
  let out = template;
  for (const [k, v] of Object.entries(vars || {})) {
    const safe = v == null ? "" : String(v);
    out = out.replaceAll(`{${k}}`, safe);
  }
  return out;
}

function docLabel(docKey) {
  const map = {
    aadhaar: "Aadhaar",
    income_certificate: "Income Certificate",
    marks_card: "Marks Card",
    bank_passbook: "Bank Passbook",
  };
  return map[docKey] || docKey;
}

async function sendEligibilitySMS({ to, scholarshipNames }) {
  const templates = loadTemplates();
  const list = (scholarshipNames || []).filter(Boolean);
  if (!to || list.length === 0) return { sent: false, reason: "Missing to or scholarships" };

  const message =
    list.length === 1
      ? applyVars(templates.eligibility_single, { SCHOLARSHIP_NAME: list[0] })
      : applyVars(templates.eligibility_multi, { SCHOLARSHIP_LIST: list.join("\n") });

  return sendSmsIfConfigured({ to, message });
}

async function sendMissingDocumentSMS({ to, documents }) {
  const templates = loadTemplates();
  const list = (documents || []).filter(Boolean).map(docLabel);
  if (!to || list.length === 0) return { sent: false, reason: "Missing to or documents" };

  const message =
    list.length === 1
      ? applyVars(templates.missing_document_single, { DOCUMENT_NAME: list[0] })
      : applyVars(templates.missing_document_multi, { DOCUMENT_LIST: list.join(", ") });

  return sendSmsIfConfigured({ to, message });
}

async function sendSubmissionSMS({ to, scholarshipName, trackingId }) {
  const templates = loadTemplates();
  if (!to || !trackingId) return { sent: false, reason: "Missing to or trackingId" };

  const message = applyVars(templates.submission, {
    SCHOLARSHIP_NAME: scholarshipName || "Scholarship",
    TRACKING_ID: trackingId,
  });

  return sendSmsIfConfigured({ to, message });
}

async function sendStatusUpdateSMS({ to, scholarshipName, applicationStatus, trackingId }) {
  const templates = loadTemplates();
  if (!to || !trackingId || !applicationStatus) return { sent: false, reason: "Missing data" };

  const message = applyVars(templates.status_update, {
    SCHOLARSHIP_NAME: scholarshipName || "Scholarship",
    APPLICATION_STATUS: applicationStatus,
    TRACKING_ID: trackingId,
  });

  return sendSmsIfConfigured({ to, message });
}

module.exports = {
  sendEligibilitySMS,
  sendMissingDocumentSMS,
  sendSubmissionSMS,
  sendStatusUpdateSMS,
  docLabel,
};
