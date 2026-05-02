function simplifyInstruction(text) {
  const t = (text || "").toLowerCase();

  const rules = [
    { match: /income certificate/, out: "Upload your income certificate here" },
    { match: /marks card|markscard|grade card/, out: "Upload your marks card here" },
    { match: /aadhaar|aadhar/, out: "Upload your Aadhaar card here" },
    { match: /bank passbook|ifsc|account number/, out: "Upload your bank passbook details here" },
    { match: /issued by competent authority/, out: "Upload the correct document (issued by the office)" },
  ];

  for (const r of rules) {
    if (r.match.test(t)) return r.out;
  }

  // default: shorten and make imperative
  const trimmed = (text || "").trim();
  if (!trimmed) return "";
  if (trimmed.length <= 80) return trimmed;
  return trimmed.slice(0, 77) + "...";
}

module.exports = { simplifyInstruction };
