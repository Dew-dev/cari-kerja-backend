/**
 * OpenAI Responses API adapter for CV extraction.
 *
 * Uses the official `openai` SDK against the Responses API with a reasoning
 * model (default gpt-5-mini). This module owns its own retry loop and cost
 * estimation. It never logs the API key, base64 images, raw CV content, or the
 * full system prompt.
 *
 * Model facts baked into this adapter:
 *  - No `temperature` support (never sent).
 *  - Supports `reasoning: { effort }`.
 *  - Token cap is `max_output_tokens`.
 *  - Structured output via `text.format` json_schema (strict).
 *  - Multimodal input: content parts `input_text` / `input_image` where
 *    `image_url` is a data-URL STRING.
 */

"use strict";

const DEFAULT_MODEL = "gpt-5-mini-2025-08-07";
const DEFAULT_TIMEOUT_MS = 90000;
const DEFAULT_MAX_OUTPUT_TOKENS = 8000;
const DEFAULT_REASONING_EFFORT = "low";
const DEFAULT_MAX_RETRIES = 1;
const BACKOFF_MS = 1500;

// Pricing for GPT-5 mini, USD per 1M tokens. Overridable via env.
const PRICE_INPUT_PER_1M = Number(process.env.CV_PARSER_PRICE_INPUT_PER_1M || 0.25);
const PRICE_CACHED_INPUT_PER_1M = Number(
  process.env.CV_PARSER_PRICE_CACHED_INPUT_PER_1M || 0.025
);
const PRICE_OUTPUT_PER_1M = Number(process.env.CV_PARSER_PRICE_OUTPUT_PER_1M || 2.0);
const PRICING_VERSION = "gpt-5-mini-2025-08-07@0.25/2.00";

let cachedClient = null;

function isCvParserEnabled() {
  return Boolean(process.env.OPENAI_API_KEY);
}

function getClient() {
  if (cachedClient) return cachedClient;
  // Lazy require so the module can be loaded (and mocked) without the SDK
  // resolving eagerly at import time in unrelated code paths.
  const OpenAI = require("openai");
  const Ctor = OpenAI && OpenAI.default ? OpenAI.default : OpenAI;
  cachedClient = new Ctor({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: Number(process.env.CV_PARSER_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
    maxRetries: 0,
  });
  return cachedClient;
}

function makeError(code, message, extra) {
  const err = new Error(message);
  err.code = code;
  if (extra && typeof extra === "object") {
    for (const k of Object.keys(extra)) {
      err[k] = extra[k];
    }
  }
  return err;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Decide whether an error is transient and worth retrying.
 * Retry only for HTTP 429 / 5xx / timeout / network errors and AI_INVALID_JSON.
 * Never retry 400/401/403 or AI_REFUSAL / AI_INCOMPLETE.
 */
function isRetryable(err) {
  if (!err) return false;
  if (err.code === "AI_INVALID_JSON") return true;
  if (err.code === "AI_REFUSAL" || err.code === "AI_INCOMPLETE") return false;

  const status = typeof err.status === "number" ? err.status : undefined;
  if (status === 429) return true;
  if (typeof status === "number" && status >= 500 && status <= 599) return true;
  if (typeof status === "number" && status >= 400 && status < 500) return false;

  // Timeout / network errors from the SDK typically have no HTTP status.
  const name = err.name || "";
  const rawCode = err.code || "";
  if (name === "APIConnectionTimeoutError" || name === "APIConnectionError") return true;
  if (rawCode === "ETIMEDOUT" || rawCode === "ECONNRESET" || rawCode === "ECONNREFUSED") {
    return true;
  }
  if (rawCode === "ENOTFOUND" || rawCode === "EAI_AGAIN") return true;
  return false;
}

function roundUsd(value) {
  if (!Number.isFinite(value)) return 0;
  // Keep small per-CV costs readable: round to 8 decimals.
  return Number(value.toFixed(8));
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Compute a normalized usage object and USD cost estimate from an OpenAI
 * Responses API `usage` payload.
 */
function computeCostFromUsage(rawUsage, model) {
  const usageObj = rawUsage && typeof rawUsage === "object" ? rawUsage : {};

  const inputTokens = toNumber(usageObj.input_tokens);
  const outputTokens = toNumber(usageObj.output_tokens);
  const totalTokens = toNumber(
    usageObj.total_tokens != null ? usageObj.total_tokens : inputTokens + outputTokens
  );

  const inputDetails =
    usageObj.input_tokens_details && typeof usageObj.input_tokens_details === "object"
      ? usageObj.input_tokens_details
      : {};
  const outputDetails =
    usageObj.output_tokens_details && typeof usageObj.output_tokens_details === "object"
      ? usageObj.output_tokens_details
      : {};

  const cachedTokens = toNumber(inputDetails.cached_tokens);
  const reasoningTokens = toNumber(outputDetails.reasoning_tokens);

  const billableInput = Math.max(0, inputTokens - cachedTokens);

  const inputUsd = (billableInput / 1e6) * PRICE_INPUT_PER_1M;
  const cachedInputUsd = (cachedTokens / 1e6) * PRICE_CACHED_INPUT_PER_1M;
  const outputUsd = (outputTokens / 1e6) * PRICE_OUTPUT_PER_1M;
  const totalUsd = inputUsd + cachedInputUsd + outputUsd;

  const usage = {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: totalTokens,
    cached_tokens: cachedTokens,
    reasoning_tokens: reasoningTokens,
  };

  const cost = {
    currency: "USD",
    input_usd: roundUsd(inputUsd),
    cached_input_usd: roundUsd(cachedInputUsd),
    output_usd: roundUsd(outputUsd),
    total_usd: roundUsd(totalUsd),
    model: model || null,
    pricing_version: PRICING_VERSION,
  };

  return { usage, cost };
}

/**
 * Build the multimodal `input` array for the Responses API.
 * `userContent` is expected to be an array of content parts. Images (Buffers of
 * PNG data) are appended as `input_image` parts with a data-URL string.
 */
function buildInput({ systemPrompt, userContent, images }) {
  const userParts = Array.isArray(userContent) ? userContent.slice() : [];

  if (Array.isArray(images) && images.length > 0) {
    for (const buf of images) {
      if (!buf) continue;
      const base64 = Buffer.isBuffer(buf)
        ? buf.toString("base64")
        : Buffer.from(buf).toString("base64");
      userParts.push({
        type: "input_image",
        image_url: "data:image/png;base64," + base64,
        detail: "auto",
      });
    }
  }

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userParts },
  ];
}

/**
 * Extract the assistant text (or detect a refusal) from a Responses API result.
 * Returns { text } or throws AI_REFUSAL / AI_INCOMPLETE.
 */
function extractText(response) {
  if (response && response.status === "incomplete") {
    const reason =
      (response.incomplete_details && response.incomplete_details.reason) || "unknown";
    throw makeError("AI_INCOMPLETE", `AI response incomplete (reason: ${reason})`, {
      reason,
    });
  }

  const output = Array.isArray(response && response.output) ? response.output : [];

  // Detect refusal inside message content parts.
  for (const item of output) {
    if (item && item.type === "message" && Array.isArray(item.content)) {
      for (const part of item.content) {
        if (part && part.type === "refusal") {
          throw makeError("AI_REFUSAL", "AI refused to process the request");
        }
      }
    }
  }

  if (typeof response.output_text === "string" && response.output_text.length > 0) {
    return response.output_text;
  }

  // Fallback: concatenate output_text parts from message items.
  const chunks = [];
  for (const item of output) {
    if (item && item.type === "message" && Array.isArray(item.content)) {
      for (const part of item.content) {
        if (part && part.type === "output_text" && typeof part.text === "string") {
          chunks.push(part.text);
        }
      }
    }
  }
  return chunks.join("");
}

/**
 * Perform a single (non-retrying) extraction call.
 */
async function callOnce({ input, schema }) {
  const client = getClient();

  const request = {
    model: process.env.CV_PARSER_MODEL || DEFAULT_MODEL,
    reasoning: {
      effort: process.env.CV_PARSER_REASONING_EFFORT || DEFAULT_REASONING_EFFORT,
    },
    max_output_tokens: Number(
      process.env.CV_PARSER_MAX_OUTPUT_TOKENS || DEFAULT_MAX_OUTPUT_TOKENS
    ),
    input,
    text: {
      format: {
        type: "json_schema",
        name: schema.name,
        strict: true,
        schema: schema.schema,
      },
    },
  };

  let response;
  try {
    response = await client.responses.create(request);
  } catch (err) {
    // Normalize SDK errors: keep status/name, but never surface payload details.
    const status = typeof err.status === "number" ? err.status : undefined;
    const normalized = makeError(
      "AI_REQUEST_FAILED",
      `AI request failed${status ? ` (status ${status})` : ""}`,
      { status, name: err.name }
    );
    throw normalized;
  }

  const text = extractText(response);

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (_e) {
    throw makeError("AI_INVALID_JSON", "AI returned invalid JSON");
  }

  const { usage, cost } = computeCostFromUsage(response.usage, response.model);

  return {
    parsed,
    usage,
    cost,
    model: response.model,
  };
}

/**
 * Main entry point. Runs the extraction with an internal retry loop.
 *
 * @param {Object}   params
 * @param {string}   params.systemPrompt  System instructions.
 * @param {Array}    params.userContent   Array of content parts (input_text, ...).
 * @param {Buffer[]} [params.images]      Optional PNG page buffers.
 * @param {Object}   params.schema        { name, schema } JSON schema for output.
 * @param {Object}   [params.metadata]    Reserved; not sent to the API.
 * @returns {Promise<{ parsed, usage, cost, model, attempts }>}
 */
async function createCvExtraction({ systemPrompt, userContent, images, schema, metadata }) {
  void metadata; // reserved; intentionally not forwarded to the provider.

  if (!schema || typeof schema.name !== "string" || !schema.schema) {
    throw makeError("AI_CONFIG_INVALID", "A JSON schema { name, schema } is required");
  }

  const input = buildInput({ systemPrompt, userContent, images });
  const maxAttempts = 1 + Number(process.env.CV_PARSER_MAX_RETRIES || DEFAULT_MAX_RETRIES);

  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await callOnce({ input, schema });
      result.attempts = attempt;
      return result;
    } catch (err) {
      lastError = err;
      const canRetry = isRetryable(err) && attempt < maxAttempts;
      if (!canRetry) {
        if (err && typeof err === "object") err.attempts = attempt;
        throw err;
      }
      await sleep(BACKOFF_MS);
    }
  }

  // Should be unreachable, but keep a safe fallback.
  if (lastError && typeof lastError === "object") lastError.attempts = maxAttempts;
  throw lastError || makeError("AI_REQUEST_FAILED", "AI request failed");
}

module.exports = {
  isCvParserEnabled,
  createCvExtraction,
  // Exported for unit testing / integration reuse.
  computeCostFromUsage,
  buildInput,
  PRICING_VERSION,
};
