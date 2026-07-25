const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { renderPdfPagesWithPython } = require("./cv_python_parser");

function ocrEnabledFlag() {
  return process.env.CV_OCR_ENABLED !== "false";
}

function ocrLangs() {
  return process.env.CV_OCR_LANGS || "eng+ind";
}

function ocrMinChars() {
  return Number(process.env.CV_OCR_MIN_CHARS || 80);
}

function ocrMaxPages() {
  return Number(process.env.CV_OCR_MAX_PAGES || 3);
}

function ocrScale() {
  return Number(process.env.CV_OCR_RENDER_SCALE || 2);
}

function ocrDpi() {
  // Prefer CV_PDF_RENDER_DPI (GPT image path) over legacy CV_OCR_RENDER_DPI.
  const explicit = Number(
    process.env.CV_PDF_RENDER_DPI || process.env.CV_OCR_RENDER_DPI || 0
  );
  if (explicit > 0) return explicit;
  // ~144 DPI is a good balance for tesseract on this CV; higher DPI can worsen dates.
  return Math.max(120, Math.round(72 * (ocrScale() || 2)));
}

function resolveTesseractLangPath() {
  const configured = process.env.CV_OCR_LANG_PATH;
  if (configured && fs.existsSync(configured)) return configured;
  const cwd = process.cwd();
  const hasEng = fs.existsSync(path.join(cwd, "eng.traineddata"));
  const hasInd = fs.existsSync(path.join(cwd, "ind.traineddata"));
  if (hasEng || hasInd) return cwd;
  return undefined;
}

/** Common OCR misreads on CV fonts — keep conservative. */
function cleanupOcrText(text) {
  return String(text || "")
    .replace(/\bCodelgniter\b/gi, "CodeIgniter")
    .replace(/\bSTTI\s+NIT\s+I-?Tech\b/gi, "STTI NIIT I-Tech")
    .replace(/\bSTTI\s+NIT\b/gi, "STTI NIIT")
    .replace(/\befficent\b/gi, "efficient")
    .replace(/\bAPs\b/g, "APIs")
    .replace(/\bdociors\b/gi, "doctors")
    .replace(/\bconsuliations\b/gi, "consultations")
    .replace(/\bMaintzined\b/gi, "Maintained")
    .replace(/\beamprehensive\b/gi, "comprehensive")
    .replace(/\bfront ond\b/gi, "front-end")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function visionUrl() {
  return process.env.CV_OCR_VISION_URL || "";
}

function visionKey() {
  return process.env.CV_OCR_VISION_KEY || "";
}

function visionModel() {
  return process.env.CV_OCR_VISION_MODEL || "gpt-4o-mini";
}

function isOcrEnabled() {
  return ocrEnabledFlag();
}

function isVisionOcrEnabled() {
  return Boolean(visionUrl() && visionKey());
}

function isThinExtractedText(text) {
  const t = String(text || "").replace(/\u00a0/g, " ").trim();
  if (!t) return true;
  const minChars = ocrMinChars();
  const alphaNum = (t.match(/[A-Za-z0-9À-ÿ]/g) || []).length;
  return t.length < minChars || alphaNum < Math.floor(minChars * 0.45);
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
 * Render PDF pages via CV parser sidecar or local Python (safe on Windows).
 * @returns {Promise<Buffer[]>}
 */
async function renderPdfPagesToPngViaPython(filePath, maxPages = ocrMaxPages()) {
  return renderPdfPagesWithPython(filePath, { maxPages, dpi: ocrDpi() });
}

/**
 * In-process pdf.js + @napi-rs/canvas render.
 * Avoid calling this from the API process on Windows — native crashes take down the server.
 * Kept for optional child-process / non-Windows use.
 * @returns {Promise<Buffer[]>}
 */
async function renderPdfPagesToPngWithCanvas(filePath, maxPages = ocrMaxPages()) {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjsLib.getDocument({ data, disableWorker: true }).promise;
  const pageCount = Math.min(doc.numPages, Math.max(1, maxPages));
  const images = [];

  for (let pageNo = 1; pageNo <= pageCount; pageNo++) {
    const page = await doc.getPage(pageNo);
    const viewport = page.getViewport({ scale: ocrScale() });
    const canvas = await createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");
    await page.render({ canvasContext: context, viewport, canvas }).promise;
    images.push(canvas.toBuffer("image/png"));
  }

  return images;
}

/**
 * Prefer Python render; never fall back to in-process canvas (segfault risk).
 * @returns {Promise<Buffer[]>}
 */
async function renderPdfPagesToPng(filePath, maxPages = ocrMaxPages()) {
  return module.exports.renderPdfPagesToPngViaPython(filePath, maxPages);
}

async function ocrImageWithTesseract(imageBuffer, worker) {
  const result = await worker.recognize(imageBuffer);
  return String(result?.data?.text || "").trim();
}

/**
 * Local OCR via Tesseract.js (eng+ind by default).
 * Uses repo-root *.traineddata when present (CV_OCR_LANG_PATH / cwd).
 */
async function ocrPdfWithTesseract(filePath) {
  const { createWorker } = require("tesseract.js");
  const images = await module.exports.renderPdfPagesToPng(filePath);
  if (!images.length) return "";

  const langPath = resolveTesseractLangPath();
  const workerOpts = langPath
    ? { langPath, cachePath: langPath, gzip: false }
    : undefined;
  const worker = await createWorker(ocrLangs(), 1, workerOpts);
  try {
    const parts = [];
    for (const image of images) {
      const text = await ocrImageWithTesseract(image, worker);
      if (text) parts.push(text);
    }
    return cleanupOcrText(parts.join("\n\n"));
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
  const url = visionUrl();
  const key = visionKey();
  const isGeminiNative =
    url.includes("generativelanguage.googleapis.com") &&
    !url.includes("/openai/");

  const headers = { "Content-Type": "application/json" };
  let body;

  if (isGeminiNative) {
    headers["x-goog-api-key"] = key;
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
    headers.Authorization = `Bearer ${key}`;
    body = {
      model: visionModel(),
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

  const response = await axios.post(url, body, {
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
    let text = "";
    try {
      text = await ocrImageWithVision(image);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 429) {
        await new Promise((r) => setTimeout(r, 1500));
        text = await ocrImageWithVision(image);
      } else {
        throw err;
      }
    }
    if (text) parts.push(text);
  }
  return cleanupOcrText(parts.join("\n\n"));
}

/**
 * Hybrid extraction for scanned/image PDFs:
 * digital text → Vision (preferred) → Tesseract.
 *
 * Vision is tried first when configured because local canvas rendering used to
 * segfault the API process on Windows image-only PDFs.
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

  let visionCandidate = "";
  if (module.exports.isVisionOcrEnabled()) {
    try {
      const visionText = await module.exports.ocrPdfWithVision(filePath);
      if (visionText && !module.exports.isThinExtractedText(visionText)) {
        return { text: visionText, method: "vision" };
      }
      if (visionText) visionCandidate = visionText;
    } catch (err) {
      console.warn("Vision OCR failed:", err.message);
    }
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

  if (visionCandidate) {
    if (!tesseractText || visionCandidate.length >= tesseractText.length) {
      return { text: visionCandidate, method: "vision" };
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
  renderPdfPagesToPngViaPython,
  renderPdfPagesToPngWithCanvas,
  ocrPdfWithTesseract,
  ocrPdfWithVision,
  extractPdfTextHybrid,
};
