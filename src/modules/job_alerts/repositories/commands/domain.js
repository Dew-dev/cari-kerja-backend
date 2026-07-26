const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const {
  NotFoundError,
  BadRequestError,
  InternalServerError,
} = require("../../../../helpers/errors");
const jobAlertsEmailTemplate = require("../../../../helpers/utils/jobAlertsEmailTemplate");
const notificationService = require("../../../../helpers/notifications/NotificationService");
const config = require("../../../../config/global_config");

const ctx = "JobAlerts-Command-Domain";
const JOBS_PER_EMAIL = 10;
const WORKER_BATCH_SIZE = 100;

class JobAlertsCommand {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async updatePreferences(payload) {
    const { worker_id, enabled } = payload;

    const pref = await this.query.findWorkerJobAlertsPreference(worker_id);
    if (pref.err) {
      return wrapper.error(new InternalServerError("Failed to fetch job alerts preference"));
    }
    if (!pref.data) {
      return wrapper.error(new NotFoundError("Worker not found"));
    }

    const hasEmail = Boolean(pref.data.email && String(pref.data.email).trim());
    const telegramAvailable =
      pref.data.login_provider === "telegram" &&
      Boolean(pref.data.telegram_chat_id);

    if (!hasEmail && !telegramAvailable) {
      return wrapper.error(
        new BadRequestError(
          "Job alerts memerlukan email atau notifikasi Telegram yang sudah diaktifkan.",
        ),
      );
    }

    const result = await this.command.updateJobAlertsEnabled({
      worker_id,
      enabled,
    });

    if (result.err || !result.data) {
      return wrapper.error(new InternalServerError("Failed to update job alerts preference"));
    }

    return wrapper.data({
      enabled: result.data.job_alerts_enabled,
      has_email: hasEmail,
      telegram_available: telegramAvailable,
      active: result.data.job_alerts_enabled && (hasEmail || telegramAvailable),
    });
  }

  /**
   * Daily digests for all eligible workers. Safe to call repeatedly;
   * skips workers already sent today (Asia/Jakarta).
   * Uses NotificationService — scheduler must not know Telegram details.
   */
  async runDailyJobAlerts() {
    let processed = 0;
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    logger.info(ctx, "runDailyJobAlerts", "Starting daily job alerts run");

    let guard = 0;
    const maxLoops = 1000;
    const feUrl = (config.get("/frontendUrl") || "").replace(/\/$/, "");

    // eslint-disable-next-line no-constant-condition
    while (true) {
      guard += 1;
      if (guard > maxLoops) {
        logger.error(ctx, "runDailyJobAlerts", "Aborted: max loop guard reached");
        break;
      }
      const workersResult = await this.query.findEligibleWorkers({
        limit: WORKER_BATCH_SIZE,
        offset: 0,
      });

      if (workersResult.err) {
        logger.error(ctx, "runDailyJobAlerts", "Failed to load workers", workersResult.err);
        return wrapper.error(new InternalServerError("Failed to load eligible workers"));
      }

      const workers = workersResult.data || [];
      if (workers.length === 0) break;

      for (const worker of workers) {
        processed += 1;
        try {
          const jobsResult = await this.query.findMatchingJobsForWorker(worker.worker_id, {
            limit: JOBS_PER_EMAIL,
          });

          if (jobsResult.err) {
            failed += 1;
            logger.error(ctx, "runDailyJobAlerts", "Match query failed", {
              worker_id: worker.worker_id,
              err: jobsResult.err,
            });
            await this.command.markJobAlertsSent(worker.worker_id);
            continue;
          }

          const jobs = jobsResult.data || [];
          if (jobs.length === 0) {
            skipped += 1;
            await this.command.markJobAlertsSent(worker.worker_id);
            continue;
          }

          const actionUrl = feUrl ? `${feUrl}/jobs` : undefined;
          const emailPayload =
            worker.email && String(worker.email).trim()
              ? {
                  to: worker.email,
                  subject: `${jobs.length} rekomendasi lowongan untuk Anda hari ini`,
                  html: jobAlertsEmailTemplate({
                    name: worker.worker_name,
                    jobs,
                  }),
                }
              : null;

          await notificationService.notify({
            user: {
              id: worker.user_id,
              email: worker.email,
              login_provider: worker.login_provider,
              telegram_chat_id: worker.telegram_chat_id,
              name: worker.worker_name,
            },
            type: "job_alert",
            data: {
              name: worker.worker_name,
              jobs: jobs.map((j) => ({
                title: j.title,
                company: j.company_name,
                url: j.id && feUrl ? `${feUrl}/jobposts/${j.id}` : undefined,
              })),
              actionUrl,
            },
            email: emailPayload,
          });

          await this.command.markJobAlertsSent(worker.worker_id);
          sent += 1;
        } catch (err) {
          failed += 1;
          logger.error(ctx, "runDailyJobAlerts", "Failed for worker", {
            worker_id: worker.worker_id,
            err: err.message,
          });
          try {
            await this.command.markJobAlertsSent(worker.worker_id);
          } catch (_) {
            // ignore
          }
        }
      }

      if (workers.length < WORKER_BATCH_SIZE) break;
    }

    const summary = { processed, sent, skipped, failed };
    logger.info(ctx, "runDailyJobAlerts", "Completed", summary);
    return wrapper.data(summary);
  }
}

module.exports = JobAlertsCommand;
