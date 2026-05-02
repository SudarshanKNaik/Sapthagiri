function classifyDocument(ocrText) {
  const t = (ocrText || "").toLowerCase();
  
  // Define highly specific, real-world keywords for each document type
  const rules = {
    aadhaar: [
      "government of india", 
      "unique identification authority of india", 
      "your aadhaar no", 
      "aadhaar is a proof of identity", 
      "uidai", 
      "enrolment no",
      "aadhaar"
    ],
    income_certificate: [
      "government of karnataka", 
      "revenue department", 
      "income and caste certificate", 
      "gross annual income does not exceed", 
      "family annual income is rs", 
      "tahsildar", 
      "nadakacheri",
      "income certificate"
    ],
    marks_card: [
      "marks statement",
      "statement of marks",
      "marks card",
      "examination",
      "board",
      "university",
      "register number",
      "reg. no",
      "puc",
      "sslc",
      "karnataka school examination and assessment board",
      "pre - university examination",
      "max. marks",
      "marks obtained",
      "total marks",
      "candidate's name",
      "register no",
    ],
    bank_passbook: [
      "passbook",
      "account statement",
      "bank",
      "branch",
      "ifsc",
      "account no",
      "account number",
      "micr",
      "customer id",
      "debit",
      "credit",
      "balance",
    ],
  };

  let bestMatch = "unknown";
  let highestScore = 0;

  for (const [docType, keywords] of Object.entries(rules)) {
    let score = 0;
    for (const kw of keywords) {
      // Escape special characters to prevent regex errors
      const escapedKw = kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      // Use \b (word boundaries) to prevent partial substring matches like "remarks" -> "marks"
      const regex = new RegExp(`\\b${escapedKw}\\b`, "i");
      
      if (regex.test(t)) {
        score += 1;
      }
    }
    
    // The document type with the most keyword matches wins
    if (score > highestScore) {
      highestScore = score;
      bestMatch = docType;
    }
  }

  // Require at least 1 clear keyword match
  return highestScore > 0 ? bestMatch : "unknown";
}

module.exports = { classifyDocument };
