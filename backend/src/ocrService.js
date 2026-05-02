const { createWorker } = require("tesseract.js");

async function runOcr(filePath, lang) {
  const worker = await createWorker(lang || "eng");
  try {
    const { data } = await worker.recognize(filePath);
    return {
      text: data.text || "",
      confidence: typeof data.confidence === "number" ? data.confidence : 0,
    };
  } finally {
    await worker.terminate();
  }
}

module.exports = { runOcr };
