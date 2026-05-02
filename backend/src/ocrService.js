const { createWorker } = require("tesseract.js");
const path = require("path");

async function runOcr(filePath, lang) {
  console.log(`[OCR] Starting for ${filePath} in ${lang}`);
  
  // Use the local traineddata to prevent downloads failing/hanging
  const worker = await createWorker(lang || "eng", 1, {
    langPath: path.resolve(__dirname, ".."),
    gzip: false,
  });

  try {
    console.log(`[OCR] Worker created, starting recognition...`);
    const { data } = await worker.recognize(filePath);
    console.log(`[OCR] Recognition complete. Confidence: ${data.confidence}`);
    return {
      text: data.text || "",
      confidence: typeof data.confidence === "number" ? data.confidence : 0,
    };
  } finally {
    await worker.terminate();
  }
}

module.exports = { runOcr };
