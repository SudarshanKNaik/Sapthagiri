const path = require("path");

let envLoaded = false;
function tryLoadDotEnv() {
  if (envLoaded) return;
  envLoaded = true;

  // Optional: load backend/.env for local development.
  // This is best-effort and will be skipped if dotenv isn't installed.
  try {
    // eslint-disable-next-line global-require
    require("dotenv").config({
      path: path.resolve(__dirname, "..", ".env"),
    });
  } catch {
    // ignore
  }
}

async function sendSmsIfConfigured({ to, message }) {
  tryLoadDotEnv();

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !from) {
    return { sent: false, reason: "Twilio env vars not configured" };
  }

  if (!to) {
    return { sent: false, reason: "Missing destination phone" };
  }

  // Normalize phone: if 10 digits, add +91
  let normalizedTo = to.replace(/\s+/g, "");
  if (normalizedTo.length === 10 && /^\d+$/.test(normalizedTo)) {
    normalizedTo = `+91${normalizedTo}`;
  } else if (normalizedTo.length === 12 && normalizedTo.startsWith("91")) {
    normalizedTo = `+${normalizedTo}`;
  }
  
  const targetTo = normalizedTo;

  // Lazy require so backend runs without Twilio installed
  let twilio;
  try {
    twilio = require("twilio");
  } catch {
    return { sent: false, reason: "Twilio package not installed" };
  }

  const client = twilio(accountSid, authToken);
  const result = await client.messages.create({ from, to: targetTo, body: message });
  return { sent: true, sid: result.sid };
}

module.exports = { sendSmsIfConfigured };
