function normalizeSpaces(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function firstMatch(text, patterns) {
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) return normalizeSpaces(m[1]);
  }
  return "";
}

function parseCurrencyToNumber(value) {
  if (!value) return null;
  const digits = value.replace(/[^0-9]/g, "");
  if (!digits) return null;
  return Number(digits);
}

function parseMarksToNumber(value) {
  if (!value) return null;
  const m = value.match(/(\d{1,3}(?:\.\d{1,2})?)/);
  if (!m) return null;
  const num = Number(m[1]);
  if (Number.isNaN(num)) return null;
  return num;
}

function computeFieldConfidence(rawText, value) {
  if (!value) return 0;
  const t = (rawText || "").toLowerCase();
  const v = value.toLowerCase();
  if (t.includes(v)) return 92;
  return 75;
}

function extractProfileFields(ocrText) {
  const text = normalizeSpaces(ocrText);

  const name = firstMatch(text, [
    /Name\s*[:\-]\s*([A-Za-z .]{3,})/i,
    /Applicant\s*Name\s*[:\-]\s*([A-Za-z .]{3,})/i,
  ]);

  const dob = firstMatch(text, [
    /DOB\s*[:\-]\s*([0-9]{2}[\/-][0-9]{2}[\/-][0-9]{4})/i,
    /Date\s*of\s*Birth\s*[:\-]\s*([0-9]{2}[\/-][0-9]{2}[\/-][0-9]{4})/i,
  ]);

  const incomeRaw = firstMatch(text, [
    /Income\s*[:\-]\s*(INR\s*)?([0-9,]{4,})/i,
    /Annual\s*Income\s*[:\-]\s*(INR\s*)?([0-9,]{4,})/i,
  ]);
  const income = parseCurrencyToNumber(incomeRaw);

  const marksRaw = firstMatch(text, [
    /Percentage\s*[:\-]\s*([0-9]{1,3}(?:\.[0-9]{1,2})?)\s*%?/i,
    /Marks\s*[:\-]\s*([0-9]{1,3}(?:\.[0-9]{1,2})?)\s*%?/i,
    /CGPA\s*[:\-]\s*([0-9]{1,2}(?:\.[0-9]{1,2})?)/i,
  ]);
  const marks = parseMarksToNumber(marksRaw);

  const accountNumber = firstMatch(text, [
    /Account\s*(No|Number)\s*[:\-]\s*([0-9]{9,18})/i,
  ]);

  const ifsc = firstMatch(text, [
    /IFSC\s*[:\-]\s*([A-Z]{4}0[A-Z0-9]{6})/i,
  ]);

  const fields = {
    name: { value: name, confidence: computeFieldConfidence(text, name) },
    dob: { value: dob, confidence: computeFieldConfidence(text, dob) },
    income: { value: income ?? "", confidence: income ? 85 : 0 },
    marks: { value: marks ?? "", confidence: marks ? 85 : 0 },
    accountNumber: { value: accountNumber, confidence: computeFieldConfidence(text, accountNumber) },
    ifsc: { value: ifsc, confidence: computeFieldConfidence(text, ifsc) },
  };

  return fields;
}

function extractIssueDate(ocrText) {
  const text = normalizeSpaces(ocrText);
  const date = firstMatch(text, [
    /Issue\s*Date\s*[:\-]\s*([0-9]{2}[\/-][0-9]{2}[\/-][0-9]{4})/i,
    /Issued\s*On\s*[:\-]\s*([0-9]{2}[\/-][0-9]{2}[\/-][0-9]{4})/i,
  ]);
  return date;
}

module.exports = {
  extractProfileFields,
  extractIssueDate,
};
