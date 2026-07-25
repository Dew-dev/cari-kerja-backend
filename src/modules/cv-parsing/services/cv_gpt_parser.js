/**
 * GPT-5 mini CV parsing path (Phase 2).
 *
 * This is a NEW, additive module. It owns the "digital text vs page images"
 * routing decision, builds the extraction prompt, calls the OpenAI Responses
 * adapter, validates + normalizes the output, and enforces a quality gate.
 *
 * It deliberately reuses existing building blocks instead of duplicating
 * business logic:
 *  - text scrub / mime resolve / docx text  → cv_parser (exported helpers)
 *  - normalizeParsedResult / isThinParsedResult → cv_parser
 *  - PDF page rendering                      → cv_ocr.renderPdfPagesToPng
 *  - digital PDF text                        → cv_python_parser.extractTextWithPython
 *
 * Security: never place raw CV text, base64 image data, or the API key into the
 * returned _meta. Only aggregate usage/cost + prompt identifiers are surfaced.
 */

"use strict";

const fs = require("fs");
const { PDFParse } = require("pdf-parse");

const { isThinExtractedText, renderPdfPagesToPng } = require("./cv_ocr");
const {
  extractTextWithPython,
  isPythonStrict,
} = require("./cv_python_parser");
const { buildCvExtractionPrompt } = require("../builders/cv_prompt_builder");
const { CV_JSON_SCHEMA } = require("../schemas/cv_parsed_data.schema");
const {
  isCvParserEnabled,
  createCvExtraction,
} = require("../providers/openai_responses_adapter");
const { validateCvOutput } = require("../validators/cv_output_validator");

// cv_parser is required for shared helpers. It is accessed via the module
// object at call time (not destructured at load) to stay safe against circular
// require timing: cv_parser lazy-requires this module only inside parseCV.
const cvParser = require("./cv_parser");

function makeError(code, message, extra) {
  const err = new Error(message);
  err.code = code;
  if (extra && typeof extra === "object") {
    for (const k of Object.keys(extra)) err[k] = extra[k];
  }
  return err;
}

/**
 * Decide whether digital text is too thin to trust for structured extraction.
 * Prefers the explicit CV_PARSER_MIN_TEXT_CHARS threshold when configured,
 * otherwise falls back to the shared cv_ocr heuristic.
 */
function isThinDigitalText(text) {
  const t = String(text || "").replace(/\u00a0/g, " ").trim();
  if (!t) return true;
  const min = Number(process.env.CV_PARSER_MIN_TEXT_CHARS || 0);
  if (min > 0) return t.length < min;
  return isThinExtractedText(t);
}

function renderMaxPages() {
  const n = Number(process.env.CV_PDF_RENDER_MAX_PAGES || 0);
  return n > 0 ? n : undefined;
}

/**
 * Digital-only text extraction (NO OCR chain). Mirrors the digital portion of
 * cv_parser.extractText but never invokes the OCR hybrid, and returns empty
 * string (instead of throwing) so image-only PDFs can fall through to render.
 *
 * @param {string} filePath
 * @param {string} resolvedMime
 * @returns {Promise<{ text: string, method: "digital" }>}
 */
async function extractDigitalCvText(filePath, resolvedMime) {
  if (resolvedMime === "application/pdf") {
    let digital = "";
    try {
      digital = cvParser.scrubExtractedText(await extractTextWithPython(filePath));
    } catch (err) {
      if (isPythonStrict()) throw err;
      // Fallback: Node pdf-parse for the digital layer.
      const buffer = fs.readFileSync(filePath);
      const parser = new PDFParse({ data: buffer });
      const data = await parser.getText();
      digital = cvParser.scrubExtractedText(data.text || "");
    }
    return { text: digital, method: "digital" };
  }

  if (cvParser.isDocxMimetype(resolvedMime)) {
    const text = cvParser.scrubExtractedText(await cvParser.extractDocxText(filePath));
    return { text, method: "digital" };
  }

  throw makeError("CV_UNSUPPORTED", "Unsupported file type. Only PDF and DOCX are allowed.");
}

/**
 * Parse a CV with GPT-5 mini via the OpenAI Responses adapter.
 *
 * Mode decision:
 *  - PDF with rich digital text → text mode.
 *  - PDF thin/empty            → render pages to PNG → image mode.
 *  - DOCX                      → text mode (mammoth digital text).
 *
 * @param {Object} params
 * @param {string} params.filePath
 * @param {string} params.mimetype
 * @param {string} [params.digitalText]  Pre-extracted digital text. If omitted
 *   (undefined), this function extracts it. An empty string is respected as-is
 *   (treated as "no digital layer") to avoid duplicate extraction work.
 * @param {string} [params.extractionMethod]
 * @returns {Promise<object>} normalized parsed result with _meta.cost.
 */
async function parseWithGpt5Mini({ filePath, mimetype, digitalText, extractionMethod } = {}) {
  if (!isCvParserEnabled()) {
    throw makeError(
      "CV_PARSER_DISABLED",
      "GPT-5 mini CV parser is disabled (missing OPENAI_API_KEY)"
    );
  }

  const resolvedMime = cvParser.resolveCvMimetype(filePath, mimetype);
  const isPdf = resolvedMime === "application/pdf";
  const isDocx = cvParser.isDocxMimetype(resolvedMime);

  const hasDigital = typeof digitalText === "string";
  let text = hasDigital ? digitalText : "";
  if (!hasDigital) {
    const extracted = await extractDigitalCvText(filePath, resolvedMime);
    text = extracted.text;
    if (!extractionMethod) extractionMethod = extracted.method;
  }

  let mode;
  let images;
  let effectiveExtractionMethod;

  if (isPdf) {
    if (!isThinDigitalText(text)) {
      mode = "text";
      effectiveExtractionMethod = "digital";
    } else {
      const maxPages = renderMaxPages();
      images = maxPages
        ? await renderPdfPagesToPng(filePath, maxPages)
        : await renderPdfPagesToPng(filePath);
      if (!Array.isArray(images) || images.length === 0) {
        throw makeError("CV_NO_CONTENT", "CV has no extractable content (empty text)");
      }
      mode = "image";
      effectiveExtractionMethod = "pdf_page_images";
    }
  } else if (isDocx) {
    if (!text || !text.trim()) {
      throw makeError("CV_NO_CONTENT", "CV has no extractable content (empty text)");
    }
    mode = "text";
    effectiveExtractionMethod = "digital";
  } else {
    throw makeError("CV_UNSUPPORTED", "Unsupported file type. Only PDF and DOCX are allowed.");
  }

  const { systemPrompt, userContent, metadata } = buildCvExtractionPrompt(
    mode === "text"
      ? { mode: "text", text }
      : { mode: "image", pageCount: images.length }
  );

  const result = await createCvExtraction({
    systemPrompt,
    userContent,
    images: mode === "image" ? images : undefined,
    schema: CV_JSON_SCHEMA,
    metadata,
  });

  const validated = validateCvOutput(result.parsed);

  const meta = {
    parser: "gpt-5-mini",
    model: result.model || null,
    prompt_id: metadata.prompt_id,
    prompt_version: metadata.prompt_version,
    input_mode: mode,
    extraction_method: effectiveExtractionMethod,
    attempts: result.attempts,
    usage: result.usage,
    cost: result.cost,
  };

  const normalized = cvParser.normalizeParsedResult(validated, meta);

  // Quality gate: a technically-valid but near-empty result should let the
  // caller fall back to the NLP parser (for text) or surface no-content.
  if (cvParser.isThinParsedResult(normalized)) {
    throw makeError("CV_PARSED_THIN", "GPT-5 mini returned a thin parsed result", {
      input_mode: mode,
      extraction_method: effectiveExtractionMethod,
    });
  }

  return normalized;
}

module.exports = {
  parseWithGpt5Mini,
  extractDigitalCvText,
  // Exported for unit testing / reuse.
  isThinDigitalText,
};
