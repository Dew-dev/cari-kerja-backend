const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");
const axios = require("axios");
const nlp = require("compromise");
const chrono = require("chrono-node");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  extractPdfTextHybrid,
  isThinExtractedText,
} = require("./cv_ocr");
const {
  isPythonResumeParserEnabled,
  isPythonStrict,
  parseWithPythonResumeParser,
  extractTextWithPython,
  serializePythonError,
} = require("./cv_python_parser");

const AI_PARSER_MODEL_DEFAULT = "gpt-4o-mini";

// resume-parser depends on mime@1 API (lookup/extension). mime@2+ renamed these.
try {
  const mime = require("mime");
  if (typeof mime.lookup !== "function" && typeof mime.getType === "function") {
    mime.lookup = (filename) => mime.getType(filename);
  }
  if (typeof mime.extension !== "function" && typeof mime.getExtension === "function") {
    mime.extension = (type) => mime.getExtension(type);
  }
} catch {
  // ignore — resume-parser optional
}

let resumeParserInternal = null;
try {
  // Package API is broken in v1.1.0; we use internal parseIt.parseResumeFile directly.
  resumeParserInternal = require("resume-parser/src/utils/parseIt");
} catch {
  resumeParserInternal = null;
}

// ─── TEXT EXTRACTION ─────────────────────────────────────────────────────────

function scrubExtractedText(text) {
  return String(text || "")
    .replace(/\u00a0/g, " ")
    .replace(/^--\s*\d+\s+of\s+\d+\s*--\s*$/gm, "")
    .trim();
}

/**
 * @returns {Promise<{ text: string, method: string, warnings?: object[] }>}
 */
async function extractText(filePath, mimetype) {
  let text = "";
  let method = "digital";
  const warnings = [];

  if (mimetype === "application/pdf") {
    let digital = "";
    // pdfplumber (via Python) preserves reading order on multi-column CVs.
    // Node pdf-parse often interleaves columns and breaks title/company pairing.
    try {
      digital = scrubExtractedText(await extractTextWithPython(filePath));
    } catch (err) {
      console.warn("Python PDF text extract failed; falling back to pdf-parse:", err.message);
      warnings.push({
        stage: "python_extract_text",
        ...serializePythonError(err),
      });
      if (isPythonStrict()) {
        throw err;
      }
      const buffer = fs.readFileSync(filePath);
      const parser = new PDFParse({ data: buffer });
      const data = await parser.getText();
      digital = scrubExtractedText(data.text || "");
    }
    const hybrid = await extractPdfTextHybrid(filePath, digital);
    text = scrubExtractedText(hybrid.text);
    method = hybrid.method;
  } else if (isDocxMimetype(mimetype)) {
    text = scrubExtractedText(await extractDocxText(filePath));
    method = "digital";
  } else {
    throw new Error("Unsupported file type. Only PDF and DOCX are allowed.");
  }

  const trimmed = String(text).replace(/\u00a0/g, " ").trim();
  if (!trimmed) {
    if (mimetype === "application/pdf") {
      throw new Error(
        "CV has no extractable content (empty text). This looks like a scanned/image-only PDF; " +
          "enable CV_OCR_VISION_* (or install working local OCR) and retry."
      );
    }
    throw new Error("CV has no extractable content (empty text)");
  }
  return { text: trimmed, method, warnings };
}

function isDocxMimetype(mimetype) {
  return (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimetype === "application/msword"
  );
}

/** Resolve MIME from extension when browser/OS sends octet-stream or wrong type. */
function resolveCvMimetype(filePath, mimetype) {
  const ext = path.extname(String(filePath || "")).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (ext === ".doc") return "application/msword";
  return mimetype;
}

function decodeBasicHtmlEntities(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");
}

function stripHtmlTags(value) {
  return decodeBasicHtmlEntities(String(value || "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function htmlFragmentIsBold(fragment) {
  return /<(strong|b|h[1-6])(\s|>|\/)/i.test(fragment) || /font-weight\s*:\s*(bold|[6-9]00)/i.test(fragment);
}

function htmlToStructuredLines(html) {
  const normalized = String(html || "")
    .replace(/\r/g, "")
    .replace(/<\/?(html|body|head|meta|style|script)[^>]*>/gi, "")
    // Preserve heading markers before stripping tags
    .replace(/<h[1-6](\s[^>]*)?>/gi, "\n[[H]]")
    .replace(/<\/h[1-6]>/gi, "[[/H]]\n")
    .replace(/<\/(p|li|tr|div|table|ul|ol)>/gi, "\n")
    .replace(/<(p|li|tr|div|br|hr)(\s[^>]*)?\/?>/gi, "\n")
    .replace(/<\/?(ul|ol|table|tbody|thead|span)[^>]*>/gi, "");

  const lines = [];
  let y = 100000;
  for (const raw of normalized.split("\n")) {
    const fragment = raw.trim();
    if (!fragment) continue;
    const markedHeading = /\[\[H\]\]/.test(fragment);
    const cleanedFragment = fragment.replace(/\[\[\/?H\]\]/g, "");
    const text = stripHtmlTags(cleanedFragment);
    if (!text) continue;
    const isBold =
      markedHeading ||
      htmlFragmentIsBold(cleanedFragment) ||
      (/[A-Za-z]/.test(text) && text === text.toUpperCase());
    const isHeading =
      markedHeading ||
      hasExperienceHeading(text) ||
      hasEducationHeading(text) ||
      hasSkillHeading(text) ||
      hasProfileHeading(text);
    const item = {
      text,
      x: 0,
      y,
      width: text.length * 6,
      height: 12,
      fontName: isBold ? "Bold" : "Regular",
      isBold,
    };
    lines.push({
      y,
      text,
      isBold,
      isHeading,
      items: [item],
    });
    y -= 14;
  }
  return lines;
}

function htmlToPlainText(html) {
  return htmlToStructuredLines(html)
    .map((line) => line.text)
    .join("\n")
    .trim();
}

async function extractDocxText(filePath) {
  const ext = path.extname(String(filePath || "")).toLowerCase();
  if (ext === ".doc") {
    throw new Error(
      "Unsupported file type. Legacy .doc is not supported; please upload .docx or PDF."
    );
  }

  try {
    const { value: html } = await mammoth.convertToHtml({ path: filePath });
    const fromHtml = htmlToPlainText(html);
    if (fromHtml) return fromHtml;
  } catch (err) {
    console.warn("DOCX HTML extract failed; falling back to raw text:", err.message);
  }

  const result = await mammoth.extractRawText({ path: filePath });
  return result.value || "";
}

// ─── AI STRUCTURED EXTRACTION ───────────────────────────────────────────────

const CV_JSON_SCHEMA = {
  name: "cv_parsed_data",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["personal_info", "work_experiences", "educations", "skills"],
    properties: {
      personal_info: {
        type: "object",
        additionalProperties: false,
        required: ["full_name", "email", "phone", "location", "summary"],
        properties: {
          full_name: { type: ["string", "null"] },
          email: { type: ["string", "null"] },
          phone: { type: ["string", "null"] },
          location: { type: ["string", "null"] },
          summary: { type: ["string", "null"] },
        },
      },
      work_experiences: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["company_name", "job_title", "start_date", "end_date", "is_current", "description"],
          properties: {
            company_name: { type: ["string", "null"] },
            job_title: { type: ["string", "null"] },
            start_date: { type: ["string", "null"] },
            end_date: { type: ["string", "null"] },
            is_current: { type: "boolean" },
            description: { type: ["string", "null"] },
          },
        },
      },
      educations: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["institution_name", "degree", "major", "start_date", "end_date", "is_current", "description"],
          properties: {
            institution_name: { type: ["string", "null"] },
            degree: { type: ["string", "null"] },
            major: { type: ["string", "null"] },
            start_date: { type: ["string", "null"] },
            end_date: { type: ["string", "null"] },
            is_current: { type: "boolean" },
            description: { type: ["string", "null"] },
          },
        },
      },
      skills: {
        type: "array",
        items: { type: "string" },
      },
    },
  },
};

function isAIParsingEnabled() {
  return Boolean(process.env.CV_PARSER_AI_URL && process.env.CV_PARSER_AI_KEY);
}

function isResumeParserEnabled() {
  return process.env.CV_USE_RESUME_PARSER === "true" && Boolean(resumeParserInternal);
}

function isOpenResumeStyleEnabled() {
  // Explicit false always wins.
  if (process.env.CV_USE_OPENRESUME_STYLE === "false") return false;
  // Explicit true always wins.
  if (process.env.CV_USE_OPENRESUME_STYLE === "true") return true;
  // When Python is the preferred local parser, skip OpenResume unless forced on.
  if (process.env.CV_USE_PYTHON_RESUME_PARSER === "true") return false;
  return true;
}

async function parseWithAI(rawText) {
  const AI_PARSER_URL = process.env.CV_PARSER_AI_URL;
  const AI_PARSER_API_KEY = process.env.CV_PARSER_AI_KEY;
  const AI_PARSER_MODEL = process.env.CV_PARSER_AI_MODEL || AI_PARSER_MODEL_DEFAULT;

  const systemPrompt =
    "Extract only facts explicitly present in the CV. Preserve the candidate's date format. Do not infer missing values; use null. Put multiple responsibility bullet points into one description separated by newlines.";
  const userPrompt = `Extract structured candidate data from this CV:\n\n${rawText}`;

  const isGeminiNative =
    AI_PARSER_URL.includes("generativelanguage.googleapis.com") &&
    !AI_PARSER_URL.includes("/openai/");

  const body = isGeminiNative
    ? {
        contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      }
    : {
        model: AI_PARSER_MODEL,
        temperature: 0,
        response_format: {
          type: "json_schema",
          json_schema: CV_JSON_SCHEMA,
        },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      };

  const headers = {
    "Content-Type": "application/json",
  };

  if (isGeminiNative) {
    headers["x-goog-api-key"] = AI_PARSER_API_KEY;
  } else {
    headers.Authorization = `Bearer ${AI_PARSER_API_KEY}`;
  }

  const response = await axios.post(AI_PARSER_URL, body, {
    headers,
    timeout: 30000,
  });

  const content = extractAIContent(response.data);
  if (!content) throw new Error("CV AI parser returned an empty response");

  return safeJsonParse(content);
}

function extractAIContent(data) {
  // OpenAI and OpenAI-compatible providers (including Gemini OpenAI endpoint)
  const messageContent = data?.choices?.[0]?.message?.content;
  if (typeof messageContent === "string" && messageContent.trim()) return messageContent;
  if (Array.isArray(messageContent)) {
    const joined = messageContent
      .map((item) => (typeof item === "string" ? item : item?.text || ""))
      .join("\n")
      .trim();
    if (joined) return joined;
  }

  // Native Gemini REST response
  const geminiParts = data?.candidates?.[0]?.content?.parts;
  if (Array.isArray(geminiParts)) {
    const joined = geminiParts
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("\n")
      .trim();
    if (joined) return joined;
  }

  return null;
}

function safeJsonParse(text) {
  const trimmed = String(text).trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const withoutFence = trimmed
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    return JSON.parse(withoutFence);
  }
}

function parseResumeFileWithLibrary(filePath, outputDir) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (err, name) => {
      if (settled) return;
      settled = true;
      if (err) return reject(err instanceof Error ? err : new Error(String(err)));
      return resolve(name);
    };

    try {
      resumeParserInternal.parseResumeFile(filePath, outputDir, (name, error) => {
        finish(error || null, name);
      });
    } catch (err) {
      finish(err);
    }
  });
}

function mapResumeParserParts(parts) {
  const personal_info = {
    full_name: parts.name || null,
    email: parts.email || null,
    phone: parts.phone || null,
    location: parts.contacts ? parts.contacts.split("\n")[0] || null : null,
  };

  const experienceLines = normalizeLines(parts.experience || parts.positions || "");
  const educationLines = normalizeLines(parts.education || "");
  const skillLines = normalizeLines(parts.skills || parts.technology || "");

  return {
    personal_info,
    work_experiences: parseWorkExperiences(experienceLines),
    educations: parseEducations(educationLines),
    skills: parseSkills(skillLines, skillLines),
  };
}

async function parseWithResumeParser(filePath) {
  const tempDir = path.join(os.tmpdir(), `resume-parser-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    const parsedFileName = await parseResumeFileWithLibrary(filePath, tempDir);
    const jsonPath = path.join(tempDir, `${parsedFileName}.json`);
    if (!fs.existsSync(jsonPath)) {
      throw new Error("resume-parser did not produce JSON output");
    }

    const parts = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    return mapResumeParserParts(parts);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

// ─── OPENRESUME-STYLE PDF PARSER ────────────────────────────────────────────

function textLooksLikeHeading(text) {
  const t = String(text || "").trim();
  if (!t || t.length > 40) return false;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length > 5) return false;
  return /^[A-Z\s&/-]+$/.test(t) || /^[A-Z][a-zA-Z\s&/-]+$/.test(t);
}

function toLineText(line) {
  return line.items
    .map((i) => i.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasSkillHeading(text) {
  return /skills?|keahlian|kompetensi|tools|technologies|kemampuan|keahlian\s+teknis|core\s+competenc|technical\s+proficienc|expertise/i.test(text);
}

function hasExperienceHeading(text) {
  return /experience|employment|riwayat\s+pekerjaan|pengalaman(\s+kerja)?|work\s+history|career|karir|pekerjaan|professional\s+experience|work\s+experience/i.test(text);
}

function hasEducationHeading(text) {
  return /education|pendidikan|academic|riwayat\s+pendidikan|akademik|qualifications|education\s*&\s*training|academic\s+background/i.test(text);
}

function hasProfileHeading(text) {
  return /profile|profil|ringkasan|summary|tentang\s+saya|about\s+me|biodata|professional\s+summary|objective|career\s+objective/i.test(text);
}

const SECTION_HEADING_EXCLUDES = new Set([
  "experience", "education", "skills", "profile", "summary", "contact",
  "pengalaman", "pendidikan", "keahlian", "profil", "ringkasan", "kontak",
  "work experience", "employment history", "technical skills", "personal info",
  "riwayat pekerjaan", "riwayat pendidikan", "sertifikasi", "organisasi",
  "professional experience", "professional summary", "core competencies",
  "qualifications", "employment", "work history", "career history",
  "academic background", "education & training", "expertise",
]);

const ID_CITY_HINTS = [
  "jakarta", "bandung", "surabaya", "medan", "semarang", "makassar", "depok",
  "tangerang", "bekasi", "yogyakarta", "yogya", "bali", "denpasar", "bogor",
  "malang", "solo", "surakarta", "palembang", "batam", "padang", "manado",
  "pontianak", "balikpapan", "samarinda", "pekanbaru", "banjarmasin",
];

const EN_CITY_HINTS = [
  "new york", "los angeles", "san francisco", "chicago", "seattle", "boston",
  "austin", "denver", "miami", "london", "manchester", "birmingham", "edinburgh",
  "toronto", "vancouver", "montreal", "sydney", "melbourne", "singapore",
  "kuala lumpur", "manila", "bangkok", "dubai", "hong kong", "tokyo",
  "berlin", "munich", "amsterdam", "paris", "dublin", "remote",
];

const PHONE_ID_RE = /(\+?62|0)[\s.-]?\d[\d\s.-]{7,14}/;
const PHONE_US_RE = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
const PHONE_INTL_RE = /\+[1-9]\d{0,2}[\s.-]?\d[\d\s.-]{6,14}/;
const PHONE_ANY_RE = new RegExp(
  `(?:${PHONE_ID_RE.source})|(?:${PHONE_US_RE.source})|(?:${PHONE_INTL_RE.source})`
);
const EMAIL_ANY_RE = /[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/;
const LOCATION_US_RE = /[A-Z][a-zA-Z.\s]+,\s*[A-Z]{2}\b/;
const LOCATION_CITY_COUNTRY_RE = /\b[A-Z][a-zA-Z.\s-]{1,40},\s*[A-Z][a-zA-Z\s-]{1,40}\b/;
const LOCATION_ID_RE = /(?:kota|kab\.?|kabupaten)\s+[A-Za-z][A-Za-z\s.]+/i;

function groupTextItemsIntoLines(items) {
  const sorted = [...items].sort((a, b) => {
    const dy = Math.abs(a.y - b.y);
    if (dy > 2) return b.y - a.y;
    return a.x - b.x;
  });

  const lines = [];
  for (const item of sorted) {
    const target = lines.find((line) => Math.abs(line.y - item.y) <= Math.max(2, item.height * 0.5));
    if (target) {
      target.items.push(item);
    } else {
      lines.push({ y: item.y, items: [item] });
    }
  }

  for (const line of lines) {
    line.items.sort((a, b) => a.x - b.x);
  }

  return lines
    .map((line) => ({
      y: line.y,
      items: line.items,
      text: toLineText(line),
      isBold: line.items.some((i) => /bold|black|heavy/i.test(String(i.fontName || ""))),
    }))
    .filter((line) => line.text.length > 0)
    .sort((a, b) => b.y - a.y);
}

function groupLinesIntoSections(lines) {
  const sections = { profile: [] };
  let current = "profile";

  for (const line of lines) {
    const knownSection =
      hasExperienceHeading(line.text) ||
      hasEducationHeading(line.text) ||
      hasSkillHeading(line.text) ||
      hasProfileHeading(line.text);

    // ALL-CAPS headings (common in PDF CVs) — do not treat Title Case bold names/titles as sections
    const allCapsHeading =
      textLooksLikeHeading(line.text) &&
      hasLetterAndIsAllUpperCase(line.text) &&
      line.text.length <= 40;

    // Explicit HTML headings (h1-h6) from DOCX
    const htmlHeading = Boolean(line.isHeading) && textLooksLikeHeading(line.text);

    if (!(knownSection || allCapsHeading || htmlHeading)) {
      if (!sections[current]) sections[current] = [];
      sections[current].push(line);
      continue;
    }

    const heading = line.text.toLowerCase();
    if (hasExperienceHeading(heading)) current = "experience";
    else if (hasEducationHeading(heading)) current = "education";
    else if (hasSkillHeading(heading)) current = "skills";
    else if (hasProfileHeading(heading)) current = "profile";
    else current = heading.replace(/[^a-z0-9]+/g, "_");

    if (!sections[current]) sections[current] = [];
  }

  return sections;
}

function getSectionTextLines(sections, keyHintRegex) {
  for (const [name, lines] of Object.entries(sections)) {
    if (keyHintRegex.test(name)) return lines.map((l) => l.text);
  }
  return [];
}

function getSectionLinesByKeywords(sections, keywords) {
  for (const sectionName of Object.keys(sections)) {
    if (keywords.some((keyword) => sectionName.toLowerCase().includes(keyword))) {
      return sections[sectionName] || [];
    }
  }
  return [];
}

function hasLetterAndIsAllUpperCase(text) {
  return /[A-Za-z]/.test(text) && text.toUpperCase() === text;
}

function hasOnlyLettersSpacesAmpersands(text) {
  return /^[A-Za-z\s&]+$/.test(text || "");
}

function getTextWithHighestFeatureScore(textItems, featureSets, allowNonPositive, concatOnTie) {
  const textScores = textItems.map((item) => ({ text: item.text || "", score: 0 }));

  for (let i = 0; i < textItems.length; i++) {
    const item = textItems[i];
    for (const [matcher, score, useMatchText] of featureSets) {
      const result = matcher(item);
      if (!result) continue;
      if (useMatchText && Array.isArray(result) && result[0]) {
        textScores.push({ text: result[0], score });
      } else {
        textScores[i].score += score;
      }
    }
  }

  let highest = -Infinity;
  let winners = [];
  for (const s of textScores) {
    if (s.score > highest) {
      highest = s.score;
      winners = [s.text];
    } else if (s.score === highest) {
      winners.push(s.text);
    }
  }

  if (!allowNonPositive && highest <= 0) return "";
  if (!winners.length) return "";
  return concatOnTie ? winners.map((v) => v.trim()).join(" ") : winners[0];
}

function divideSectionIntoSubsections(lines) {
  if (!lines.length) return [];
  const ys = lines.map((line) => line.y);
  const gapCount = {};
  let commonGap = 0;
  let maxCount = 0;
  for (let i = 1; i < ys.length; i++) {
    const gap = Math.round(ys[i - 1] - ys[i]);
    gapCount[gap] = (gapCount[gap] || 0) + 1;
    if (gapCount[gap] > maxCount) {
      maxCount = gapCount[gap];
      commonGap = gap;
    }
  }
  const threshold = commonGap * 1.4;

  const createBy = (isNewSubsection) => {
    const out = [];
    let current = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (i === 0) {
        current.push(line);
        continue;
      }
      if (isNewSubsection(line, lines[i - 1])) {
        out.push(current);
        current = [];
      }
      current.push(line);
    }
    if (current.length) out.push(current);
    return out;
  };

  let subsections = createBy((line, prevLine) => Math.round(prevLine.y - line.y) > threshold);
  if (subsections.length === 1) {
    subsections = createBy((line, prevLine) => !prevLine.isBold && line.isBold && !/^[•●○\-*]$/.test(line.text));
  }
  return subsections;
}

const BULLET_POINTS = ["•", "●", "○", "*"];

function getDescriptionsLineIdx(lines) {
  for (let i = 0; i < lines.length; i++) {
    if (
      lines[i].items.some((item) =>
        BULLET_POINTS.some((bullet) => (item.text || "").includes(bullet)) ||
        /^\s*[-–—]\s+\S/.test(item.text || "")
      )
    ) {
      return i;
    }
  }
  for (let i = 0; i < lines.length; i++) {
    const words = (lines[i].text || "").split(/\s+/).filter((w) => w && !/\d/.test(w));
    if (lines[i].items.length === 1 && words.length >= 8) return i;
  }
  return undefined;
}

function getBulletPointsFromLines(lines) {
  if (!lines.length) return [];

  // Prefer line-based extraction when lines already look like separate bullets/paragraphs
  const lineTexts = lines.map((line) => (line.text || "").trim()).filter(Boolean);
  const looksLikeSeparateBullets = lineTexts.some((t) =>
    BULLET_POINTS.some((b) => t.startsWith(b)) || /^\s*[-–—]\s+\S/.test(t)
  );
  if (looksLikeSeparateBullets || lineTexts.length > 1) {
    return lineTexts.map((t) => t.replace(/^\s*[-–—•●○*]\s*/, "").trim()).filter(Boolean);
  }

  let text = lineTexts.join(" ").replace(/\s+/g, " ").trim();
  const firstIdx = BULLET_POINTS.map((b) => text.indexOf(b)).filter((v) => v >= 0).sort((a, b) => a - b)[0];
  if (firstIdx === undefined) return lineTexts;
  text = text.slice(firstIdx);
  let common = BULLET_POINTS[0];
  let commonCount = 0;
  for (const b of BULLET_POINTS) {
    const count = (text.match(new RegExp(`\\${b}`, "g")) || []).length;
    if (count > commonCount) {
      common = b;
      commonCount = count;
    }
  }
  return text.split(common).map((v) => v.trim()).filter(Boolean);
}

function isLikelySectionHeadingName(text) {
  const lower = String(text || "").trim().toLowerCase();
  if (!lower) return true;
  if (SECTION_HEADING_EXCLUDES.has(lower)) return true;
  return hasExperienceHeading(lower) || hasEducationHeading(lower) || hasSkillHeading(lower) || hasProfileHeading(lower);
}

function matchLocationFromCityHints(raw, lower, cities) {
  for (const city of cities) {
    if (!lower.includes(city)) continue;
    if (raw.length <= 60 && !EMAIL_ANY_RE.test(raw) && !PHONE_ANY_RE.test(raw)) return raw;
    const cityRe = new RegExp(`\\b${city.replace(/\s+/g, "\\s+")}\\b[\\w\\s.,-]*`, "i");
    const m = raw.match(cityRe);
    if (m) return m[0].trim();
  }
  return null;
}

/** Indonesian + English/international location heuristics. */
function matchLocation(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  const idMatch = raw.match(LOCATION_ID_RE);
  if (idMatch) return idMatch[0].trim();
  const usMatch = raw.match(LOCATION_US_RE);
  if (usMatch) return usMatch[0].trim();
  const cityCountry = raw.match(LOCATION_CITY_COUNTRY_RE);
  if (cityCountry && raw.length <= 60 && !EMAIL_ANY_RE.test(raw) && !PHONE_ANY_RE.test(raw)) {
    return cityCountry[0].trim();
  }
  const lower = raw.toLowerCase();
  return (
    matchLocationFromCityHints(raw, lower, ID_CITY_HINTS) ||
    matchLocationFromCityHints(raw, lower, EN_CITY_HINTS)
  );
}

/** @deprecated use matchLocation — kept for call-site clarity during transition */
function matchIndonesianLocation(text) {
  return matchLocation(text);
}

function extractFirstMatch(text, regex) {
  const m = String(text || "").match(regex);
  return m ? m[0] : null;
}

function extractProfileFromSections(sections) {
  const lines = sections.profile || [];
  const items = lines.flatMap((line) => line.items || []);
  const profileText = lines.map((l) => l.text).join("\n");

  const matchName = (i) => {
    const t = (i.text || "").trim();
    if (!t || isLikelySectionHeadingName(t)) return null;
    if (EMAIL_ANY_RE.test(t) || PHONE_ANY_RE.test(t)) return null;
    if (/https?:\/\/|www\./i.test(t)) return null;
    if (/\d/.test(t)) return null;
    return t.match(/^[A-Za-zÀ-ÿ' .\-]+$/);
  };
  const matchEmail = (i) => (i.text || "").match(EMAIL_ANY_RE);
  const matchPhone = (i) => (i.text || "").match(PHONE_ANY_RE);
  const matchLocation = (i) => {
    const loc = matchIndonesianLocation(i.text || "");
    return loc ? [loc] : null;
  };
  const matchUrl = (i) => (i.text || "").match(/\S+\.[a-z]+\/\S+/i);

  const hasAt = (i) => (i.text || "").includes("@");
  const hasNumber = (i) => /\d/.test(i.text || "");
  const hasParen = (i) => /\([0-9]+\)/.test(i.text || "");
  const hasComma = (i) => (i.text || "").includes(",");
  const hasSlash = (i) => (i.text || "").includes("/");
  const has4Words = (i) => (i.text || "").split(/\s+/).length >= 4;
  const isExcludedHeading = (i) => isLikelySectionHeadingName(i.text || "");

  // Prefer early bold/uppercase name candidates from the first few lines
  const earlyItems = lines.slice(0, 4).flatMap((line) => line.items || []);
  let name = getTextWithHighestFeatureScore(earlyItems.length ? earlyItems : items, [
    [matchName, 4, true],
    [(i) => i.isBold, 2],
    [(i) => hasLetterAndIsAllUpperCase(i.text || ""), 2],
    [isExcludedHeading, -8],
    [hasAt, -4],
    [hasNumber, -4],
    [hasParen, -4],
    [hasComma, -4],
    [hasSlash, -4],
    [has4Words, -2],
  ]);
  if (name && isLikelySectionHeadingName(name)) name = "";

  const email =
    getTextWithHighestFeatureScore(items, [[matchEmail, 4, true]], true) ||
    extractFirstMatch(profileText, EMAIL_ANY_RE);
  const phoneRaw =
    getTextWithHighestFeatureScore(items, [[matchPhone, 4, true]], true) ||
    extractFirstMatch(profileText, PHONE_ANY_RE);
  const phone = phoneRaw ? String(phoneRaw).replace(/\s/g, "") : null;

  let location = getTextWithHighestFeatureScore(items, [[matchLocation, 4, true]], true);
  if (!location) {
    for (const line of lines) {
      const loc = matchIndonesianLocation(line.text);
      if (loc) {
        location = loc;
        break;
      }
    }
  }

  const url = getTextWithHighestFeatureScore(items, [[matchUrl, 4, true]], true);
  const summary = getTextWithHighestFeatureScore(items, [[has4Words, 4]], true, true);

  return {
    full_name: name || null,
    email: email || null,
    phone: phone || null,
    location: location || null,
    url: url || null,
    summary: summary || null,
  };
}

function extractWorkFromSections(sections) {
  const lines = getSectionLinesByKeywords(sections, [
    "work", "experience", "employment", "history", "job", "pengalaman", "pekerjaan", "karir", "career", "professional",
  ]);
  const subsections = divideSectionIntoSubsections(lines);
  const items = [];

  for (const subsection of subsections) {
    const descIdx = getDescriptionsLineIdx(subsection);
    const infoLines = subsection.slice(0, descIdx === undefined ? Math.min(3, subsection.length) : descIdx);
    const infoItems = infoLines.flatMap((line) => line.items);
    const descriptions = getBulletPointsFromLines(subsection.slice(descIdx === undefined ? Math.min(3, subsection.length) : descIdx));

    const dateFromLines =
      subsection.map((l) => l.text).find((t) => /(?:19|20)\d{2}/.test(t) || PRESENT_RE.test(t)) || "";
    const date = getTextWithHighestFeatureScore(
      infoItems,
      [[(i) => /(?:19|20)\d{2}|present|current|ongoing|to\s+date|till\s+date|sekarang|saat\s+ini/i.test(i.text || ""), 2]],
      true
    ) || dateFromLines;
    const jobTitle = getTextWithHighestFeatureScore(infoItems, [[(i) => JOB_TITLE_KEYWORDS.some((k) => (i.text || "").toLowerCase().includes(k)), 4]], true);
    const company = getTextWithHighestFeatureScore(infoItems, [
      [(i) => i.isBold, 2],
      [(i) => COMPANY_HINT_RE.test(i.text || ""), 3],
      [(i) => (date ? (i.text || "").includes(date) : false), -4],
      [(i) => (jobTitle ? (i.text || "").includes(jobTitle) : false), -4],
    ], true);

    const dateParts = parseDateRange(date || infoLines.map((l) => l.text).join(" | "));
    const description = descriptions
      .filter((d) => d && d !== date && d !== jobTitle && d !== company && !isMostlyDateLine(d))
      .join("\n") || null;
    items.push({
      company_name: company || null,
      job_title: jobTitle || null,
      start_date: dateParts.start_date,
      end_date: dateParts.end_date,
      is_current: dateParts.is_current,
      description,
    });
  }

  return items.filter((item) => item.company_name || item.job_title || item.description);
}

function extractEducationFromSections(sections) {
  const lines = getSectionLinesByKeywords(sections, [
    "education", "course", "academic", "pendidikan", "akademik", "qualification", "training",
  ]);
  const subsections = divideSectionIntoSubsections(lines);
  const out = [];

  for (const subsection of subsections) {
    const textItems = subsection.flatMap((line) => line.items);
    const institution = getTextWithHighestFeatureScore(textItems, [[(i) => /college|university|institute|school|academy|politeknik|universitas|institut|sekolah|sma|smk/i.test(i.text || ""), 4]], true);
    const degree = getTextWithHighestFeatureScore(textItems, [[(i) => DEGREE_HINT_RE.test(i.text || ""), 4]], true);
    const major = getTextWithHighestFeatureScore(textItems, [[(i) => /major|jurusan|informatika|computer|engineering|account|management|design|teknik|ekonomi|hukum|kedokteran|psikologi|bisnis/i.test(i.text || ""), 3]], true);
    const dateText = getTextWithHighestFeatureScore(textItems, [[(i) => /(?:19|20)\d{2}|present|current|sekarang/i.test(i.text || ""), 2]], true);
    const date = parseDateRange(dateText || subsection.map((l) => l.text).join(" | "));
    const descIdx = getDescriptionsLineIdx(subsection);
    const descriptions = descIdx === undefined ? [] : getBulletPointsFromLines(subsection.slice(descIdx));

    out.push({
      institution_name: institution || null,
      degree: degree || null,
      major: major || null,
      start_date: date.start_date,
      end_date: date.end_date,
      is_current: date.is_current,
      description: descriptions.join("\n") || null,
    });
  }

  return out.filter((item) => item.institution_name || item.degree || item.description);
}

function extractSkillsFromSections(sections) {
  const lines = getSectionLinesByKeywords(sections, [
    "skill", "keahlian", "kompetensi", "kemampuan", "tools", "technology", "competenc", "expertise", "proficienc",
  ]);
  const descriptionsIdx = getDescriptionsLineIdx(lines);
  const descriptionsLines = descriptionsIdx === undefined ? lines : lines.slice(descriptionsIdx);
  const featuredLines = descriptionsIdx === undefined ? [] : lines.slice(0, descriptionsIdx);
  const descriptions = getBulletPointsFromLines(descriptionsLines);

  const fromFeatured = featuredLines
    .flatMap((line) => line.items)
    .map((item) => (item.text || "").trim())
    .filter(Boolean)
    .slice(0, 6);

  const fromDescriptions = descriptions
    .flatMap((line) => line.split(/[,|;/]+/))
    .map((v) => v.trim())
    .filter((v) => v.length >= 2 && v.length <= 40);

  return dedupeSkills([...fromFeatured, ...fromDescriptions]);
}

async function readPdfTextItems(filePath) {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(fs.readFileSync(filePath));
  // disableWorker avoids mixing pdfjs API/worker builds (e.g. 6.x vs pdf-parse's nested 5.x)
  const doc = await pdfjsLib.getDocument({ data, disableWorker: true, useSystemFonts: true }).promise;
  const items = [];

  for (let pageNo = 1; pageNo <= doc.numPages; pageNo++) {
    const page = await doc.getPage(pageNo);
    const textContent = await page.getTextContent();

    for (const it of textContent.items) {
      const str = String(it.str || "").replace(/\s+/g, " ").trim();
      if (!str) continue;
      const transform = it.transform || [0, 0, 0, 0, 0, 0];
      items.push({
        text: str,
        x: transform[4] || 0,
        y: transform[5] || 0,
        width: it.width || 0,
        height: it.height || 0,
        fontName: it.fontName || "",
      });
    }
  }

  return items;
}

async function parseWithOpenResumeStyle(filePath) {
  const textItems = await readPdfTextItems(filePath);
  const lines = groupTextItemsIntoLines(textItems);
  return buildParsedFromStructuredLines(lines, {
    parser: "openresume_style",
    text_item_count: textItems.length,
  });
}

function buildParsedFromStructuredLines(lines, meta = {}) {
  const sections = groupLinesIntoSections(lines);
  const profile = extractProfileFromSections(sections);
  const workExperiences = extractWorkFromSections(sections);
  const educations = extractEducationFromSections(sections);
  const skills = extractSkillsFromSections(sections);

  return {
    personal_info: {
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      summary: profile.summary || null,
    },
    work_experiences: workExperiences,
    educations,
    skills,
    _meta: {
      parser: meta.parser || "structured",
      raw_char_count: lines.map((l) => l.text).join(" ").length,
      line_count: lines.length,
      sections_detected: Object.keys(sections),
      ...meta,
    },
  };
}

async function parseWithDocxStyle(filePath) {
  const { value: html } = await mammoth.convertToHtml({ path: filePath });
  if (!html || !String(html).trim()) {
    throw new Error("DOCX HTML conversion returned empty content");
  }
  const lines = htmlToStructuredLines(html);
  if (!lines.length) {
    throw new Error("DOCX structured lines are empty");
  }
  return buildParsedFromStructuredLines(lines, {
    parser: "docx_style",
  });
}

// ─── NLP FALLBACK PARSER ─────────────────────────────────────────────────────

const EMAIL_RE = EMAIL_ANY_RE;
const PHONE_RE = PHONE_ID_RE;
const PRESENT_RE = /(present|current|now|ongoing|to\s+date|till\s+date|sekarang|saat\s+ini)/i;
const COMPANY_HINT_RE = /\b(pt\.?|cv\.?|inc\.?|llc|ltd\.?|corp\.?|company|co\.?|startup|bank|group|gmbh|plc|universitas|university|college|institute|institut|school|sekolah|politeknik|ud\.?|tbk\.?)\b/i;
const DEGREE_HINT_RE = /\b(sma|smk|d1|d2|d3|d4|s1|s2|s3|bachelor(?:'s)?|master(?:'s)?|phd|ph\.?d\.?|mba|b\.?\s?s\.?|b\.?\s?a\.?|b\.?\s?eng\.?|m\.?\s?s\.?|m\.?\s?a\.?|m\.?\s?eng\.?|sarjana|magister|doktor|diploma|associate|high\s+school|a-?levels?)\b/i;

const SECTION_KEYWORDS = {
  summary: [
    "professional summary",
    "summary",
    "profile",
    "profil",
    "ringkasan",
    "objective",
    "career objective",
    "about me",
    "tentang saya",
  ],
  experience: [
    "pengalaman kerja",
    "riwayat pekerjaan",
    "pengalaman",
    "work experience",
    "professional experience",
    "employment history",
    "employment",
    "career history",
    "experience",
    "karir",
    "pekerjaan",
    "work history",
    "relevant experience",
  ],
  education: [
    "pendidikan",
    "riwayat pendidikan",
    "education",
    "education & training",
    "education and training",
    "academic",
    "academic background",
    "akademik",
    "riwayat akademik",
    "qualifications",
    "educational background",
  ],
  skills: [
    "skills",
    "skill",
    "keahlian",
    "kompetensi",
    "technical skills",
    "core competencies",
    "core skills",
    "key skills",
    "kemampuan",
    "keahlian teknis",
    "tools",
    "technologies",
    "technical proficiencies",
    "expertise",
  ],
};

const JOB_TITLE_KEYWORDS = [
  "engineer",
  "developer",
  "manager",
  "analyst",
  "designer",
  "specialist",
  "lead",
  "intern",
  "internship",
  "magang",
  "officer",
  "consultant",
  "programmer",
  "administrator",
  "architect",
  "qa",
  "devops",
  "sre",
  "backend",
  "frontend",
  "fullstack",
  "full-stack",
  "full stack",
  "software",
  "product",
  "project manager",
  "program manager",
  "marketing",
  "sales",
  "hr",
  "human resources",
  "recruiter",
  "staff",
  "supervisor",
  "koordinator",
  "coordinator",
  "asisten",
  "assistant",
  "admin",
  "akuntansi",
  "accounting",
  "accountant",
  "kasir",
  "cashier",
  "guru",
  "teacher",
  "perawat",
  "nurse",
  "operator",
  "teknisi",
  "technician",
  "direktur",
  "director",
  "kepala",
  "head",
  "chief",
  "ceo",
  "cto",
  "cfo",
  "coo",
  "vp",
  "vice president",
  "clerk",
  "teller",
  "barista",
  "waiter",
  "waitress",
  "driver",
  "sopir",
  "sekretaris",
  "secretary",
  "content",
  "writer",
  "editor",
  "data",
  "scientist",
  "researcher",
  "support",
  "customer service",
  "customer success",
  "account manager",
  "business analyst",
  "scrum master",
  "cs",
];

const SKILL_STOPWORDS = new Set([
  "dan",
  "atau",
  "dengan",
  "the",
  "and",
  "for",
  "using",
  "use",
  "with",
  "from",
  "project",
  "projects",
  "team",
  "experience",
  "skills",
  "skill",
  "keahlian",
  "competencies",
  "proficiencies",
]);

function normalizeLines(rawText) {
  return rawText
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim());
}

function scoreSectionHeading(line, keywordList) {
  const lower = line.toLowerCase();
  const tokens = nlp(lower).terms().out("array");
  let score = 0;

  for (const phrase of keywordList) {
    if (lower.includes(phrase)) score += phrase.includes(" ") ? 4 : 2;
  }
  for (const token of tokens) {
    if (keywordList.includes(token)) score += 1;
  }

  if (line.length <= 60) score += 1;
  return score;
}

function detectSections(lines) {
  const sections = {};
  lines.forEach((line, idx) => {
    if (!line || line.length < 3 || line.length > 80) return;
    for (const [sectionName, keywords] of Object.entries(SECTION_KEYWORDS)) {
      const score = scoreSectionHeading(line, keywords);
      if (score >= 4 && sections[sectionName] === undefined) {
        sections[sectionName] = idx;
      }
    }
  });
  return sections;
}

function getSectionLines(lines, sections, sectionKey) {
  const start = sections[sectionKey];
  if (start === undefined) return [];

  const nextStart = Object.values(sections)
    .filter((v) => v > start)
    .sort((a, b) => a - b)[0];

  const end = nextStart !== undefined ? nextStart : lines.length;
  return lines.slice(start + 1, end).filter(Boolean);
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

const ID_MONTH_MAP = {
  januari: "January",
  februari: "February",
  maret: "March",
  april: "April",
  mei: "May",
  juni: "June",
  juli: "July",
  agustus: "August",
  september: "September",
  oktober: "October",
  november: "November",
  desember: "December",
};

function localizeDatesForChrono(text) {
  let out = String(text || "");
  for (const [id, en] of Object.entries(ID_MONTH_MAP)) {
    out = out.replace(new RegExp(`\\b${id}\\b`, "gi"), en);
  }
  return out
    .replace(/\bsaat\s+ini\b/gi, "present")
    .replace(/\bsekarang\b/gi, "present")
    .replace(/\bto\s+date\b/gi, "present")
    .replace(/\btill\s+date\b/gi, "present")
    .replace(/\bongoing\b/gi, "present");
}

function isMostlyDateLine(line) {
  const t = String(line || "").trim();
  if (!t) return false;
  if (PRESENT_RE.test(t) && t.length <= 40) return true;
  if (/\b((?:19|20)\d{2})\s*[-–—/]\s*((?:19|20)\d{2}|present|current|ongoing|to\s+date|till\s+date|sekarang|saat\s+ini)\b/i.test(t) && t.length <= 50) {
    return true;
  }
  const localized = localizeDatesForChrono(t);
  const parsed = chrono.parse(localized);
  if (!parsed.length) return false;
  const span = parsed[0];
  const covered = (span.text || "").length;
  return covered >= Math.min(t.length, 8) && t.length <= 50;
}

function parseYearRange(text) {
  const m = String(text || "").match(/\b((?:19|20)\d{2})\s*[-–—/]\s*((?:19|20)\d{2}|present|current|ongoing|to\s+date|till\s+date|sekarang|saat\s+ini)\b/i);
  if (!m) {
    const single = String(text || "").match(/\b((?:19|20)\d{2})\b/);
    if (!single) return null;
    return { start_date: `${single[1]}-01`, end_date: null, is_current: false };
  }
  const startYear = m[1];
  const endRaw = m[2];
  const is_current = PRESENT_RE.test(endRaw);
  return {
    start_date: `${startYear}-01`,
    end_date: is_current ? null : /^\d{4}$/.test(endRaw) ? `${endRaw}-01` : null,
    is_current,
  };
}

function parseDateRange(text) {
  const localized = localizeDatesForChrono(text);
  const parsed = chrono.parse(localized);
  if (parsed.length === 0) {
    const yearRange = parseYearRange(text);
    if (yearRange) return yearRange;
    return { start_date: null, end_date: null, is_current: PRESENT_RE.test(text) };
  }

  const start = parsed[0]?.start?.date();
  const end = parsed[0]?.end?.date() || parsed[1]?.start?.date() || null;
  const is_current = PRESENT_RE.test(text) || PRESENT_RE.test(localized);

  // If chrono only got one date, try year-range fallback for the other bound
  if (!end && !is_current) {
    const yearRange = parseYearRange(text);
    if (yearRange?.end_date || yearRange?.is_current) {
      return {
        start_date: start ? formatDate(start) : yearRange.start_date,
        end_date: yearRange.end_date,
        is_current: yearRange.is_current,
      };
    }
  }

  return {
    start_date: start ? formatDate(start) : null,
    end_date: is_current ? null : end ? formatDate(end) : null,
    is_current,
  };
}

function extractPersonalInfo(lines) {
  const topLines = lines.slice(0, 15).filter(Boolean);
  const topText = topLines.join("\n");
  const personCandidates = nlp(topText).people().out("array");
  const placeCandidates = nlp(topText).places().out("array");

  const info = { full_name: null, email: null, phone: null, location: null, summary: null };

  // Prefer first-line ALL CAPS / Title Case name (common on designed CVs)
  const headerName = topLines.find((line) => {
    if (isLikelySectionHeadingName(line)) return false;
    if (EMAIL_RE.test(line) || PHONE_ANY_RE.test(line)) return false;
    if (/[:|/]/.test(line) || /\d/.test(line)) return false;
    if (/https?:\/\/|www\.|github\.com|linkedin\.com/i.test(line)) return false;
    const words = line.split(/\s+/).filter(Boolean);
    return (
      words.length >= 2 &&
      words.length <= 6 &&
      line.length <= 80 &&
      /^[A-Za-zÀ-ÿ' .\-]+$/.test(line)
    );
  });
  if (headerName) {
    info.full_name = headerName === headerName.toUpperCase()
      ? headerName.replace(/\w+/g, (w) => w.charAt(0) + w.slice(1).toLowerCase())
      : headerName;
  } else {
    const bestName = personCandidates.find(
      (name) =>
        name.split(" ").length <= 6 &&
        name.length <= 80 &&
        !isLikelySectionHeadingName(name)
    );
    if (bestName) info.full_name = bestName;
  }

  if (!info.full_name) {
    const fallback = topLines.find((line) => {
      if (isLikelySectionHeadingName(line)) return false;
      if (EMAIL_RE.test(line) || PHONE_ANY_RE.test(line)) return false;
      if (/[:|/]/.test(line)) return false;
      if (/\d/.test(line)) return false;
      if (/https?:\/\/|www\./i.test(line)) return false;
      return line.length >= 3 && line.length <= 50 && /^[A-Za-zÀ-ÿ' .\-]+$/.test(line);
    });
    info.full_name = fallback || null;
  }

  const emailMatch = topText.match(EMAIL_RE) || String(lines.join("\n")).match(EMAIL_RE);
  if (emailMatch) info.email = emailMatch[0];

  const phoneMatch = topText.match(PHONE_ANY_RE) || String(lines.join("\n")).match(PHONE_ANY_RE);
  if (phoneMatch) info.phone = phoneMatch[0].replace(/\s/g, "");

  for (const line of topLines) {
    const loc = matchLocation(line);
    if (loc) {
      info.location = loc;
      break;
    }
  }
  if (!info.location && placeCandidates.length) info.location = placeCandidates[0];

  return info;
}

function isLikelyEntryStart(line) {
  if (!line) return false;
  if (isMostlyDateLine(line)) return false;
  const hasDate = chrono.parse(localizeDatesForChrono(line)).length > 0 || PRESENT_RE.test(line);
  const looksLikeCompany = COMPANY_HINT_RE.test(line);
  const looksLikeTitle = JOB_TITLE_KEYWORDS.some((k) => line.toLowerCase().includes(k));
  const isHeadingish = line.length <= 80 && !/[.;]{2,}/.test(line);
  return looksLikeCompany || (looksLikeTitle && isHeadingish) || (hasDate && looksLikeTitle);
}

function splitIntoEntries(sectionLines) {
  const entries = [];
  let current = [];

  for (const line of sectionLines) {
    if (!line) continue;
    // Date-only lines belong to the current entry
    if (isMostlyDateLine(line) && current.length > 0) {
      current.push(line);
      continue;
    }

    const lineLooksNew =
      COMPANY_HINT_RE.test(line) ||
      JOB_TITLE_KEYWORDS.some((k) => line.toLowerCase().includes(k));
    const currentHasDate = current.some(
      (item) => isMostlyDateLine(item) || chrono.parse(localizeDatesForChrono(item)).length > 0 || PRESENT_RE.test(item)
    );
    const shouldSplit =
      current.length > 0 &&
      lineLooksNew &&
      currentHasDate &&
      !isMostlyDateLine(line);

    if (shouldSplit) {
      entries.push(current);
      current = [line];
      continue;
    }

    current.push(line);
  }

  if (current.length) entries.push(current);
  return entries.filter((entry) => entry.length > 0);
}

function inferJobTitle(lines) {
  for (const line of lines.slice(0, 3)) {
    if (isMostlyDateLine(line)) continue;
    if (EMAIL_RE.test(line) || PHONE_ANY_RE.test(line)) continue;
    const lower = line.toLowerCase();
    if (JOB_TITLE_KEYWORDS.some((keyword) => lower.includes(keyword))) return line;
  }
  const firstNonDate = lines.find((line) => line && !isMostlyDateLine(line) && !COMPANY_HINT_RE.test(line));
  return firstNonDate || lines[0] || null;
}

function inferCompany(lines) {
  const text = lines.join("\n");
  const orgs = nlp(text).organizations().out("array");
  if (orgs.length) return orgs[0];
  const hinted = lines.find((line) => COMPANY_HINT_RE.test(line) && !isMostlyDateLine(line));
  return hinted || null;
}

function parseWorkExperiences(sectionLines) {
  const entries = splitIntoEntries(sectionLines);
  return entries
    .map((entryLines) => {
      const merged = entryLines.join(" | ");
      const date = parseDateRange(merged);
      const job_title = inferJobTitle(entryLines);
      const company_name = inferCompany(entryLines);
      const descriptionLines = entryLines.filter(
        (line) =>
          line &&
          line !== job_title &&
          line !== company_name &&
          !isMostlyDateLine(line)
      );
      const description = descriptionLines.join("\n").trim() || null;
      return {
        company_name,
        job_title,
        start_date: date.start_date,
        end_date: date.end_date,
        is_current: date.is_current,
        description,
      };
    })
    .filter((item) => item.job_title || item.company_name);
}

function inferEducationParts(lines) {
  const text = lines.join("\n");
  const orgs = nlp(text).organizations().out("array");
  const institution =
    orgs.find((org) => /universitas|university|college|institut|institute|school|sekolah|politeknik|sma|smk|academy/i.test(org)) ||
    lines.find((line) => /universitas|university|college|institut|institute|politeknik|sekolah|sma|smk|academy/i.test(line)) ||
    orgs[0] ||
    null;
  const degreeLine = lines.find((line) => DEGREE_HINT_RE.test(line)) || null;

  let major = null;
  if (degreeLine) {
    const match = degreeLine.match(/(?:-|–|—|\bin\b|\bof\b|jurusan|major)\s+(.+)$/i);
    if (match) major = match[1].trim();
    else {
      // e.g. "S1 Teknik Informatika" → major after degree code
      const afterDegree = degreeLine.replace(DEGREE_HINT_RE, "").replace(/^[\s\-–—:]+/, "").trim();
      if (afterDegree && afterDegree.length >= 3) major = afterDegree;
    }
  }
  if (!major) {
    const majorLine = lines.find((line) =>
      /jurusan|informatika|computer|engineering|teknik|ekonomi|manajemen|akuntansi|hukum|psikologi|business|science|finance|marketing/i.test(line)
    );
    if (majorLine && majorLine !== degreeLine && majorLine !== institution) major = majorLine;
  }

  return { institution_name: institution, degree: degreeLine, major };
}

function parseEducations(sectionLines) {
  const entries = splitIntoEntries(sectionLines);
  return entries
    .map((entryLines) => {
      const merged = entryLines.join(" | ");
      const date = parseDateRange(merged);
      const parts = inferEducationParts(entryLines);
      const descriptionLines = entryLines.filter(
        (line) =>
          line &&
          line !== parts.institution_name &&
          line !== parts.degree &&
          line !== parts.major &&
          !isMostlyDateLine(line)
      );
      const description = descriptionLines.join("\n").trim() || null;
      return {
        institution_name: parts.institution_name,
        degree: parts.degree,
        major: parts.major,
        start_date: date.start_date,
        end_date: date.end_date,
        is_current: date.is_current,
        description,
      };
    })
    .filter((item) => item.institution_name || item.degree);
}

function normalizeSkillToken(token) {
  return token
    .replace(/^[-•*]\s*/, "")
    .replace(/[,;:]+$/g, "")
    .replace(/^\s*[,;:]+\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeSkills(skills) {
  const seen = new Set();
  const out = [];
  for (const raw of skills) {
    const token = normalizeSkillToken(String(raw || ""));
    if (!token || token.length < 2 || token.length > 40) continue;
    if (SKILL_STOPWORDS.has(token.toLowerCase())) continue;
    if (/^\d+$/.test(token)) continue;
    const key = token.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(token);
  }
  return out.slice(0, 60);
}

function parseSkills(sectionLines, allLines) {
  const skills = [];
  const candidateLines = sectionLines.length ? sectionLines : allLines.slice(0, 80);

  for (const line of candidateLines) {
    const lower = line.toLowerCase();
    if (!sectionLines.length && !/skill|keahlian|teknologi|tools|framework|language|kompetensi|kemampuan|competenc|expertise|proficienc/i.test(lower)) {
      continue;
    }

    const splitTokens = line
      .split(/[,|;•·/]+/)
      .map(normalizeSkillToken)
      .filter((token) => token.length >= 2 && token.length <= 40);

    const nounTerms = nlp(line)
      .nouns()
      .out("array")
      .map(normalizeSkillToken)
      .filter((token) => token.length >= 2 && token.length <= 40);

    skills.push(...splitTokens, ...nounTerms);
  }

  return dedupeSkills(skills);
}

// ─── OUTPUT NORMALIZATION & QUALITY ──────────────────────────────────────────

function emptyToNull(value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeExperienceItem(item) {
  const start_date = emptyToNull(item?.start_date);
  const end_date = emptyToNull(item?.end_date);
  const description = emptyToNull(item?.description);
  const is_current = Boolean(item?.is_current) || PRESENT_RE.test(String(item?.end_date || ""));
  return {
    company_name: emptyToNull(item?.company_name),
    job_title: emptyToNull(item?.job_title),
    start_date,
    end_date: is_current ? null : end_date,
    is_current,
    description,
  };
}

function normalizeEducationItem(item) {
  const is_current = Boolean(item?.is_current) || PRESENT_RE.test(String(item?.end_date || ""));
  return {
    institution_name: emptyToNull(item?.institution_name),
    degree: emptyToNull(item?.degree),
    major: emptyToNull(item?.major),
    start_date: emptyToNull(item?.start_date),
    end_date: is_current ? null : emptyToNull(item?.end_date),
    is_current,
    description: emptyToNull(item?.description),
  };
}

function normalizeParsedResult(parsed, meta = {}) {
  const personal = parsed?.personal_info || {};
  const full_name = emptyToNull(personal.full_name);
  const email = emptyToNull(personal.email);
  const phone = emptyToNull(personal.phone) ? String(personal.phone).replace(/\s/g, "") : null;
  const location = emptyToNull(personal.location);
  const summary = emptyToNull(personal.summary);

  const personal_info = {
    full_name,
    email,
    phone,
    location,
    summary,
  };

  return {
    personal_info,
    // Flattened aliases expected by frontend profile CV parser UI
    name: full_name,
    email,
    phone,
    telephone: phone,
    address: location,
    summary,
    profile_summary: summary,
    work_experiences: Array.isArray(parsed?.work_experiences)
      ? parsed.work_experiences.map(normalizeExperienceItem).filter((i) => i.company_name || i.job_title || i.description)
      : [],
    educations: Array.isArray(parsed?.educations)
      ? parsed.educations.map(normalizeEducationItem).filter((i) => i.institution_name || i.degree || i.description)
      : [],
    skills: dedupeSkills(Array.isArray(parsed?.skills) ? parsed.skills : []),
    _meta: { ...(parsed?._meta || {}), ...meta },
  };
}

function scoreParsedResult(parsed) {
  if (!parsed) return 0;
  let score = 0;
  const p = parsed.personal_info || {};
  if (p.full_name) score += 2;
  if (p.email) score += 2;
  if (p.phone) score += 1;
  if (p.location) score += 1;
  score += Math.min((parsed.work_experiences || []).length, 3) * 2;
  score += Math.min((parsed.educations || []).length, 2) * 2;
  score += Math.min((parsed.skills || []).length, 5) * 0.5;
  return score;
}

function isThinParsedResult(parsed) {
  const score = scoreParsedResult(parsed);
  const hasIdentity = Boolean(parsed?.personal_info?.full_name || parsed?.personal_info?.email);
  const hasHistory = (parsed?.work_experiences || []).length + (parsed?.educations || []).length > 0;
  return score < 3 || (!hasIdentity && !hasHistory);
}

function parseWithNlpFallback(rawText) {
  const lines = rawText.split("\n");
  const normalizedLines = normalizeLines(rawText);
  const sections = detectSections(normalizedLines);

  return normalizeParsedResult(
    {
      personal_info: {
        ...extractPersonalInfo(normalizedLines),
        summary:
          getSectionLines(normalizedLines, sections, "summary").join(" ").trim() ||
          null,
      },
      work_experiences: parseWorkExperiences(getSectionLines(normalizedLines, sections, "experience")),
      educations: parseEducations(getSectionLines(normalizedLines, sections, "education")),
      skills: parseSkills(getSectionLines(normalizedLines, sections, "skills"), normalizedLines),
    },
    {
      parser: "nlp_fallback",
      sections_detected: Object.keys(sections),
      raw_char_count: rawText.length,
      line_count: lines.length,
    }
  );
}

// ─── MAIN PARSE FUNCTION ─────────────────────────────────────────────────────

async function parseCV(filePath, mimetype) {
  const resolvedMime = resolveCvMimetype(filePath, mimetype);
  const {
    text: rawText,
    method: extractionMethod,
    warnings: extractWarnings = [],
  } = await extractText(filePath, resolvedMime);
  const extractionMeta = {
    extraction_method: extractionMethod,
    raw_char_count: rawText.length,
    mimetype: resolvedMime,
  };
  if (extractWarnings.length) {
    extractionMeta.python_warnings = extractWarnings;
  }

  // Prefer local Python parser when enabled (more accurate + avoids Gemini 429).
  // Only inject extracted text for OCR scans — digital PDFs/DOCX are richer when
  // Python reads the original file (pdfplumber/docx2txt) itself.
  if (isPythonResumeParserEnabled()) {
    try {
      const pythonOptions =
        extractionMethod === "digital" ? {} : { text: rawText };
      const parsed = await parseWithPythonResumeParser(filePath, pythonOptions);
      const pythonMeta = parsed._python_meta || {};
      delete parsed._python_meta;
      const normalized = normalizeParsedResult(parsed, {
        parser: pythonMeta.parser || "python_resume_parser",
        python_engine: pythonMeta.engine || null,
        python_package_error: pythonMeta.package_error || null,
        document_type: pythonMeta.document_type || null,
        ...extractionMeta,
      });
      // Cover letters are intentionally thin (contact only) — do not fall through to NLP.
      if (pythonMeta.document_type === "cover_letter") return normalized;
      if (!isThinParsedResult(normalized)) return normalized;
      console.warn("Python resume parser returned thin result; continuing fallbacks");
      extractionMeta.python_thin_result = true;
    } catch (err) {
      console.warn("Python resume parser failed; continuing fallbacks:", err.message);
      extractionMeta.python_error = serializePythonError(err);
      if (isPythonStrict()) {
        throw err;
      }
    }
  }

  if (isAIParsingEnabled()) {
    try {
      const parsed = normalizeParsedResult(await parseWithAI(rawText), {
        parser: "ai",
        ...extractionMeta,
      });
      // Don't trust empty/near-empty AI payloads (rate-limit soft failures, truncated JSON, etc.)
      if (!isThinParsedResult(parsed)) return parsed;
      console.warn("CV AI parsing returned thin result; using heuristic fallback");
    } catch (err) {
      // A provider failure must not prevent the user from reviewing local output.
      const status = err?.response?.status;
      if (status === 429) {
        console.warn("CV AI rate-limited (429); using heuristic fallback");
      } else {
        console.warn("CV AI parsing failed; using heuristic fallback:", err.message);
      }
    }
  }

  if (isResumeParserEnabled()) {
    try {
      const parsed = await parseWithResumeParser(filePath);
      const normalized = normalizeParsedResult(parsed, {
        parser: "resume_parser_fallback",
        ...extractionMeta,
      });
      if (!isThinParsedResult(normalized)) return normalized;
    } catch (err) {
      // resume-parser depends on host binaries (e.g. pdftotext/catdoc), so fallback is expected on some hosts.
      console.warn("resume-parser failed; using NLP fallback:", err.message);
    }
  }

  let structuredResult = null;
  // Layout parsers need a real digital text layer; skip for OCR-only scans.
  const tryStructured =
    extractionMethod === "digital" &&
    ((resolvedMime === "application/pdf" && isOpenResumeStyleEnabled()) ||
      (isDocxMimetype(resolvedMime) && isOpenResumeStyleEnabled()));

  if (tryStructured) {
    try {
      if (resolvedMime === "application/pdf") {
        structuredResult = normalizeParsedResult(await parseWithOpenResumeStyle(filePath), extractionMeta);
      } else {
        structuredResult = normalizeParsedResult(await parseWithDocxStyle(filePath), extractionMeta);
      }
      if (!isThinParsedResult(structuredResult)) return structuredResult;
      console.warn(
        `${structuredResult._meta?.parser || "structured"} parser produced thin result; trying NLP fallback`
      );
    } catch (err) {
      console.warn("Structured parser failed; using NLP fallback:", err.message);
    }
  }

  const nlpResult = parseWithNlpFallback(rawText);
  nlpResult._meta = { ...nlpResult._meta, ...extractionMeta };

  if (structuredResult && scoreParsedResult(structuredResult) > scoreParsedResult(nlpResult)) {
    return {
      ...structuredResult,
      _meta: {
        ...structuredResult._meta,
        fallback_compared: "nlp_fallback",
        ...extractionMeta,
      },
    };
  }

  if (structuredResult) {
    return {
      ...nlpResult,
      _meta: {
        ...nlpResult._meta,
        structured_score: scoreParsedResult(structuredResult),
        preferred_over: structuredResult._meta?.parser || "structured",
        ...extractionMeta,
      },
    };
  }

  return nlpResult;
}

module.exports = {
  parseCV,
  parseWithAI,
  parseWithOpenResumeStyle,
  parseWithDocxStyle,
  parseWithResumeParser,
  parseWithPythonResumeParser,
  parseWithNlpFallback,
  isAIParsingEnabled,
  isOpenResumeStyleEnabled,
  isResumeParserEnabled,
  isPythonResumeParserEnabled,
  isDocxMimetype,
  scoreParsedResult,
  isThinParsedResult,
  normalizeParsedResult,
  htmlToStructuredLines,
  htmlToPlainText,
  // Shared helpers for GPT CV modules / matching CV reader
  scrubExtractedText,
  resolveCvMimetype,
  extractDocxText,
};
