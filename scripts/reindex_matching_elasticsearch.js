#!/usr/bin/env node
/**
 * Reindex entity_embeddings from Postgres into Elasticsearch dense_vector indices.
 *
 * Prerequisites:
 *   MATCHING_ES_ENABLED=true
 *   ELASTICSEARCH_NODE=http://localhost:9200
 *   MATCHING_EMBEDDING_DIMS must match stored vectors (default 256 for local BoW)
 *
 * Usage:
 *   node scripts/reindex_matching_elasticsearch.js
 */

require("dotenv").config();
const redisConnection = require("../src/helpers/databases/redis/connection");
const pgConnectionPool = require("../src/helpers/databases/postgresql/connection");
const config = require("../src/config/global_config");
const commandHandler = require("../src/modules/candidate_matching/repositories/commands/command_handler");
const { isEnabled } = require("../src/helpers/databases/elasticsearch/client");

const main = async () => {
  if (!isEnabled()) {
    console.error("[reindex-es] MATCHING_ES_ENABLED is not true. Aborting.");
    process.exit(1);
  }

  pgConnectionPool.init(config.get("/postgresqlUrl"));
  redisConnection.init();

  console.log("[reindex-es] Reindexing embeddings into Elasticsearch...");
  const result = await commandHandler.reindexElasticsearchEmbeddings();

  if (result.err) {
    console.error("[reindex-es] Failed:", result.err.message || result.err);
    process.exitCode = 1;
  } else {
    console.log(
      `[reindex-es] Done. indexed=${result.data.indexed} skipped=${result.data.skipped} failed=${result.data.failed}`,
    );
  }

  process.exit(process.exitCode || 0);
};

main().catch((err) => {
  console.error("[reindex-es] Unexpected error:", err.message || err);
  process.exit(1);
});
