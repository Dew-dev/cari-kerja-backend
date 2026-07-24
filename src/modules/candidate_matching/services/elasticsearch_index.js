/**
 * Elasticsearch dense_vector indexing + knn semantic helpers for Smart Matching.
 *
 * When MATCHING_ES_ENABLED=false (default), all methods no-op / return null so
 * Phase A hybrid scoring continues without Elasticsearch.
 */

const config = require("../../../config/global_config");
const logger = require("../../../helpers/utils/logger");
const {
  getClient,
  isEnabled,
  getEsConfig,
} = require("../../../helpers/databases/elasticsearch/client");
const { LOCAL_DIM } = require("./embedding_client");

const ctx = "Matching-ElasticsearchIndex";

let indicesReady = false;

const getDims = () => {
  const matching = config.get("/matching") || {};
  return Number(matching.embeddingDims) || LOCAL_DIM;
};

const indexNameFor = (entity_type) => {
  const es = getEsConfig();
  return entity_type === "job" ? es.jobsIndex : es.workersIndex;
};

const buildMapping = (dims) => ({
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
  },
  mappings: {
    properties: {
      entity_id: { type: "keyword" },
      entity_type: { type: "keyword" },
      text_hash: { type: "keyword" },
      model_version: { type: "keyword" },
      source_text: { type: "text" },
      updated_at: { type: "date" },
      embedding: {
        type: "dense_vector",
        dims,
        index: true,
        similarity: "cosine",
      },
    },
  },
});

/**
 * Ensure job/worker matching indices exist with dense_vector mapping.
 */
const ensureIndices = async () => {
  if (!isEnabled()) return { skipped: true, reason: "es_disabled" };

  const client = getClient();
  if (!client) return { skipped: true, reason: "no_client" };

  const es = getEsConfig();
  const dims = getDims();
  const indices = [es.jobsIndex, es.workersIndex];

  for (const index of indices) {
    const exists = await client.indices.exists({ index });
    if (exists) continue;

    await client.indices.create({
      index,
      ...buildMapping(dims),
    });
    logger.info(ctx, `Created index ${index} (dims=${dims})`, "ensureIndices");
  }

  indicesReady = true;
  return { ok: true, dims, indices };
};

const assertVectorDims = (embedding) => {
  const dims = getDims();
  if (!Array.isArray(embedding) || embedding.length !== dims) {
    return {
      ok: false,
      message: `Embedding dims ${embedding?.length ?? 0} != configured ${dims}`,
    };
  }
  return { ok: true, dims };
};

/**
 * Upsert a job or worker dense_vector document.
 */
const indexEntity = async ({
  entity_type,
  entity_id,
  text_hash,
  model_version,
  embedding,
  source_text,
}) => {
  if (!isEnabled()) return { skipped: true, reason: "es_disabled" };

  const dimsCheck = assertVectorDims(embedding);
  if (!dimsCheck.ok) {
    logger.error(ctx, "indexEntity skipped", entity_id, dimsCheck.message);
    return { skipped: true, reason: "dims_mismatch", message: dimsCheck.message };
  }

  try {
    if (!indicesReady) await ensureIndices();

    const client = getClient();
    const index = indexNameFor(entity_type);
    const id = `${entity_type}:${entity_id}:${model_version}`;

    await client.index({
      index,
      id,
      document: {
        entity_id,
        entity_type,
        text_hash,
        model_version,
        source_text: source_text ? String(source_text).slice(0, 8000) : "",
        embedding,
        updated_at: new Date().toISOString(),
      },
      refresh: false,
    });

    return { ok: true, index, id };
  } catch (err) {
    logger.error(ctx, "indexEntity failed", entity_id, err.message || err);
    return { err: err.message || String(err) };
  }
};

/**
 * Semantic similarity [0,1] via knn filtered to a specific worker.
 * Falls back to null on any failure (caller uses local cosine).
 */
const knnSemanticSimilarity = async ({ jobEmbedding, worker_id }) => {
  if (!isEnabled()) return null;

  const dimsCheck = assertVectorDims(jobEmbedding);
  if (!dimsCheck.ok) return null;

  try {
    if (!indicesReady) await ensureIndices();

    const client = getClient();
    const es = getEsConfig();
    const numCandidates = Math.max(10, Number(es.knnCandidates) || 50);

    const result = await client.search({
      index: es.workersIndex,
      size: 1,
      knn: {
        field: "embedding",
        query_vector: jobEmbedding,
        k: 1,
        num_candidates: numCandidates,
        filter: {
          term: { entity_id: worker_id },
        },
      },
      _source: false,
    });

    const hit = result?.hits?.hits?.[0];
    if (!hit || typeof hit._score !== "number") return null;

    // ES cosine knn score is typically in [0, 1]
    return Math.max(0, Math.min(1, hit._score));
  } catch (err) {
    logger.error(ctx, "knnSemanticSimilarity failed", worker_id, err.message || err);
    return null;
  }
};

/**
 * Top-k similar workers for a job vector (optional recruiter tooling / future rank).
 */
const findSimilarWorkers = async ({ jobEmbedding, k = 10, excludeWorkerIds = [] }) => {
  if (!isEnabled()) return [];

  const dimsCheck = assertVectorDims(jobEmbedding);
  if (!dimsCheck.ok) return [];

  try {
    if (!indicesReady) await ensureIndices();

    const client = getClient();
    const es = getEsConfig();
    const size = Math.max(1, Math.min(100, Number(k) || 10));
    const numCandidates = Math.max(size * 2, Number(es.knnCandidates) || 50);

    const filter =
      Array.isArray(excludeWorkerIds) && excludeWorkerIds.length > 0
        ? {
            bool: {
              must_not: [{ terms: { entity_id: excludeWorkerIds } }],
            },
          }
        : undefined;

    const result = await client.search({
      index: es.workersIndex,
      size,
      knn: {
        field: "embedding",
        query_vector: jobEmbedding,
        k: size,
        num_candidates: numCandidates,
        ...(filter ? { filter } : {}),
      },
      _source: ["entity_id", "text_hash", "model_version"],
    });

    return (result?.hits?.hits || []).map((hit) => ({
      worker_id: hit._source?.entity_id,
      score: hit._score,
      text_hash: hit._source?.text_hash,
      model_version: hit._source?.model_version,
    }));
  } catch (err) {
    logger.error(ctx, "findSimilarWorkers failed", "knn", err.message || err);
    return [];
  }
};

const reindexFromRows = async (rows = []) => {
  if (!isEnabled()) return { skipped: true, reason: "es_disabled" };

  await ensureIndices();
  let indexed = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    let embedding = row.embedding;
    if (typeof embedding === "string") {
      try {
        embedding = JSON.parse(embedding);
      } catch {
        failed += 1;
        continue;
      }
    }

    const result = await indexEntity({
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      text_hash: row.text_hash,
      model_version: row.model_version,
      embedding,
      source_text: row.source_text,
    });

    if (result?.ok) indexed += 1;
    else if (result?.skipped) skipped += 1;
    else failed += 1;
  }

  return { indexed, skipped, failed };
};

module.exports = {
  ensureIndices,
  indexEntity,
  knnSemanticSimilarity,
  findSimilarWorkers,
  reindexFromRows,
  getDims,
  indexNameFor,
};
