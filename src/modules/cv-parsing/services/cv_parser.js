const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");
const axios = require("axios");
const nlp = require("compromise");
const chrono = require("chrono-node");
const fs = require("fs");
const os = require("os");
const path = require("path");

const AI_PARSER_URL = process.env.CV_PARSER_AI_URL;
const AI_PARSER_API_KEY = process.env.CV_PARSER_AI_KEY;
const AI_PARSER_MODEL = process.env.CV_PARSER_AI_MODEL || "gpt-4o-mini";
const ENABLE_RESUME_PARSER = process.env.CV_USE_RESUME_PARSER === "true";
const ENABLE_OPENRESUME_STYLE = process.env.CV_USE_OPENRESUME_STYLE !== "false";

let resumeParserInternal = null;
try {
  // Package API is broken in v1.1.0; we use internal parseIt.parseResumeFile directly.
  resumeParserInternal = require("resume-parser/src/utils/parseIt");
} catch {
  resumeParserInternal = null;
}

// ─── TEXT EXTRACTION ─────────────────────────────────────────────────────────

async function extractText(filePath, mimetype) {
  if (mimetype === "application/pdf") {
    const parser = new PDFParse({ url: filePath });
    const data = await parser.getText();
    return data.text;
  }

  if (
    mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimetype === "application/msword"
  ) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  throw new Error("Unsupported file type. Only PDF and DOCX are allowed.");
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
        required: ["full_name", "email", "phone", "location"],
        properties: {
          full_name: { type: ["string", "null"] },
          email: { type: ["string", "null"] },
          phone: { type: ["string", "null"] },
          location: { type: ["string", "null"] },
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
  return Boolean(AI_PARSER_URL && AI_PARSER_API_KEY);
}

function isResumeParserEnabled() {
  return Boolean(ENABLE_RESUME_PARSER && resumeParserInternal);
}

function isOpenResumeStyleEnabled() {
  return ENABLE_OPENRESUME_STYLE;
}

async function parseWithAI(rawText) {
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
    resumeParserInternal.parseResumeFile(filePath, outputDir, (name, error) => {
      if (error) return reject(error);
      return resolve(name);
    });
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
  return /skills?|keahlian|kompetensi|tools|technologies/i.test(text);
}

function hasExperienceHeading(text) {
  return /experience|employment|riwayat pekerjaan|pengalaman/i.test(text);
}

function hasEducationHeading(text) {
  return /education|pendidikan|academic/i.test(text);
}

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
    const headingCandidate = textLooksLikeHeading(line.text) && (line.isBold || line.text === line.text.toUpperCase());
    if (headingCandidate) {
      const heading = line.text.toLowerCase();
      if (hasExperienceHeading(heading)) current = "experience";
      else if (hasEducationHeading(heading)) current = "education";
      else if (hasSkillHeading(heading)) current = "skills";
      else current = heading.replace(/[^a-z0-9]+/g, "_");

      if (!sections[current]) sections[current] = [];
      continue;
    }

    if (!sections[current]) sections[current] = [];
    sections[current].push(line);
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

const BULLET_POINTS = ["•", "●", "○", "-", "*"];

function getDescriptionsLineIdx(lines) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].items.some((item) => BULLET_POINTS.some((bullet) => (item.text || "").includes(bullet)))) {
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
  let text = lines.map((line) => line.text || "").join(" ").replace(/\s+/g, " ").trim();
  const firstIdx = BULLET_POINTS.map((b) => text.indexOf(b)).filter((v) => v >= 0).sort((a, b) => a - b)[0];
  if (firstIdx === undefined) return lines.map((line) => line.text).filter(Boolean);
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

function extractProfileFromSections(sections) {
  const lines = sections.profile || [];
  const items = lines.flatMap((line) => line.items || []);

  const matchName = (i) => (i.text || "").match(/^[a-zA-Z\s\.]+$/);
  const matchEmail = (i) => (i.text || "").match(/\S+@\S+\.\S+/);
  const matchPhone = (i) => (i.text || "").match(/\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/);
  const matchLocation = (i) => (i.text || "").match(/[A-Z][a-zA-Z\s]+, [A-Z]{2}/);
  const matchUrl = (i) => (i.text || "").match(/\S+\.[a-z]+\/\S+/i);

  const hasAt = (i) => (i.text || "").includes("@");
  const hasNumber = (i) => /\d/.test(i.text || "");
  const hasParen = (i) => /\([0-9]+\)/.test(i.text || "");
  const hasComma = (i) => (i.text || "").includes(",");
  const hasSlash = (i) => (i.text || "").includes("/");
  const has4Words = (i) => (i.text || "").split(/\s+/).length >= 4;

  const name = getTextWithHighestFeatureScore(items, [
    [matchName, 3, true],
    [(i) => i.isBold, 2],
    [(i) => hasLetterAndIsAllUpperCase(i.text || ""), 2],
    [hasAt, -4],
    [hasNumber, -4],
    [hasParen, -4],
    [hasComma, -4],
    [hasSlash, -4],
    [has4Words, -2],
  ]);

  const email = getTextWithHighestFeatureScore(items, [[matchEmail, 4, true]], true);
  const phone = getTextWithHighestFeatureScore(items, [[matchPhone, 4, true]], true);
  const location = getTextWithHighestFeatureScore(items, [[matchLocation, 4, true]], true);
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
  const lines = getSectionLinesByKeywords(sections, ["work", "experience", "employment", "history", "job"]);
  const subsections = divideSectionIntoSubsections(lines);
  const items = [];

  for (const subsection of subsections) {
    const descIdx = getDescriptionsLineIdx(subsection);
    const infoLines = subsection.slice(0, descIdx === undefined ? 2 : descIdx);
    const infoItems = infoLines.flatMap((line) => line.items);
    const descriptions = getBulletPointsFromLines(subsection.slice(descIdx === undefined ? 2 : descIdx));

    const date = getTextWithHighestFeatureScore(infoItems, [[(i) => /(?:19|20)\d{2}|present|current/i.test(i.text || ""), 2]], true);
    const jobTitle = getTextWithHighestFeatureScore(infoItems, [[(i) => JOB_TITLE_KEYWORDS.some((k) => (i.text || "").toLowerCase().includes(k)), 4]], true);
    const company = getTextWithHighestFeatureScore(infoItems, [
      [(i) => i.isBold, 2],
      [(i) => (date ? (i.text || "").includes(date) : false), -4],
      [(i) => (jobTitle ? (i.text || "").includes(jobTitle) : false), -4],
    ], true);

    const dateParts = parseDateRange(date || infoLines.map((l) => l.text).join(" | "));
    items.push({
      company_name: company || null,
      job_title: jobTitle || null,
      start_date: dateParts.start_date,
      end_date: dateParts.end_date,
      is_current: dateParts.is_current,
      description: descriptions.join("\n") || null,
    });
  }

  return items.filter((item) => item.company_name || item.job_title || item.description);
}

function extractEducationFromSections(sections) {
  const lines = getSectionLinesByKeywords(sections, ["education", "course", "academic"]);
  const subsections = divideSectionIntoSubsections(lines);
  const out = [];

  for (const subsection of subsections) {
    const textItems = subsection.flatMap((line) => line.items);
    const institution = getTextWithHighestFeatureScore(textItems, [[(i) => /college|university|institute|school|academy|politeknik|universitas/i.test(i.text || ""), 4]], true);
    const degree = getTextWithHighestFeatureScore(textItems, [[(i) => DEGREE_HINT_RE.test(i.text || ""), 4]], true);
    const major = getTextWithHighestFeatureScore(textItems, [[(i) => /major|jurusan|informatika|computer|engineering|account|management|design/i.test(i.text || ""), 3]], true);
    const dateText = getTextWithHighestFeatureScore(textItems, [[(i) => /(?:19|20)\d{2}|present|current/i.test(i.text || ""), 2]], true);
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
  const lines = getSectionLinesByKeywords(sections, ["skill"]);
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

  return Array.from(new Set([...fromFeatured, ...fromDescriptions]));
}

async function readPdfTextItems(filePath) {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
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
    },
    work_experiences: workExperiences,
    educations,
    skills,
    _meta: {
      parser: "openresume_style",
      raw_char_count: lines.map((l) => l.text).join(" ").length,
      text_item_count: textItems.length,
      line_count: lines.length,
      sections_detected: Object.keys(sections),
    },
  };
}

// ─── NLP FALLBACK PARSER ─────────────────────────────────────────────────────

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(\+?62|0)[\s.-]?\d[\d\s.-]{7,14}/;
const PRESENT_RE = /(present|current|now|sekarang|saat\s+ini)/i;
const COMPANY_HINT_RE = /\b(pt\.?|cv\.?|inc\.?|llc|ltd\.?|corp\.?|company|co\.?|startup|bank|group|universitas|university|institute|institut|school|sekolah|politeknik)\b/i;
const DEGREE_HINT_RE = /\b(sma|smk|d1|d2|d3|d4|s1|s2|s3|bachelor|master|phd|sarjana|magister|doktor|diploma)\b/i;

const SECTION_KEYWORDS = {
  experience: [
    "pengalaman",
    "riwayat pekerjaan",
    "work experience",
    "employment history",
    "career history",
    "experience",
    "karir",
    "pekerjaan",
  ],
  education: [
    "pendidikan",
    "riwayat pendidikan",
    "education",
    "academic",
    "akademik",
  ],
  skills: ["skills", "skill", "keahlian", "kompetensi", "technical skills", "kemampuan"],
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
  "officer",
  "consultant",
  "programmer",
  "administrator",
  "architect",
  "qa",
  "devops",
  "backend",
  "frontend",
  "fullstack",
  "product",
  "marketing",
  "sales",
  "hr",
  "recruiter",
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
  "project",
  "projects",
  "team",
  "experience",
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

function parseDateRange(text) {
  const parsed = chrono.parse(text);
  if (parsed.length === 0) {
    return { start_date: null, end_date: null, is_current: PRESENT_RE.test(text) };
  }

  const start = parsed[0]?.start?.date();
  const end = parsed[0]?.end?.date() || parsed[1]?.start?.date() || null;
  const is_current = PRESENT_RE.test(text);

  return {
    start_date: start ? formatDate(start) : null,
    end_date: is_current ? null : end ? formatDate(end) : null,
    is_current,
  };
}

function extractPersonalInfo(lines) {
  const topLines = lines.slice(0, 12).filter(Boolean);
  const topText = topLines.join("\n");
  const personCandidates = nlp(topText).people().out("array");
  const placeCandidates = nlp(topText).places().out("array");

  const info = { full_name: null, email: null, phone: null, location: null };

  const bestName = personCandidates.find((name) => name.split(" ").length <= 4 && name.length <= 60);
  if (bestName) info.full_name = bestName;

  if (!info.full_name) {
    const fallback = topLines.find((line) => {
      if (EMAIL_RE.test(line) || PHONE_RE.test(line)) return false;
      if (/[:|/]/.test(line)) return false;
      if (/\d/.test(line)) return false;
      return line.length >= 3 && line.length <= 50;
    });
    info.full_name = fallback || null;
  }

  const emailMatch = topText.match(EMAIL_RE);
  if (emailMatch) info.email = emailMatch[0];

  const phoneMatch = topText.match(PHONE_RE);
  if (phoneMatch) info.phone = phoneMatch[0].replace(/\s/g, "");

  if (placeCandidates.length) info.location = placeCandidates[0];

  return info;
}

function isLikelyEntryStart(line) {
  if (!line) return false;
  const hasDate = chrono.parse(line).length > 0;
  const isHeadingish = line.length <= 80 && !/[.;]{2,}/.test(line);
  return hasDate || isHeadingish;
}

function splitIntoEntries(sectionLines) {
  const entries = [];
  let current = [];

  for (const line of sectionLines) {
    if (!line) continue;
    const lineHasDate = chrono.parse(line).length > 0 || PRESENT_RE.test(line);
    const shouldSplit =
      current.length > 0 &&
      (lineHasDate || (isLikelyEntryStart(line) && current.some((item) => chrono.parse(item).length > 0)));

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
    const lower = line.toLowerCase();
    if (JOB_TITLE_KEYWORDS.some((keyword) => lower.includes(keyword))) return line;
  }
  return lines[0] || null;
}

function inferCompany(lines) {
  const text = lines.join("\n");
  const orgs = nlp(text).organizations().out("array");
  if (orgs.length) return orgs[0];
  const hinted = lines.find((line) => COMPANY_HINT_RE.test(line));
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
      const description = entryLines.slice(2).join("\n").trim() || null;
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
  const institution = orgs.find((org) => /universitas|university|institut|institute|school|sekolah|politeknik/i.test(org)) || orgs[0] || null;
  const degreeLine = lines.find((line) => DEGREE_HINT_RE.test(line)) || null;

  let major = null;
  if (degreeLine) {
    const match = degreeLine.match(/(?:-|–|—|in|jurusan|major)\s*(.+)$/i);
    if (match) major = match[1].trim();
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
      const description = entryLines.slice(2).join("\n").trim() || null;
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
    .replace(/\s+/g, " ")
    .trim();
}

function parseSkills(sectionLines, allLines) {
  const skills = new Set();
  const candidateLines = sectionLines.length ? sectionLines : allLines.slice(0, 80);

  for (const line of candidateLines) {
    const lower = line.toLowerCase();
    if (!sectionLines.length && !/skill|keahlian|teknologi|tools|framework|language/i.test(lower)) {
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

    for (const token of [...splitTokens, ...nounTerms]) {
      if (SKILL_STOPWORDS.has(token.toLowerCase())) continue;
      if (/^\d+$/.test(token)) continue;
      skills.add(token);
    }
  }

  return [...skills].slice(0, 60);
}

// ─── MAIN PARSE FUNCTION ─────────────────────────────────────────────────────

async function parseCV(filePath, mimetype) {
  const rawText = await extractText(filePath, mimetype);
  if (isAIParsingEnabled()) {
    try {
      const parsed = await parseWithAI(rawText);
      return {
        ...parsed,
        _meta: {
          parser: "ai",
          raw_char_count: rawText.length,
        },
      };
    } catch (err) {
      // A provider failure must not prevent the user from reviewing local output.
      console.warn("CV AI parsing failed; using heuristic fallback:", err.message);
    }
  }

  if (isResumeParserEnabled()) {
    try {
      const parsed = await parseWithResumeParser(filePath);
      return {
        ...parsed,
        _meta: {
          parser: "resume_parser_fallback",
          raw_char_count: rawText.length,
        },
      };
    } catch (err) {
      // resume-parser depends on host binaries (e.g. pdftotext/catdoc), so fallback is expected on some hosts.
      console.warn("resume-parser failed; using NLP fallback:", err.message);
    }
  }

  if (mimetype === "application/pdf" && isOpenResumeStyleEnabled()) {
    try {
      return await parseWithOpenResumeStyle(filePath);
    } catch (err) {
      console.warn("OpenResume-style parser failed; using NLP fallback:", err.message);
    }
  }

  const lines = rawText.split("\n");
  const normalizedLines = normalizeLines(rawText);

  const sections = detectSections(normalizedLines);

  const personalInfo = extractPersonalInfo(normalizedLines);
  const workExperiences = parseWorkExperiences(getSectionLines(normalizedLines, sections, "experience"));
  const educations = parseEducations(getSectionLines(normalizedLines, sections, "education"));
  const skills = parseSkills(getSectionLines(normalizedLines, sections, "skills"), normalizedLines);

  return {
    personal_info: personalInfo,
    work_experiences: workExperiences,
    educations,
    skills,
    _meta: {
      parser: "nlp_fallback",
      sections_detected: Object.keys(sections),
      raw_char_count: rawText.length,
      line_count: lines.length,
    },
  };
}

module.exports = {
  parseCV,
  parseWithAI,
  parseWithOpenResumeStyle,
  parseWithResumeParser,
  isAIParsingEnabled,
  isOpenResumeStyleEnabled,
  isResumeParserEnabled,
};
