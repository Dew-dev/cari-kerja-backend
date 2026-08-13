const cron = require("node-cron");
const logger = require("../utils/logger");
const config = require("../../config/global_config");
const DB = require("../databases/postgresql/db");
const JobPostsQuery = require("../../modules/job_posts/repositories/queries/query");

const ctx = "JobBoostExpiryScheduler";

let task = null;

/**
 * Clear expired job boosts (HOT / top10 flags) every hour.
 * Listing also clears lazily; this keeps badges consistent without traffic.
 */
const start = () => {
  if (task) return task;

  task = cron.schedule(
    "15 * * * *",
    async () => {
      logger.info(ctx, "cron", "Clearing expired job boosts");
      try {
        const db = new DB(config.get("/postgresqlUrl"));
        const query = new JobPostsQuery(db);
        const result = await query.clearExpiredJobBoosts();
        if (result.err) {
          logger.error(ctx, "cron", "Failed to clear expired boosts", result.err);
          return;
        }
        logger.info(ctx, "cron", "Expired boosts cleared", result.data);
      } catch (err) {
        logger.error(ctx, "cron", "Unhandled error clearing expired boosts", err);
      }
    },
    { timezone: "Asia/Jakarta" }
  );

  logger.info(ctx, "start", "Job boost expiry scheduler started (hourly at :15 Asia/Jakarta)");
  return task;
};

const stop = () => {
  if (task) {
    task.stop();
    task = null;
    logger.info(ctx, "stop", "Job boost expiry scheduler stopped");
  }
};

module.exports = { start, stop };
