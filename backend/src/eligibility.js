const path = require("path");
const { readJson } = require("./storage");

const SCHEMES_PATH = path.resolve(__dirname, "..", "..", "data", "karnataka_scholarships.json");

function listSchemes() {
  const data = readJson(SCHEMES_PATH, { state: "Karnataka", schemes: [] });
  return data.schemes || [];
}

function computeEligibility(profile) {
  const schemes = listSchemes();
  const income = Number(profile?.income || 0);
  const marks = Number(profile?.marks || 0);
  const state = (profile?.state || "Karnataka").toString();

  return schemes.map((scheme) => {
    const reasons = [];
    if (scheme.state && scheme.state !== state) reasons.push("State mismatch");
    if (scheme.income_limit != null && income > scheme.income_limit) reasons.push("Income above limit");
    if (scheme.min_marks != null && marks < scheme.min_marks) reasons.push("Marks below requirement");

    const eligible = reasons.length === 0;

    const missingDocs = [];
    const lockerDocs = profile?.documents || {};
    for (const req of scheme.required_documents || []) {
      if (!lockerDocs[req]) missingDocs.push(req);
    }

    const status = eligible ? (missingDocs.length ? "needs_documents" : "eligible") : "not_eligible";

    return {
      scheme,
      status,
      reasons,
      missingDocs,
    };
  });
}

module.exports = {
  listSchemes,
  computeEligibility,
};
