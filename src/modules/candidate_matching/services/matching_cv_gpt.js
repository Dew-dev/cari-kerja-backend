/**
 * GPT-assisted CV reader for hybrid candidate matching.
 * Reads the application resume (text or rendered PDF pages) and returns:
 *  - cv_fit_score (0–100) vs the job posting
 *  - structured signals (skills, titles, years, locations) to enrich rule-based scorers
 *
 * Graceful: if OpenAI is disabled / no resume / parse fails → { skipped: true }.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const config = require("../../../config/global_config");
const logger = require("../../../helpers/utils/logger");
const {
  isCvParserEnabled,
  createCvExtraction,
} = require("../../cv-parsing/providers/openai_responses_adapter");
const { isThinExtractedText, renderPdfPagesToPng } = require("../../cv-parsing/services/cv_ocr");
const {
  extractTextWithPython,
  isPythonStrict,
} = require("../../cv-parsing/services/cv_python_parser");
const cvParser = require("../../cv-parsing/services/cv_parser");
const { MATCHING_CV_FIT_SCHEMA } = require("../schemas/matching_cv_fit.schema");

const ctx = "Matching-CvGpt";

const SYSTEM_PROMPT = fs.readFileSync(
  path.join(__dirname, "../prompts/matching-cv-fit-system.md"),
  "utf8",
);

const getUploadsRoot = () =>
  process.env.UPLOADS_PATH
    ? path.resolve(process.env.UPLOADS_PATH)
    : path.join(__dirname, "../../../uploads");

const isCvGptMatchingEnabled = () => {
  const matching = config.get("/matching") || {};
  if (matching.cvGptEnabled === false) return false;
  return isCvParserEnabled();
};

/**
 * Resolve /uploads/... URL to a disk path under UPLOADS_PATH.
 */
const resolveResumeDiskPath = (resumeUrl) => {
  const raw = String(resumeUrl || "").trim();
  if (!raw) return null;
  if (path.isAbsolute(raw) && fs.existsSync(raw)) return raw;

  const cleaned = raw.replace(/^\/+/, "").replace(/^uploads\//i, "");
  const full = path.join(getUploadsRoot(), cleaned);
  return full;
};

const uniqueStrings = (items = []) => {
  const out = [];
  const seen = new Set();
  for (const item of items) {
    const v = String(item || "").trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
};

const isThinDigitalText = (text) => {
  const t = String(text || "").replace(/\u00a0/g, " ").trim();
  if (!t) return true;
  const min = Number(process.env.CV_PARSER_MIN_TEXT_CHARS || 80);
  if (min > 0) return t.length < min;
  return isThinExtractedText(t);
};

async function extractDigitalText(filePath, mimetype) {
  const resolvedMime = cvParser.resolveCvMimetype(filePath, mimetype);
  if (resolvedMime === "application/pdf") {
    try {
      const text = cvParser.scrubExtractedText(await extractTextWithPython(filePath));
      return { text, method: "digital", mimetype: resolvedMime };
    } catch (err) {
      if (isPythonStrict()) throw err;
      const { PDFParse } = require("pdf-parse");
      const buffer = fs.readFileSync(filePath);
      const parser = new PDFParse({ data: buffer });
      const data = await parser.getText();
      return {
        text: cvParser.scrubExtractedText(data.text || ""),
        method: "digital_pdf_parse",
        mimetype: resolvedMime,
      };
    }
  }
  if (cvParser.isDocxMimetype(resolvedMime)) {
    const text = cvParser.scrubExtractedText(await cvParser.extractDocxText(filePath));
    return { text, method: "digital_docx", mimetype: resolvedMime };
  }
  throw Object.assign(new Error("Unsupported resume type"), { code: "CV_UNSUPPORTED" });
}

const buildJobBlock = (job = {}) => {
  const parts = [
    `Job title: ${job.title || ""}`,
    job.experience_level_name ? `Experience level: ${job.experience_level_name}` : null,
    job.location || job.city || job.province
      ? `Location: ${[job.location, job.city, job.province].filter(Boolean).join(", ")}`
      : null,
    job.salary_min != null || job.salary_max != null
      ? `Salary range: ${job.salary_min ?? "?"} - ${job.salary_max ?? "?"}`
      : null,
    Array.isArray(job.skill_names) && job.skill_names.length
      ? `Required skills: ${job.skill_names.join(", ")}`
      : null,
    Array.isArray(job.requirements) && job.requirements.length
      ? `Requirements:\n- ${job.requirements.slice(0, 12).join("\n- ")}`
      : null,
    job.description ? `Description:\n${String(job.description).slice(0, 6000)}` : null,
  ];
  return parts.filter(Boolean).join("\n\n");
};

const clampFit = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
};

/**
 * @param {object} params
 * @param {string} [params.resumeUrl]
 * @param {object} params.jobSrc
 * @returns {Promise<object>}
 */
async function readCvForMatching({ resumeUrl, jobSrc }) {
  if (!isCvGptMatchingEnabled()) {
    return { skipped: true, reason: "cv_gpt_disabled" };
  }
  if (!resumeUrl) {
    return { skipped: true, reason: "no_resume" };
  }

  const diskPath = resolveResumeDiskPath(resumeUrl);
  if (!diskPath || !fs.existsSync(diskPath)) {
    logger.warn(ctx, "readCvForMatching", "resume file missing", resumeUrl);
    return { skipped: true, reason: "resume_file_missing", resume_url: resumeUrl };
  }

  try {
    const extracted = await extractDigitalText(diskPath, path.extname(diskPath));
    let mode = "text";
    let images;
    let cvPayload = extracted.text;

    if (extracted.mimetype === "application/pdf" && isThinDigitalText(extracted.text)) {
      const maxPages = Number(process.env.CV_PDF_RENDER_MAX_PAGES || 5);
      images = await renderPdfPagesToPng(diskPath, maxPages > 0 ? maxPages : undefined);
      if (!images || images.length === 0) {
        return { skipped: true, reason: "empty_cv", resume_url: resumeUrl };
      }
      mode = "image";
      cvPayload = `(CV provided as ${images.length} page image(s); no reliable digital text.)`;
    } else if (!extracted.text || !extracted.text.trim()) {
      return { skipped: true, reason: "empty_cv", resume_url: resumeUrl };
    }

    const jobBlock = buildJobBlock(jobSrc || {});
    const userContent = [
      {
        type: "input_text",
        text:
          "Compare this candidate CV to the job posting and fill the JSON schema.\n\n" +
          "=== JOB POSTING ===\n" +
          jobBlock +
          "\n\n=== CANDIDATE CV ===\n" +
          (mode === "text" ? String(cvPayload).slice(0, 20000) : cvPayload),
      },
    ];

    const result = await createCvExtraction({
      systemPrompt: SYSTEM_PROMPT,
      userContent,
      images: mode === "image" ? images : undefined,
      schema: MATCHING_CV_FIT_SCHEMA,
      metadata: {
        prompt_id: "matching-cv-fit",
        prompt_version: "1.0.0",
      },
    });

    const parsed = result.parsed || {};
    const yearsRaw = Number(parsed.years_experience_estimate);
    const years =
      Number.isFinite(yearsRaw) && yearsRaw >= 0 ? Math.round(yearsRaw * 10) / 10 : null;

    return {
      skipped: false,
      provider: "gpt",
      input_mode: mode,
      extraction_method: extracted.method,
      resume_url: resumeUrl,
      cv_fit_score: clampFit(parsed.cv_fit_score),
      skills_from_cv: uniqueStrings(parsed.skills_from_cv || []),
      job_titles_from_cv: uniqueStrings(parsed.job_titles_from_cv || []),
      years_experience_estimate: years,
      location_hints: uniqueStrings(parsed.location_hints || []),
      fit_reasons: (parsed.fit_reasons || []).map(String).slice(0, 4),
      profile_summary: String(parsed.profile_summary || "").slice(0, 1000),
      model: result.model || null,
      usage: result.usage || null,
      cost: result.cost || null,
      attempts: result.attempts || 1,
    };
  } catch (err) {
    logger.error(ctx, "readCvForMatching failed", resumeUrl, err.message || err);
    return {
      skipped: true,
      reason: "gpt_error",
      error_code: err.code || "AI_ERROR",
      resume_url: resumeUrl,
    };
  }
}

/**
 * Merge profile DB signals with GPT CV signals for rule scorers.
 */
const enrichWorkerSignals = (workerSrc = {}, cvSignals = {}) => {
  if (!cvSignals || cvSignals.skipped) {
    return {
      skill_names: workerSrc.skill_names || [],
      work_experiences: workerSrc.work_experiences || [],
      address: workerSrc.address || "",
      profile_summary: workerSrc.profile_summary || "",
      total_years_override: null,
      educations: workerSrc.educations || [],
    };
  }

  const skill_names = uniqueStrings([
    ...(workerSrc.skill_names || []),
    ...(cvSignals.skills_from_cv || []),
  ]);

  const fromCvTitles = (cvSignals.job_titles_from_cv || []).map((title) => ({
    job_title: title,
    company_name: null,
    description: "from_cv",
  }));

  const work_experiences = [...(workerSrc.work_experiences || []), ...fromCvTitles];

  const address =
    String(workerSrc.address || "").trim() ||
    (cvSignals.location_hints || []).join(", ") ||
    "";

  const profile_summary = [
    workerSrc.profile_summary,
    cvSignals.profile_summary,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    skill_names,
    work_experiences,
    address,
    profile_summary,
    total_years_override:
      cvSignals.years_experience_estimate != null
        ? cvSignals.years_experience_estimate
        : null,
    educations: workerSrc.educations || [],
  };
};

module.exports = {
  isCvGptMatchingEnabled,
  resolveResumeDiskPath,
  readCvForMatching,
  enrichWorkerSignals,
  uniqueStrings,
  buildJobBlock,
};
