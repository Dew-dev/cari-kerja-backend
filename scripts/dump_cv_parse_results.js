/**
 * Dump FULL parseCV JSON results for CV-Test files (for quality review).
 * Does not print API keys. Writes JSON to CV-Test/_results/.
 */
"use strict";

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { parseCV } = require("../src/modules/cv-parsing/services/cv_parser");

const CV_TEST_DIR = path.join(__dirname, "..", "CV-Test");
const OUT_DIR = path.join(CV_TEST_DIR, "_results");
const PER_FILE_TIMEOUT_MS = Number(process.env.CV_SMOKE_TIMEOUT_MS || 180000);

const MIME_BY_EXT = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
};

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${label}`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY missing");
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs
    .readdirSync(CV_TEST_DIR)
    .filter((n) => MIME_BY_EXT[path.extname(n).toLowerCase()])
    .sort();

  console.log(`Files: ${files.length}`);
  console.log(`Model: ${process.env.CV_PARSER_MODEL || "(default)"}`);

  for (const name of files) {
    const abs = path.join(CV_TEST_DIR, name);
    const mime = MIME_BY_EXT[path.extname(name).toLowerCase()];
    const outPath = path.join(OUT_DIR, `${name}.json`);
    process.stdout.write(`\n=== ${name} ===\n`);
    const t0 = Date.now();
    try {
      const result = await withTimeout(parseCV(abs, mime), PER_FILE_TIMEOUT_MS, name);
      const elapsed = Date.now() - t0;
      const payload = {
        file: name,
        elapsed_ms: elapsed,
        result,
      };
      fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
      const m = result._meta || {};
      console.log(
        JSON.stringify(
          {
            ok: true,
            parser: m.parser,
            input_mode: m.input_mode,
            extraction_method: m.extraction_method,
            name: result.personal_info?.full_name || result.name,
            email: result.personal_info?.email || result.email,
            work: (result.work_experiences || []).length,
            edu: (result.educations || []).length,
            skills: (result.skills || []).length,
            cost_usd: m.cost?.total_usd,
            elapsed_ms: elapsed,
            out: outPath,
          },
          null,
          2
        )
      );
    } catch (err) {
      const elapsed = Date.now() - t0;
      const payload = {
        file: name,
        elapsed_ms: elapsed,
        error: { code: err.code || null, message: String(err.message || err).slice(0, 300) },
      };
      fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
      console.error("FAIL", payload.error);
    }
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
