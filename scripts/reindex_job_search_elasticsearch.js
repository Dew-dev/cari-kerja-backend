#!/usr/bin/env node
/**
 * Reindex job_posts into Elasticsearch for public job search.
 *
 * Prerequisites:
 *   JOB_SEARCH_ES_ENABLED=true
 *   ELASTICSEARCH_NODE=http://localhost:9200
 *
 * Usage:
 *   node scripts/reindex_job_search_elasticsearch.js
 */

require("dotenv").config();
const config = require("../src/config/global_config");
const DB = require("../src/helpers/databases/postgresql/db");
const {
  isJobSearchEnabled,
  reindexAll,
  ensureIndex,
} = require("../src/modules/job_posts/services/elasticsearch_job_search");

const main = async () => {
  if (!isJobSearchEnabled()) {
    console.error("[reindex-job-search] JOB_SEARCH_ES_ENABLED is not true. Aborting.");
    process.exit(1);
  }

  const db = new DB(config.get("/postgresqlUrl"));

  console.log("[reindex-job-search] Ensuring index...");
  await ensureIndex();

  console.log("[reindex-job-search] Reindexing job posts...");
  const result = await reindexAll(db);

  if (result.err || result.skipped) {
    console.error("[reindex-job-search] Failed:", result.err || result.reason);
    process.exitCode = 1;
  } else {
    console.log(
      `[reindex-job-search] Done. indexed=${result.indexed} failed=${result.failed}`,
    );
  }

  process.exit(process.exitCode || 0);
};

main().catch((err) => {
  console.error("[reindex-job-search] Unexpected error:", err.message || err);
  process.exit(1);
});
