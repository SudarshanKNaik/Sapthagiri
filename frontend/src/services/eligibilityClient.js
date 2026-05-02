// Client-side eligibility (offline) using the same deterministic rules as the backend.

export function computeEligibilityClient({ profile, schemes }) {
  const income = Number(profile?.income || 0);
  const marks = Number(profile?.marks || 0);
  const state = String(profile?.state || "Karnataka");
  const documents = profile?.documents || {};

  return (schemes || []).map((scheme) => {
    const reasons = [];
    if (scheme.state && scheme.state !== state) reasons.push("State mismatch");
    if (scheme.income_limit != null && income > scheme.income_limit) reasons.push("Income above limit");
    if (scheme.min_marks != null && marks < scheme.min_marks) reasons.push("Marks below requirement");

    const eligible = reasons.length === 0;

    const missingDocs = [];
    for (const req of scheme.required_documents || []) {
      if (!documents[req]) missingDocs.push(req);
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
