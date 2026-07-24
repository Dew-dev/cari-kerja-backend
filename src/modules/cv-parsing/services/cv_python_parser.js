const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const DEFAULT_SCRIPT = path.join(__dirname, "..", "..", "..", "..", "scripts", "cv_parse_python.py");

function isPythonResumeParserEnabled() {
  // Read at call-time — module-load capture races dotenv require order.
  return process.env.CV_USE_PYTHON_RESUME_PARSER === "true";
}

function resolvePythonBin() {
  return process.env.CV_PYTHON_BIN || "python";
}

function resolvePythonTimeoutMs() {
  return Number(process.env.CV_PYTHON_PARSER_TIMEOUT_MS || 60000);
}

function resolvePythonScriptPath() {
  if (process.env.CV_PYTHON_PARSER_SCRIPT) {
    return path.resolve(process.env.CV_PYTHON_PARSER_SCRIPT);
  }
  return path.resolve(DEFAULT_SCRIPT);
}

function isPythonStrict() {
  return process.env.CV_PYTHON_STRICT === "true";
}

function pythonErrorFromPayload(payload, stderr, code) {
  const message =
    (payload && payload.error) ||
    (stderr && String(stderr).trim()) ||
    `Python CV parser exited with ${code}`;
  const err = new Error(message);
  err.code = "PYTHON_CV_PARSER";
  if (payload) {
    if (payload.error_type) err.error_type = payload.error_type;
    if (payload.hint) err.hint = payload.hint;
    if (payload.missing_module) err.missing_module = payload.missing_module;
    if (payload.package_error) err.package_error = payload.package_error;
    if (payload.fallback_error) err.fallback_error = payload.fallback_error;
  }
  if (stderr && String(stderr).trim()) err.stderr = String(stderr).trim();
  return err;
}

function serializePythonError(err) {
  if (!err) return null;
  return {
    message: err.message || String(err),
    error_type: err.error_type || err.code || null,
    hint: err.hint || null,
    missing_module: err.missing_module || null,
    package_error: err.package_error || null,
  };
}

function runPythonParserArgs(args) {
  const scriptPath = resolvePythonScriptPath();
  const pythonBin = resolvePythonBin();
  const timeoutMs = resolvePythonTimeoutMs();

  if (!fs.existsSync(scriptPath)) {
    return Promise.reject(new Error(`Python CV parser script not found: ${scriptPath}`));
  }

  return new Promise((resolve, reject) => {
    const child = spawn(pythonBin, [scriptPath, ...args], {
      windowsHide: true,
      env: process.env,
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGTERM");
      reject(new Error(`Python CV parser timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const wrapped = new Error(`Failed to start Python (${pythonBin}): ${err.message}`);
      wrapped.code = "PYTHON_CV_PARSER";
      wrapped.error_type = "SpawnError";
      wrapped.hint =
        "Set CV_PYTHON_BIN to your venv python, e.g. /app/.venv/bin/python";
      reject(wrapped);
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      const line = stdout
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .pop();

      if (!line) {
        reject(
          pythonErrorFromPayload(
            null,
            stderr.trim() || `Python CV parser produced no JSON (exit ${code})`,
            code
          )
        );
        return;
      }

      let payload;
      try {
        payload = JSON.parse(line);
      } catch (err) {
        const wrapped = new Error(
          `Python CV parser returned invalid JSON: ${err.message}`
        );
        wrapped.code = "PYTHON_CV_PARSER";
        wrapped.error_type = "InvalidJSON";
        wrapped.stderr = stderr.trim() || null;
        reject(wrapped);
        return;
      }

      if (code !== 0 || payload.error) {
        reject(pythonErrorFromPayload(payload, stderr, code));
        return;
      }

      resolve(stripInternalMeta(payload));
    });
  });
}

/**
 * Spawn scripts/cv_parse_python.py and map JSON stdout to the CV schema.
 * @param {string} filePath
 * @param {{ text?: string }} [options] When `text` is provided (e.g. OCR output),
 *   parse that text instead of re-extracting from the file.
 * @returns {Promise<object>}
 */
async function parseWithPythonResumeParser(filePath, options = {}) {
  const suppliedText = typeof options.text === "string" ? options.text.trim() : "";

  if (suppliedText) {
    const tmpPath = path.join(
      os.tmpdir(),
      `cv-python-text-${process.pid}-${Date.now()}.txt`
    );
    fs.writeFileSync(tmpPath, suppliedText, "utf8");
    try {
      return await runPythonParserArgs(["--from-text", tmpPath]);
    } finally {
      fs.unlink(tmpPath, () => {});
    }
  }

  if (!fs.existsSync(filePath)) {
    return Promise.reject(new Error(`CV file not found: ${filePath}`));
  }

  return runPythonParserArgs([path.resolve(filePath)]);
}

/** Keep schema fields; fold script _meta into a plain object the Node layer can merge. */
function stripInternalMeta(payload) {
  const { _meta, ...rest } = payload || {};
  return {
    personal_info: rest.personal_info || {},
    work_experiences: Array.isArray(rest.work_experiences) ? rest.work_experiences : [],
    educations: Array.isArray(rest.educations) ? rest.educations : [],
    skills: Array.isArray(rest.skills) ? rest.skills : [],
    _python_meta: _meta || {},
  };
}

/**
 * Extract plain text via Python (pdfplumber/docx2txt).
 * Prefer this over Node pdf-parse for multi-column resume PDFs.
 * @param {string} filePath
 * @returns {Promise<string>}
 */
function extractTextWithPython(filePath) {
  if (!fs.existsSync(filePath)) {
    return Promise.reject(new Error(`CV file not found: ${filePath}`));
  }

  const scriptPath = resolvePythonScriptPath();
  const pythonBin = resolvePythonBin();
  const timeoutMs = resolvePythonTimeoutMs();

  if (!fs.existsSync(scriptPath)) {
    return Promise.reject(new Error(`Python CV parser script not found: ${scriptPath}`));
  }

  return new Promise((resolve, reject) => {
    const child = spawn(
      pythonBin,
      [scriptPath, "--extract-text", path.resolve(filePath)],
      { windowsHide: true, env: process.env }
    );

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGTERM");
      reject(new Error(`Python text extract timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`Failed to start Python (${pythonBin}): ${err.message}`));
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      const line = stdout
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .pop();

      if (!line) {
        reject(new Error(stderr.trim() || `Python text extract exited with ${code}`));
        return;
      }

      let payload;
      try {
        payload = JSON.parse(line);
      } catch (err) {
        reject(new Error(`Python text extract returned invalid JSON: ${err.message}`));
        return;
      }

      if (code !== 0 || payload.error) {
        reject(pythonErrorFromPayload(payload, stderr, code));
        return;
      }

      resolve(String(payload.text || ""));
    });
  });
}

module.exports = {
  isPythonResumeParserEnabled,
  isPythonStrict,
  parseWithPythonResumeParser,
  extractTextWithPython,
  serializePythonError,
  resolvePythonScriptPath,
  resolvePythonBin,
};
