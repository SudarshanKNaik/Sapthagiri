const { sendEligibilitySMS, sendMissingDocumentSMS, sendSubmissionSMS, sendStatusUpdateSMS } = require("./src/smsService");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

async function runTest() {
  const to = process.argv[2];
  if (!to) {
    console.error("Please provide a destination phone number (e.g. +919876543210)");
    process.exit(1);
  }

  console.log(`Sending test SMS to ${to} using Twilio...`);

  try {
    const res1 = await sendEligibilitySMS({ to, scholarshipNames: ["Vidyasiri Scholarship", "Post Matric"] });
    console.log("1. Eligibility SMS:", res1);

    const res2 = await sendMissingDocumentSMS({ to, documents: ["income_certificate"] });
    console.log("2. Missing Document SMS:", res2);

    const res3 = await sendSubmissionSMS({ to, scholarshipName: "Vidyasiri Scholarship", trackingId: "TRK-TEST-1234" });
    console.log("3. Submission SMS:", res3);

    const res4 = await sendStatusUpdateSMS({ to, scholarshipName: "Vidyasiri Scholarship", applicationStatus: "Approved", trackingId: "TRK-TEST-1234" });
    console.log("4. Status Update SMS:", res4);

    console.log("\nAll test SMS messages triggered successfully!");
  } catch (error) {
    console.error("Error sending SMS:", error);
  }
}

runTest();
