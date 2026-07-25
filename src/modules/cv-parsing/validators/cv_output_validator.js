/**
 * Structural validator + light sanitizer for AI-parsed CV output.
 *
 * This intentionally stays shallow: it guarantees the top-level shape and
 * enforces size caps + basic string sanitation. Business-level normalization
 * (dates, phone formats, dedup, etc.) remains the responsibility of the
 * existing normalizeParsedResult routine.
 */

"use strict";

const MAX_WORK_EXPERIENCES = 50;
const MAX_EDUCATIONS = 30;
const MAX_SKILLS = 200;
const MAX_STRING_LEN = 5000;

function makeError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

function isPlainObject(value) {
  return (
    value != null && typeof value === "object" && !Array.isArray(value)
  );
}

/**
 * Sanitize a single string:
 *  - remove <script>/<style> blocks (including their contents),
 *  - strip non-printable control characters (keep \n, \r, \t),
 *  - truncate to MAX_STRING_LEN.
 */
function sanitizeString(str) {
  let out = String(str);

  // Drop dangerous tag blocks with their contents.
  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "");
  out = out.replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, "");
  // Also drop any unterminated opening tag remnants.
  out = out.replace(/<\/?(?:script|style)\b[^>]*>/gi, "");

  // Strip control chars except tab (09), newline (0A), carriage return (0D).
  // eslint-disable-next-line no-control-regex
  out = out.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

  if (out.length > MAX_STRING_LEN) {
    out = out.slice(0, MAX_STRING_LEN);
  }
  return out;
}

/**
 * Recursively sanitize all string values within a JSON-like value.
 */
function sanitizeDeep(value) {
  if (typeof value === "string") return sanitizeString(value);
  if (Array.isArray(value)) return value.map((v) => sanitizeDeep(v));
  if (isPlainObject(value)) {
    const out = {};
    for (const key of Object.keys(value)) {
      out[key] = sanitizeDeep(value[key]);
    }
    return out;
  }
  return value; // numbers, booleans, null — left as-is.
}

/**
 * Validate and clean the parsed CV output.
 *
 * @param {*} parsed Raw parsed object from the AI provider.
 * @returns {Object} Cleaned object with guaranteed top-level shape.
 * @throws  Error with `.code = "AI_OUTPUT_INVALID"` on structural violations.
 */
function validateCvOutput(parsed) {
  if (!isPlainObject(parsed)) {
    throw makeError("AI_OUTPUT_INVALID", "AI output must be an object");
  }

  // personal_info: object or null.
  if (
    parsed.personal_info !== null &&
    parsed.personal_info !== undefined &&
    !isPlainObject(parsed.personal_info)
  ) {
    throw makeError("AI_OUTPUT_INVALID", "personal_info must be an object or null");
  }

  if (!Array.isArray(parsed.work_experiences)) {
    throw makeError("AI_OUTPUT_INVALID", "work_experiences must be an array");
  }
  if (!Array.isArray(parsed.educations)) {
    throw makeError("AI_OUTPUT_INVALID", "educations must be an array");
  }
  if (!Array.isArray(parsed.skills)) {
    throw makeError("AI_OUTPUT_INVALID", "skills must be an array");
  }

  const cleaned = sanitizeDeep(parsed);

  // personal_info normalizes undefined → null for a predictable shape.
  cleaned.personal_info =
    cleaned.personal_info === undefined ? null : cleaned.personal_info;

  // Enforce array size caps (truncate, don't throw).
  cleaned.work_experiences = cleaned.work_experiences.slice(0, MAX_WORK_EXPERIENCES);
  cleaned.educations = cleaned.educations.slice(0, MAX_EDUCATIONS);
  cleaned.skills = cleaned.skills.slice(0, MAX_SKILLS);

  return cleaned;
}

module.exports = {
  validateCvOutput,
  // Exported for unit testing.
  sanitizeString,
  MAX_WORK_EXPERIENCES,
  MAX_EDUCATIONS,
  MAX_SKILLS,
  MAX_STRING_LEN,
};
