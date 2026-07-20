const cron = require("node-cron");
const logger = require("../utils/logger");
const commandHandler = require("../../modules/job_alerts/repositories/commands/command_handler");

const ctx = "JobAlertsScheduler";

let task = null;

/**
 * Schedule daily job alerts at 08:00 Asia/Jakarta.
 */
const start = () => {
  if (task) return task;

  // minute hour day-of-month month day-of-week
  task = cron.schedule(
    "0 8 * * *",
    async () => {
      logger.info(ctx, "cron", "Running daily job alerts (08:00 Asia/Jakarta)");
      try {
        const result = await commandHandler.runDailyJobAlerts();
        if (result.err) {
          logger.error(ctx, "cron", "Daily job alerts failed", result.err);
          return;
        }
        logger.info(ctx, "cron", "Daily job alerts finished", result.data);
      } catch (err) {
        logger.error(ctx, "cron", "Unhandled error in daily job alerts", err);
      }
    },
    {
      timezone: "Asia/Jakarta",
    },
  );

  logger.info(ctx, "start", "Job alerts scheduler started (daily 08:00 Asia/Jakarta)");
  return task;
};

const stop = () => {
  if (task) {
    task.stop();
    task = null;
    logger.info(ctx, "stop", "Job alerts scheduler stopped");
  }
};

module.exports = { start, stop };
