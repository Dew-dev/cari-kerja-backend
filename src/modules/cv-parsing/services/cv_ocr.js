const fs = require("fs");
const path = require("path");
const axios = require("axios");

const OCR_ENABLED = process.env.CV_OCR_ENABLED !== "false";
const OCR_LANGS = process.env.CV_OCR_LANGS || "eng+ind";
const OCR_MIN_CHARS = Number(process.env.CV_OCR_MIN_CHARS || 80);
const OCR_MAX_PAGES = Number(process.env.CV_OCR_MAX_PAGES || 3);
const OCR_SCALE = Number(process.env.CV_OCR_RENDER_SCALE || 2);

const VISION_URL = process.env.CV_OCR_VISION_URL || "";
const VISION_KEY = process.env.CV_OCR_VISION_KEY || "";
const VISION_MODEL = process.env.CV_OCR_VISION_MODEL || "gpt-4o-mini";

function isOcrEnabled() {
  return OCR_ENABLED;
}

function isVisionOcrEnabled() {
  return Boolean(VISION_URL && VISION_KEY);
}

function isThinExtractedText(text) {
  const t = String(text || "").replace(/\u00a0/g, " ").trim();
  if (!t) return true;
  const alphaNum = (t.match(/[A-Za-z0-9À-ÿ]/g) || []).length;
  return t.length < OCR_MIN_CHARS || alphaNum < Math.floor(OCR_MIN_CHARS * 0.45);
}

async function createCanvas(width, height) {
  try {
    const { createCanvas } = require("@napi-rs/canvas");
    return createCanvas(Math.ceil(width), Math.ceil(height));
  } catch {
    const nested = path.join(
      process.cwd(),
      "node_modules",
      "pdfjs-dist",
      "node_modules",
      "@napi-rs",
      "canvas"
    );
    const { createCanvas } = require(nested);
    return createCanvas(Math.ceil(width), Math.ceil(height));
  }
}

/**
 * Render PDF pages to PNG buffers for OCR.
 * @returns {Promise<Buffer[]>}
 */
async function renderPdfPagesToPng(filePath, maxPages = OCR_MAX_PAGES) {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjsLib.getDocument({ data, disableWorker: true }).promise;
  const pageCount = Math.min(doc.numPages, Math.max(1, maxPages));
  const images = [];

  for (let pageNo = 1; pageNo <= pageCount; pageNo++) {
    const page = await doc.getPage(pageNo);
    const viewport = page.getViewport({ scale: OCR_SCALE });
    const canvas = await createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");
    await page.render({ canvasContext: context, viewport, canvas }).promise;
    images.push(canvas.toBuffer("image/png"));
  }

  return images;
}

async function ocrImageWithTesseract(imageBuffer, worker) {
  const result = await worker.recognize(imageBuffer);
  return String(result?.data?.text || "").trim();
}

/**
 * Local OCR via Tesseract.js (eng+ind by default).
 */
async function ocrPdfWithTesseract(filePath) {
  const { createWorker } = require("tesseract.js");
  const images = await module.exports.renderPdfPagesToPng(filePath);
  if (!images.length) return "";

  const worker = await createWorker(OCR_LANGS);
  try {
    const parts = [];
    for (const image of images) {
      const text = await ocrImageWithTesseract(image, worker);
      if (text) parts.push(text);
    }
    return parts.join("\n\n").trim();
  } finally {
    await worker.terminate().catch(() => {});
  }
}

function buildVisionPrompt() {
  return [
    "Extract all readable text from this CV / resume page image.",
    "Preserve line breaks for sections, job titles, dates, and bullet points.",
    "Return plain text only. Do not invent missing content.",
  ].join(" ");
}

function extractVisionContent(data) {
  const messageContent = data?.choices?.[0]?.message?.content;
  if (typeof messageContent === "string" && messageContent.trim()) return messageContent.trim();
  if (Array.isArray(messageContent)) {
    const joined = messageContent
      .map((item) => (typeof item === "string" ? item : item?.text || ""))
      .join("\n")
      .trim();
    if (joined) return joined;
  }

  const geminiParts = data?.candidates?.[0]?.content?.parts;
  if (Array.isArray(geminiParts)) {
    const joined = geminiParts
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("\n")
      .trim();
    if (joined) return joined;
  }

  return "";
}

async function ocrImageWithVision(imageBuffer) {
  const b64 = imageBuffer.toString("base64");
  const isGeminiNative =
    VISION_URL.includes("generativelanguage.googleapis.com") &&
    !VISION_URL.includes("/openai/");

  const headers = { "Content-Type": "application/json" };
  let body;

  if (isGeminiNative) {
    headers["x-goog-api-key"] = VISION_KEY;
    body = {
      contents: [
        {
          role: "user",
          parts: [
            { text: buildVisionPrompt() },
            { inline_data: { mime_type: "image/png", data: b64 } },
          ],
        },
      ],
      generationConfig: { temperature: 0 },
    };
  } else {
    headers.Authorization = `Bearer ${VISION_KEY}`;
    body = {
      model: VISION_MODEL,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: buildVisionPrompt() },
            {
              type: "image_url",
              image_url: { url: `data:image/png;base64,${b64}` },
            },
          ],
        },
      ],
    };
  }

  const response = await axios.post(VISION_URL, body, {
    headers,
    timeout: 60000,
  });

  return extractVisionContent(response.data);
}

/**
 * Cloud Vision OCR fallback (OpenAI-compatible or Gemini native).
 * Requires CV_OCR_VISION_URL + CV_OCR_VISION_KEY.
 */
async function ocrPdfWithVision(filePath) {
  if (!module.exports.isVisionOcrEnabled()) return "";
  const images = await module.exports.renderPdfPagesToPng(filePath);
  const parts = [];
  for (const image of images) {
    const text = await ocrImageWithVision(image);
    if (text) parts.push(text);
  }
  return parts.join("\n\n").trim();
}

/**
 * Hybrid extraction for scanned/image PDFs:
 * digital text → Tesseract → optional Vision API.
 *
 * @returns {Promise<{ text: string, method: 'digital'|'tesseract'|'vision' }>}
 */
async function extractPdfTextHybrid(filePath, digitalText) {
  const digital = String(digitalText || "").replace(/\u00a0/g, " ").trim();
  if (!module.exports.isThinExtractedText(digital)) {
    return { text: digital, method: "digital" };
  }

  if (!module.exports.isOcrEnabled()) {
    return { text: digital, method: "digital" };
  }

  let tesseractText = "";
  try {
    tesseractText = await module.exports.ocrPdfWithTesseract(filePath);
    if (!module.exports.isThinExtractedText(tesseractText)) {
      return { text: tesseractText, method: "tesseract" };
    }
  } catch (err) {
    console.warn("Tesseract OCR failed:", err.message);
  }

  if (module.exports.isVisionOcrEnabled()) {
    try {
      const visionText = await module.exports.ocrPdfWithVision(filePath);
      if (visionText && !module.exports.isThinExtractedText(visionText)) {
        return { text: visionText, method: "vision" };
      }
      if (visionText && visionText.length > tesseractText.length) {
        return { text: visionText, method: "vision" };
      }
    } catch (err) {
      console.warn("Vision OCR failed:", err.message);
    }
  }

  if (tesseractText) {
    return { text: tesseractText, method: "tesseract" };
  }

  return { text: digital, method: "digital" };
}

module.exports = {
  isOcrEnabled,
  isVisionOcrEnabled,
  isThinExtractedText,
  renderPdfPagesToPng,
  ocrPdfWithTesseract,
  ocrPdfWithVision,
  extractPdfTextHybrid,
};
