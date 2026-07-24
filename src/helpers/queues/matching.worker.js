const { Worker } = require("bullmq");
const { getConnection } = require("../databases/redis/connection");
const config = require("../../config/global_config");
const DB = require("../databases/postgresql/db");
const logger = require("../utils/logger");
const { MATCHING_QUEUE_NAME } = require("./matching.queue");
const CommandDomain = require("../../modules/candidate_matching/repositories/commands/domain");
const Query = require("../../modules/candidate_matching/repositories/queries/query");
const { ensureIndices } = require("../../modules/candidate_matching/services/elasticsearch_index");
const { isEnabled: isEsEnabled } = require("../databases/elasticsearch/client");

const ctx = "MatchingWorker";

let matchingWorker = null;

const start = () => {
  if (matchingWorker) return matchingWorker;

  const db = new DB(config.get("/postgresqlUrl"));
  const domain = new CommandDomain(db);
  const query = new Query(db);

  if (isEsEnabled()) {
    ensureIndices().catch((err) => {
      logger.error(ctx, "ensureIndices on start failed", "matching.worker", err.message || err);
    });
  }

  matchingWorker = new Worker(
    MATCHING_QUEUE_NAME,
    async (job) => {
      logger.info(ctx, `Processing ${job.name}`, job.id);

      if (job.name === "compute_application_match") {
        const { application_id } = job.data || {};
        const result = await domain.computeApplicationMatch({
          application_id,
          force: Boolean(job.data?.force),
        });
        if (result.err) {
          throw new Error(result.err.message || "compute_application_match failed");
        }
        return result.data;
      }

      if (job.name === "recompute_job_matches") {
        const { job_post_id } = job.data || {};
        const apps = await query.findApplicationIdsByJobPost(job_post_id);
        if (apps.err) {
          throw new Error("Failed to load applications for job rematch");
        }
        const results = [];
        for (const application_id of apps.data || []) {
          const result = await domain.computeApplicationMatch({
            application_id,
            force: true,
          });
          if (result.err) {
            logger.error(ctx, "recompute_job_matches item failed", application_id, result.err);
          } else {
            results.push(application_id);
          }
        }
        return { recomputed: results.length };
      }

      if (job.name === "recompute_worker_matches") {
        const { worker_id } = job.data || {};
        const apps = await query.findApplicationIdsByWorker(worker_id);
        if (apps.err) {
          throw new Error("Failed to load applications for worker rematch");
        }
        const results = [];
        for (const application_id of apps.data || []) {
          const result = await domain.computeApplicationMatch({
            application_id,
            force: true,
          });
          if (result.err) {
            logger.error(ctx, "recompute_worker_matches item failed", application_id, result.err);
          } else {
            results.push(application_id);
          }
        }
        return { recomputed: results.length };
      }

      if (job.name === "reindex_elasticsearch") {
        const result = await domain.reindexElasticsearchEmbeddings();
        if (result.err) {
          throw new Error(result.err.message || "reindex_elasticsearch failed");
        }
        return result.data;
      }

      throw new Error(`Unknown matching job: ${job.name}`);
    },
    {
      connection: getConnection(),
      concurrency: 2,
    },
  );

  matchingWorker.on("completed", (job) => {
    logger.info(ctx, `Job ${job.id} succeeded`, job.name);
  });

  matchingWorker.on("failed", (job, err) => {
    logger.error(ctx, `Job ${job?.id} failed`, job?.name || "matching.worker", err.message);
  });

  matchingWorker.on("error", (err) => {
    logger.error(ctx, "Worker error", "matching.worker", err.message);
  });

  logger.info(ctx, "Matching worker started", "matching.worker");
  return matchingWorker;
};

const stop = async () => {
  if (matchingWorker) {
    await matchingWorker.close();
    matchingWorker = null;
    logger.info(ctx, "Matching worker stopped", "matching.worker");
  }
};

module.exports = { start, stop };
