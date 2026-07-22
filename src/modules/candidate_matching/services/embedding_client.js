/**
 * Embedding client for Smart Candidate Matching.
 *
 * When MATCHING_EMBEDDING_URL is set, POSTs { text } (or { input }) and expects
 * { embedding: number[] } or { data: [{ embedding }] } (OpenAI-compatible).
 *
 * When URL is empty, uses a deterministic local bag-of-words / TF-style vector
 * so local/dev environments still produce cosine similarity without an external API.
 */

const axios = require("axios");
const config = require("../../../config/global_config");
const logger = require("../../../helpers/utils/logger");

const ctx = "Matching-EmbeddingClient";
const LOCAL_DIM = 256;

const tokenize = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u00c0-\u024f\s+#.]/gi, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);

/**
 * Deterministic bag-of-words hashed into a fixed-size vector (local fallback).
 */
const localBagOfWordsEmbedding = (text) => {
  const vec = new Array(LOCAL_DIM).fill(0);
  const tokens = tokenize(text);
  if (tokens.length === 0) return vec;

  const tf = new Map();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }

  for (const [token, count] of tf.entries()) {
    let hash = 2166136261;
    for (let i = 0; i < token.length; i += 1) {
      hash ^= token.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const idx = Math.abs(hash) % LOCAL_DIM;
    const sign = hash & 1 ? 1 : -1;
    vec[idx] += sign * (count / tokens.length);
  }

  // L2 normalize
  let norm = 0;
  for (let i = 0; i < vec.length; i += 1) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < vec.length; i += 1) vec[i] /= norm;
  return vec;
};

const extractEmbedding = (body) => {
  if (!body) return null;
  if (Array.isArray(body.embedding)) return body.embedding;
  if (Array.isArray(body.vector)) return body.vector;
  if (Array.isArray(body.data?.[0]?.embedding)) return body.data[0].embedding;
  if (Array.isArray(body.data?.embedding)) return body.data.embedding;
  return null;
};

/**
 * @param {string} text
 * @returns {Promise<{ embedding: number[], provider: 'remote'|'local' }>}
 */
const embedText = async (text) => {
  const matching = config.get("/matching") || {};
  const url = matching.embeddingUrl || "";
  const apiKey = matching.embeddingApiKey || "";

  if (!url) {
    return {
      embedding: localBagOfWordsEmbedding(text),
      provider: "local",
    };
  }

  try {
    const headers = { "Content-Type": "application/json" };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    const response = await axios.post(
      url,
      { text, input: text },
      { headers, timeout: 15000 },
    );

    const embedding = extractEmbedding(response.data);
    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new Error("Embedding API returned empty vector");
    }

    return { embedding, provider: "remote" };
  } catch (err) {
    logger.error(
      ctx,
      "Remote embedding failed; falling back to local BoW",
      "embedText",
      err.message || err,
    );
    return {
      embedding: localBagOfWordsEmbedding(text),
      provider: "local",
      remote_error: err.message || String(err),
    };
  }
};

module.exports = {
  embedText,
  localBagOfWordsEmbedding,
  tokenize,
};
