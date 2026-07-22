const cron = require("node-cron");
const logger = require("../utils/logger");
const commandHandler = require("../../modules/employer_verification/repositories/commands/command_handler");

const ctx = "EmployerVerificationScheduler";

let task = null;

/**
 * Auto-block recruiters past verification grace deadline without submitted docs.
 * Runs hourly at minute 15 Asia/Jakarta.
 */
const start = () => {
  if (task) return task;

  task = cron.schedule(
    "15 * * * *",
    async () => {
      logger.info(ctx, "cron", "Running employer verification auto-block");
      try {
        const result = await commandHandler.runAutoBlockExpired();
        if (result.err) {
          logger.error(ctx, "cron", "Auto-block failed", result.err);
          return;
        }
        logger.info(ctx, "cron", "Auto-block finished", result.data);
      } catch (err) {
        logger.error(ctx, "cron", "Unhandled error in auto-block", err);
      }
    },
    { timezone: "Asia/Jakarta" }
  );

  logger.info(
    ctx,
    "start",
    "Employer verification auto-block scheduler started (hourly :15 Asia/Jakarta)"
  );
  return task;
};

const stop = () => {
  if (task) {
    task.stop();
    task = null;
    logger.info(ctx, "stop", "Employer verification scheduler stopped");
  }
};

module.exports = { start, stop };
