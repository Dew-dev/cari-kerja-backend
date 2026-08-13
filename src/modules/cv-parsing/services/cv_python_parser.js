const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const axios = require("axios");

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

/** Prefer remote sidecar so the Node Docker image needs no Python runtime. */
function resolveParserServiceUrl() {
  const url = (process.env.CV_PARSER_SERVICE_URL || "").trim().replace(/\/+$/, "");
  return url || null;
}

function resolveParserServiceToken() {
  return (process.env.CV_PARSER_SERVICE_TOKEN || "").trim();
}

function isRemoteParserEnabled() {
  return Boolean(resolveParserServiceUrl());
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

function serviceErrorFromAxios(err, fallbackMessage) {
  const payload = err?.response?.data;
  if (payload && typeof payload === "object" && payload.error) {
    return pythonErrorFromPayload(payload, null, err.response?.status || 1);
  }
  const wrapped = new Error(
    payload?.message || err.message || fallbackMessage || "CV parser service request failed"
  );
  wrapped.code = "PYTHON_CV_PARSER";
  wrapped.error_type = err.code === "ECONNREFUSED" ? "ServiceUnavailable" : "ServiceError";
  wrapped.hint =
    "Start services/cv-parser (sidecar) and set CV_PARSER_SERVICE_URL to its base URL from the Node container.";
  return wrapped;
}

function serviceHeaders() {
  const headers = { "Content-Type": "application/json" };
  const token = resolveParserServiceToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function postParserService(pathname, body) {
  const base = resolveParserServiceUrl();
  if (!base) {
    throw new Error("CV_PARSER_SERVICE_URL is not configured");
  }
  try {
    const response = await axios.post(`${base}${pathname}`, body, {
      headers: serviceHeaders(),
      timeout: resolvePythonTimeoutMs(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    const payload = response.data;
    if (payload?.error) {
      throw pythonErrorFromPayload(payload, null, response.status);
    }
    return payload;
  } catch (err) {
    if (err.code === "PYTHON_CV_PARSER") throw err;
    throw serviceErrorFromAxios(err, `CV parser service ${pathname} failed`);
  }
}

function fileToBase64Payload(filePath) {
  return {
    filename: path.basename(filePath),
    file_base64: fs.readFileSync(filePath).toString("base64"),
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
        "Prefer CV_PARSER_SERVICE_URL (sidecar). Or set CV_PYTHON_BIN to a local venv python for non-Docker dev.";
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
 * Parse via remote sidecar when CV_PARSER_SERVICE_URL is set; else local spawn.
 * @param {string} filePath
 * @param {{ text?: string }} [options]
 * @returns {Promise<object>}
 */
async function parseWithPythonResumeParser(filePath, options = {}) {
  const suppliedText = typeof options.text === "string" ? options.text.trim() : "";

  if (isRemoteParserEnabled()) {
    const body = suppliedText
      ? { text: suppliedText }
      : fileToBase64Payload(filePath);
    const payload = await postParserService("/v1/parse", body);
    return stripInternalMeta(payload);
  }

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
 * Extract plain text via sidecar or local Python (pdfplumber/docx2txt).
 * @param {string} filePath
 * @returns {Promise<string>}
 */
async function extractTextWithPython(filePath) {
  if (!fs.existsSync(filePath)) {
    return Promise.reject(new Error(`CV file not found: ${filePath}`));
  }

  if (isRemoteParserEnabled()) {
    const payload = await postParserService("/v1/extract-text", fileToBase64Payload(filePath));
    return String(payload.text || "");
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
      const wrapped = new Error(`Failed to start Python (${pythonBin}): ${err.message}`);
      wrapped.code = "PYTHON_CV_PARSER";
      wrapped.error_type = "SpawnError";
      wrapped.hint =
        "Prefer CV_PARSER_SERVICE_URL (sidecar). Or set CV_PYTHON_BIN for local spawn.";
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
        reject(pythonErrorFromPayload(null, stderr.trim() || `Python text extract exited with ${code}`, code));
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

/**
 * Render PDF pages to PNG buffers via sidecar or local Python.
 * @param {string} filePath
 * @param {{ maxPages?: number, dpi?: number }} [options]
 * @returns {Promise<Buffer[]>}
 */
async function renderPdfPagesWithPython(filePath, options = {}) {
  const maxPages = Number(options.maxPages || process.env.CV_OCR_MAX_PAGES || 3);
  const dpi =
    Number(options.dpi) ||
    Number(process.env.CV_OCR_RENDER_DPI) ||
    Math.max(120, Math.round(72 * Number(process.env.CV_OCR_RENDER_SCALE || 2)));

  if (isRemoteParserEnabled()) {
    const payload = await postParserService("/v1/render-pages", {
      ...fileToBase64Payload(filePath),
      max_pages: maxPages,
      dpi,
    });
    return (payload.images_base64 || []).map((b64) => Buffer.from(b64, "base64"));
  }

  // Local spawn fallback (dev machines with Python installed).
  const scriptPath = resolvePythonScriptPath();
  const pythonBin = resolvePythonBin();
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Python CV parser script not found: ${scriptPath}`);
  }

  const parsed = await new Promise((resolve, reject) => {
    const child = spawn(
      pythonBin,
      [
        scriptPath,
        "--render-pages",
        path.resolve(filePath),
        "--max-pages",
        String(Math.max(1, maxPages)),
        "--dpi",
        String(dpi),
      ],
      { windowsHide: true, env: process.env }
    );
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error("Python PDF render timed out"));
    }, resolvePythonTimeoutMs());
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      const wrapped = new Error(`Failed to start Python (${pythonBin}): ${err.message}`);
      wrapped.code = "PYTHON_CV_PARSER";
      wrapped.error_type = "SpawnError";
      wrapped.hint =
        "Prefer CV_PARSER_SERVICE_URL (sidecar). Or set CV_PYTHON_BIN for local spawn.";
      reject(wrapped);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      const line = stdout
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .pop();
      if (!line) {
        reject(new Error(stderr.trim() || `Python PDF render exited with ${code}`));
        return;
      }
      let data;
      try {
        data = JSON.parse(line);
      } catch (err) {
        reject(new Error(`Python PDF render returned invalid JSON: ${err.message}`));
        return;
      }
      if (code !== 0 || data.error) {
        reject(pythonErrorFromPayload(data, stderr, code));
        return;
      }
      resolve(data);
    });
  });

  const images = [];
  for (const imagePath of parsed.images || []) {
    try {
      images.push(fs.readFileSync(imagePath));
    } finally {
      fs.unlink(imagePath, () => {});
    }
  }
  return images;
}

module.exports = {
  isPythonResumeParserEnabled,
  isPythonStrict,
  isRemoteParserEnabled,
  parseWithPythonResumeParser,
  extractTextWithPython,
  renderPdfPagesWithPython,
  serializePythonError,
  resolvePythonScriptPath,
  resolvePythonBin,
  resolveParserServiceUrl,
};
