/**
 * Elasticsearch full-text index for public job search.
 * When JOB_SEARCH_ES_ENABLED=false, all methods no-op / return null (Postgres FTS fallback).
 */

const config = require("../../../config/global_config");
const logger = require("../../../helpers/utils/logger");
const {
  getClient,
  isJobSearchEnabled,
  getJobSearchConfig,
} = require("../../../helpers/databases/elasticsearch/client");

const ctx = "JobSearch-Elasticsearch";

let indexReady = false;

const buildMapping = () => ({
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
    analysis: {
      analyzer: {
        job_text: {
          type: "custom",
          tokenizer: "standard",
          filter: ["lowercase", "asciifolding"],
        },
      },
    },
  },
  mappings: {
    properties: {
      id: { type: "keyword" },
      title: {
        type: "text",
        analyzer: "job_text",
        fields: { keyword: { type: "keyword", ignore_above: 256 } },
      },
      description: { type: "text", analyzer: "job_text" },
      company_name: { type: "text", analyzer: "job_text" },
      location: { type: "text", analyzer: "job_text" },
      city: { type: "keyword" },
      province: { type: "keyword" },
      category_name: { type: "text", analyzer: "job_text" },
      employment_type: { type: "keyword" },
      experience_level: { type: "keyword" },
      tags: { type: "keyword" },
      status_id: { type: "integer" },
      boost_type: { type: "keyword" },
      is_remote: { type: "boolean" },
      archived_at: { type: "date" },
      created_at: { type: "date" },
      updated_at: { type: "date" },
    },
  },
});

const ensureIndex = async () => {
  if (!isJobSearchEnabled()) return { skipped: true, reason: "es_disabled" };

  const client = getClient();
  if (!client) return { skipped: true, reason: "no_client" };

  const { index } = getJobSearchConfig();
  const exists = await client.indices.exists({ index });
  if (!exists) {
    await client.indices.create({ index, ...buildMapping() });
    logger.info(ctx, `Created index ${index}`, "ensureIndex");
  }

  indexReady = true;
  return { ok: true, index };
};

/**
 * Fetch a denormalized job document for indexing.
 */
const fetchJobDocument = async (db, jobPostId) => {
  const result = await db.executeQuery(
    `
    SELECT
      j.id::text AS id,
      j.title,
      j.description,
      r.company_name,
      j.location,
      j.city,
      j.province,
      (
        SELECT ct.name FROM category_translations ct
        WHERE ct.category_id = j.category_id AND ct.locale = 'id'
        LIMIT 1
      ) AS category_name,
      et.name AS employment_type,
      el.name AS experience_level,
      j.status_id,
      j.boost_type,
      j.is_remote,
      j.archived_at,
      j.created_at,
      j.updated_at,
      COALESCE(
        (
          SELECT array_agg(t.name)
          FROM job_post_tags jpt
          JOIN job_tags t ON t.id = jpt.tag_id
          WHERE jpt.job_post_id = j.id
        ),
        ARRAY[]::text[]
      ) AS tags
    FROM job_posts j
    LEFT JOIN recruiters r ON r.id = j.recruiter_id
    LEFT JOIN employment_types et ON et.id = j.employment_type_id
    LEFT JOIN experience_levels el ON el.id = j.experience_level_id
    WHERE j.id = $1
    LIMIT 1
    `,
    [jobPostId]
  );

  return result?.rows?.[0] || null;
};

const cleanDoc = (doc) => {
  const out = { ...doc };
  if (out.archived_at == null) delete out.archived_at;
  return out;
};

const toEsDoc = (row) =>
  cleanDoc({
    id: row.id,
    title: row.title || "",
    description: row.description || "",
    company_name: row.company_name || "",
    location: row.location || "",
    city: row.city || null,
    province: row.province || null,
    category_name: row.category_name || "",
    employment_type: row.employment_type || null,
    experience_level: row.experience_level || null,
    tags: Array.isArray(row.tags) ? row.tags.filter(Boolean) : [],
    status_id: row.status_id != null ? Number(row.status_id) : null,
    boost_type: row.boost_type || null,
    is_remote: Boolean(row.is_remote),
    archived_at: row.archived_at || undefined,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  });

const indexJobPost = async (db, jobPostId) => {
  if (!isJobSearchEnabled()) return { skipped: true, reason: "es_disabled" };

  try {
    if (!indexReady) await ensureIndex();

    const row = await fetchJobDocument(db, jobPostId);
    if (!row) {
      return deleteJobPost(jobPostId);
    }

    const client = getClient();
    const { index } = getJobSearchConfig();
    await client.index({
      index,
      id: String(jobPostId),
      document: toEsDoc(row),
      refresh: false,
    });

    return { ok: true, id: jobPostId };
  } catch (err) {
    logger.error(ctx, "indexJobPost failed", jobPostId, err.message || err);
    return { err: err.message || String(err) };
  }
};

const deleteJobPost = async (jobPostId) => {
  if (!isJobSearchEnabled()) return { skipped: true, reason: "es_disabled" };

  try {
    if (!indexReady) await ensureIndex();
    const client = getClient();
    const { index } = getJobSearchConfig();
    await client.delete({
      index,
      id: String(jobPostId),
      refresh: false,
    });
    return { ok: true, id: jobPostId };
  } catch (err) {
    if (err?.meta?.statusCode === 404) return { ok: true, id: jobPostId, missing: true };
    logger.error(ctx, "deleteJobPost failed", jobPostId, err.message || err);
    return { err: err.message || String(err) };
  }
};

/**
 * Full-text search → ordered job post IDs.
 * @returns {{ ok: true, ids: string[], total: number } | { skipped: true } | { err: string }}
 */
const searchJobIds = async (searchTerm, { size = 500 } = {}) => {
  if (!isJobSearchEnabled()) return { skipped: true, reason: "es_disabled" };

  const q = String(searchTerm || "").trim();
  if (q.length < 2) return { skipped: true, reason: "query_too_short" };

  try {
    if (!indexReady) await ensureIndex();

    const client = getClient();
    if (!client) return { skipped: true, reason: "no_client" };

    const { index } = getJobSearchConfig();

    const result = await client.search({
      index,
      size: Math.min(Math.max(Number(size) || 500, 1), 1000),
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: q,
                fields: [
                  "title^4",
                  "company_name^2",
                  "category_name^2",
                  "tags^2",
                  "location",
                  "description",
                ],
                type: "best_fields",
                fuzziness: "AUTO",
                operator: "and",
              },
            },
          ],
          filter: [
            { term: { status_id: 1 } },
            { bool: { must_not: { exists: { field: "archived_at" } } } },
          ],
        },
      },
      sort: ["_score", { created_at: "desc" }],
      _source: false,
    });

    const hits = result?.hits?.hits || [];
    const ids = hits.map((h) => h._id).filter(Boolean);
    const total =
      typeof result?.hits?.total === "object"
        ? Number(result.hits.total.value || 0)
        : Number(result?.hits?.total || ids.length);

    return { ok: true, ids, total };
  } catch (err) {
    logger.error(ctx, "searchJobIds failed", q, err.message || err);
    return { err: err.message || String(err) };
  }
};

/**
 * Bulk reindex all non-deleted job posts from Postgres.
 */
const reindexAll = async (db, { batchSize = 200 } = {}) => {
  if (!isJobSearchEnabled()) return { skipped: true, reason: "es_disabled" };

  await ensureIndex();
  const client = getClient();
  const { index } = getJobSearchConfig();

  let offset = 0;
  let indexed = 0;
  let failed = 0;

  for (;;) {
    const page = await db.executeQuery(
      `
      SELECT
        j.id::text AS id,
        j.title,
        j.description,
        r.company_name,
        j.location,
        j.city,
        j.province,
        (
          SELECT ct.name FROM category_translations ct
          WHERE ct.category_id = j.category_id AND ct.locale = 'id'
          LIMIT 1
        ) AS category_name,
        et.name AS employment_type,
        el.name AS experience_level,
        j.status_id,
        j.boost_type,
        j.is_remote,
        j.archived_at,
        j.created_at,
        j.updated_at,
        COALESCE(
          (
            SELECT array_agg(t.name)
            FROM job_post_tags jpt
            JOIN job_tags t ON t.id = jpt.tag_id
            WHERE jpt.job_post_id = j.id
          ),
          ARRAY[]::text[]
        ) AS tags
      FROM job_posts j
      LEFT JOIN recruiters r ON r.id = j.recruiter_id
      LEFT JOIN employment_types et ON et.id = j.employment_type_id
      LEFT JOIN experience_levels el ON el.id = j.experience_level_id
      ORDER BY j.created_at ASC
      LIMIT $1 OFFSET $2
      `,
      [batchSize, offset]
    );

    const rows = page?.rows || [];
    if (rows.length === 0) break;

    const body = [];
    for (const row of rows) {
      body.push({ index: { _index: index, _id: row.id } });
      body.push(toEsDoc(row));
    }

    try {
      const bulk = await client.bulk({ refresh: false, body });
      if (bulk.errors) {
        const itemErrors = (bulk.items || []).filter((it) => it.index?.error);
        failed += itemErrors.length;
        indexed += rows.length - itemErrors.length;
      } else {
        indexed += rows.length;
      }
    } catch (err) {
      logger.error(ctx, "reindexAll bulk failed", offset, err.message || err);
      failed += rows.length;
    }

    offset += rows.length;
    if (rows.length < batchSize) break;
  }

  return { ok: true, indexed, failed };
};

/**
 * Fire-and-forget sync after job mutations (never throws to callers).
 */
const syncJobPostSafe = (db, jobPostId) => {
  if (!isJobSearchEnabled() || !jobPostId) return;
  setImmediate(() => {
    indexJobPost(db, jobPostId).catch((err) => {
      logger.error(ctx, "syncJobPostSafe", jobPostId, err.message || err);
    });
  });
};

const deleteJobPostSafe = (jobPostId) => {
  if (!isJobSearchEnabled() || !jobPostId) return;
  setImmediate(() => {
    deleteJobPost(jobPostId).catch((err) => {
      logger.error(ctx, "deleteJobPostSafe", jobPostId, err.message || err);
    });
  });
};

module.exports = {
  ensureIndex,
  indexJobPost,
  deleteJobPost,
  searchJobIds,
  reindexAll,
  syncJobPostSafe,
  deleteJobPostSafe,
  isJobSearchEnabled,
};
