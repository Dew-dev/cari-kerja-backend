const { Queue } = require("bullmq");
const config = require("../../config/global_config");
const { getConnection } = require("../databases/redis/connection");
const logger = require("../utils/logger");

const MATCHING_QUEUE_NAME = "matching";
const ctx = "MatchingQueue";

const matchingQueue = new Queue(MATCHING_QUEUE_NAME, {
  connection: getConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 200 },
  },
});

const isMatchingEnabled = () => {
  const matching = config.get("/matching") || {};
  return matching.enabled !== false;
};

const syncCompute = async (application_id) => {
  const DB = require("../databases/postgresql/db");
  const CommandDomain = require("../../modules/candidate_matching/repositories/commands/domain");
  const domain = new CommandDomain(new DB(config.get("/postgresqlUrl")));
  return domain.computeApplicationMatch({
    application_id,
    force: true,
  });
};

/**
 * @param {string} application_id
 * @param {import("bullmq").JobsOptions & { force?: boolean }} [opts]
 */
const enqueueComputeApplicationMatch = async (application_id, opts = {}) => {
  if (!isMatchingEnabled()) return null;
  if (!application_id) return null;

  try {
    // Sticky jobId for auto kickoff prevents poll storms; rematch/force gets unique id.
    const force = Boolean(opts.force);
    const jobId =
      opts.jobId ||
      (force
        ? `compute-app-${application_id}-${Date.now()}`
        : `compute-app-${application_id}`);

    return await matchingQueue.add(
      "compute_application_match",
      { application_id, force },
      {
        ...opts,
        jobId,
      },
    );
  } catch (err) {
    // BullMQ throws when sticky jobId already waiting/active — treat as already queued.
    if (/already exists|Job.*exists/i.test(String(err.message || ""))) {
      logger.info(ctx, "enqueueComputeApplicationMatch already queued", application_id);
      return { id: `existing-${application_id}`, alreadyQueued: true };
    }
    logger.error(ctx, "enqueueComputeApplicationMatch failed", application_id, err.message || err);
    return null;
  }
};

/**
 * Prefer async queue; if Redis/queue fails, compute synchronously so UI
 * never stays stuck on "Calculating…".
 * Pass { preferSync: true } for drawer/pipeline paths that need a terminal score now.
 */
const enqueueOrComputeApplicationMatch = async (application_id, opts = {}) => {
  if (!isMatchingEnabled()) return { mode: "skipped" };
  if (!application_id) return { mode: "skipped" };

  if (opts.preferSync) {
    try {
      const result = await syncCompute(application_id);
      if (result.err) {
        logger.error(
          ctx,
          "preferSync compute failed",
          application_id,
          result.err.message || result.err,
        );
        return { mode: "failed", error: result.err };
      }
      return { mode: "sync", data: result.data };
    } catch (err) {
      logger.error(ctx, "preferSync threw", application_id, err.message || err);
      // Fall through to queue as last resort
    }
  }

  const job = await enqueueComputeApplicationMatch(application_id, opts);
  if (job) return { mode: "queued", job };

  try {
    const result = await syncCompute(application_id);
    if (result.err) {
      logger.error(
        ctx,
        "enqueueOrComputeApplicationMatch sync failed",
        application_id,
        result.err.message || result.err,
      );
      return { mode: "failed", error: result.err };
    }
    return { mode: "sync", data: result.data };
  } catch (err) {
    logger.error(ctx, "enqueueOrComputeApplicationMatch sync threw", application_id, err.message || err);
    return { mode: "failed", error: err };
  }
};

/**
 * @param {string} job_post_id
 */
const enqueueRecomputeJobMatches = async (job_post_id, opts = {}) => {
  if (!isMatchingEnabled()) return null;
  if (!job_post_id) return null;

  try {
    return await matchingQueue.add(
      "recompute_job_matches",
      { job_post_id },
      {
        jobId: `recompute-job-${job_post_id}-${Date.now()}`,
        ...opts,
      },
    );
  } catch (err) {
    logger.error(ctx, "enqueueRecomputeJobMatches failed", job_post_id, err.message || err);
    return null;
  }
};

/**
 * @param {string} worker_id
 */
const enqueueRecomputeWorkerMatches = async (worker_id, opts = {}) => {
  if (!isMatchingEnabled()) return null;
  if (!worker_id) return null;

  try {
    return await matchingQueue.add(
      "recompute_worker_matches",
      { worker_id },
      {
        jobId: `recompute-worker-${worker_id}-${Date.now()}`,
        ...opts,
      },
    );
  } catch (err) {
    logger.error(ctx, "enqueueRecomputeWorkerMatches failed", worker_id, err.message || err);
    return null;
  }
};

/**
 * Reindex PG entity_embeddings → Elasticsearch dense_vector indices.
 */
const enqueueReindexElasticsearch = async (opts = {}) => {
  if (!isMatchingEnabled()) return null;

  try {
    return await matchingQueue.add(
      "reindex_elasticsearch",
      {},
      {
        jobId: `reindex-es-${Date.now()}`,
        ...opts,
      },
    );
  } catch (err) {
    logger.error(ctx, "enqueueReindexElasticsearch failed", "queue", err.message || err);
    return null;
  }
};

module.exports = {
  matchingQueue,
  MATCHING_QUEUE_NAME,
  enqueueComputeApplicationMatch,
  enqueueOrComputeApplicationMatch,
  enqueueRecomputeJobMatches,
  enqueueRecomputeWorkerMatches,
  enqueueReindexElasticsearch,
};
