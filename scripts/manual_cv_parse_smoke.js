/**
 * Manual end-to-end smoke for GPT-5 mini CV parser against CV-Test/*.
 * Does NOT log API keys, raw CV text, or base64 images.
 *
 * Usage: node scripts/manual_cv_parse_smoke.js
 * Exit 0 = all pass; non-zero = one or more acceptance failures.
 */

"use strict";

require("dotenv").config();

const fs = require("fs");
const path = require("path");

const { parseCV } = require("../src/modules/cv-parsing/services/cv_parser");

const CV_TEST_DIR = path.join(__dirname, "..", "CV-Test");
const PER_FILE_TIMEOUT_MS = Number(process.env.CV_SMOKE_TIMEOUT_MS || 180000);

const MIME_BY_EXT = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
};

function listCvFiles() {
  if (!fs.existsSync(CV_TEST_DIR)) {
    throw new Error(`CV-Test dir missing: ${CV_TEST_DIR}`);
  }
  return fs
    .readdirSync(CV_TEST_DIR)
    .filter((name) => MIME_BY_EXT[path.extname(name).toLowerCase()])
    .map((name) => path.join(CV_TEST_DIR, name))
    .sort();
}

function inferExpectedMode(filePath) {
  const base = path.basename(filePath).toLowerCase();
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".docx" || ext === ".doc") return "text";
  if (base.includes("image") || base.includes("scan") || base.includes("ocr")) {
    return "image";
  }
  return "text";
}

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`Timeout after ${ms}ms: ${label}`);
      err.code = "SMOKE_TIMEOUT";
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function acceptCase(filePath, result, err) {
  const expectedMode = inferExpectedMode(filePath);
  const fails = [];

  if (err) {
    fails.push(`threw: ${err.code || err.message}`);
    return { ok: false, fails, expectedMode };
  }

  const meta = (result && result._meta) || {};
  const pi = (result && result.personal_info) || {};
  const name = String(pi.full_name || result.name || "").trim();
  const email = String(pi.email || result.email || "").trim();
  const phone = String(pi.phone || pi.telephone || result.telephone || "").trim();
  const work = Array.isArray(result.work_experiences) ? result.work_experiences : [];
  const edu = Array.isArray(result.educations) ? result.educations : [];
  const skills = Array.isArray(result.skills) ? result.skills : [];

  if (meta.parser !== "gpt-5-mini") {
    fails.push(`parser=${meta.parser || "missing"} (want gpt-5-mini)`);
  }
  if (!name || name.length <= 2) {
    fails.push(`name missing/short (${JSON.stringify(name)})`);
  }
  if (!email && !phone && work.length < 1 && edu.length < 1) {
    fails.push("no email/phone/work/edu structure");
  }
  if (!meta.cost || typeof meta.cost.total_usd !== "number" || meta.cost.total_usd < 0) {
    fails.push("cost.total_usd missing/invalid");
  }
  if (
    !meta.usage ||
    (typeof meta.usage.input_tokens !== "number" &&
      typeof meta.usage.output_tokens !== "number")
  ) {
    fails.push("usage tokens missing");
  }
  if (!result.personal_info || typeof result.personal_info !== "object") {
    fails.push("personal_info missing");
  }
  if (!Array.isArray(result.work_experiences)) fails.push("work_experiences missing");
  if (!Array.isArray(result.educations)) fails.push("educations missing");
  if (!Array.isArray(result.skills)) fails.push("skills missing");

  if (expectedMode === "image") {
    const imageOk =
      meta.input_mode === "image" || meta.extraction_method === "pdf_page_images";
    if (!imageOk) {
      fails.push(
        `expected image path, got mode=${meta.input_mode} method=${meta.extraction_method}`
      );
    }
  } else {
    const textOk = meta.input_mode === "text" || meta.extraction_method === "digital";
    if (!textOk) {
      fails.push(
        `expected text path, got mode=${meta.input_mode} method=${meta.extraction_method}`
      );
    }
  }

  return {
    ok: fails.length === 0,
    fails,
    expectedMode,
    summary: {
      filename: path.basename(filePath),
      parser: meta.parser,
      input_mode: meta.input_mode,
      extraction_method: meta.extraction_method,
      full_name: name || null,
      email: email || null,
      work: work.length,
      edu: edu.length,
      skills: skills.length,
      total_usd: meta.cost && meta.cost.total_usd,
      usage: meta.usage,
      attempts: meta.attempts,
    },
  };
}

async function runOne(filePath) {
  const mime = MIME_BY_EXT[path.extname(filePath).toLowerCase()];
  const started = Date.now();
  let result = null;
  let err = null;
  try {
    result = await withTimeout(parseCV(filePath, mime), PER_FILE_TIMEOUT_MS, path.basename(filePath));
  } catch (e) {
    err = e;
  }
  const latency_ms = Date.now() - started;
  const verdict = acceptCase(filePath, result, err);
  return { ...verdict, latency_ms, error: err ? String(err.message || err).slice(0, 200) : null };
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("BLOCKED: OPENAI_API_KEY missing");
    process.exit(2);
  }

  const files = listCvFiles();
  console.log(`CV-Test files: ${files.map((f) => path.basename(f)).join(", ")}`);
  console.log(`Per-file timeout: ${PER_FILE_TIMEOUT_MS}ms`);
  console.log("---");

  const rows = [];
  let totalUsd = 0;
  let failed = 0;

  for (const file of files) {
    process.stdout.write(`Parsing ${path.basename(file)} ... `);
    const row = await runOne(file);
    rows.push(row);
    if (row.summary && typeof row.summary.total_usd === "number") {
      totalUsd += row.summary.total_usd;
    }
    if (!row.ok) {
      failed += 1;
      console.log("FAIL");
      console.log(JSON.stringify({ ...row.summary, latency_ms: row.latency_ms, fails: row.fails, error: row.error }, null, 2));
    } else {
      console.log("PASS");
      console.log(JSON.stringify({ ...row.summary, latency_ms: row.latency_ms }, null, 2));
    }
    console.log("---");
  }

  console.log("SUMMARY");
  console.log(
    JSON.stringify(
      {
        total_files: files.length,
        passed: files.length - failed,
        failed,
        total_usd: Number(totalUsd.toFixed(8)),
      },
      null,
      2
    )
  );

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Smoke harness crashed:", err && err.message ? err.message : err);
  process.exit(3);
});
