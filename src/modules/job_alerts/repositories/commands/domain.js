const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const {
  NotFoundError,
  BadRequestError,
  InternalServerError,
} = require("../../../../helpers/errors");
const { addEmailJob } = require("../../../../helpers/queues/email.queue");
const jobAlertsEmailTemplate = require("../../../../helpers/utils/jobAlertsEmailTemplate");

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
    if (pref.err || !pref.data) {
      return wrapper.error(new NotFoundError("Worker not found"));
    }

    if (!pref.data.email) {
      return wrapper.error(
        new BadRequestError(
          "Job alerts memerlukan email. Tambahkan email ke akun Anda terlebih dahulu.",
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
      has_email: true,
      active: result.data.job_alerts_enabled,
    });
  }

  /**
   * Daily digests for all eligible workers. Safe to call repeatedly;
   * skips workers already sent today (Asia/Jakarta).
   */
  async runDailyJobAlerts() {
    let processed = 0;
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    logger.info(ctx, "runDailyJobAlerts", "Starting daily job alerts run");

    let guard = 0;
    const maxLoops = 1000;

    // Selalu offset 0: worker yang sudah di-mark sent keluar dari eligible set,
    // sehingga batch berikutnya mengambil sisa tanpa melewatkan baris.
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
            // Tandai agar tidak mengulang worker yang sama tanpa batas di batch berikutnya
            await this.command.markJobAlertsSent(worker.worker_id);
            continue;
          }

          const jobs = jobsResult.data || [];
          if (jobs.length === 0) {
            skipped += 1;
            // Tandai juga agar tidak di-query ulang setiap loop hari ini
            await this.command.markJobAlertsSent(worker.worker_id);
            continue;
          }

          await addEmailJob({
            to: worker.email,
            subject: `${jobs.length} rekomendasi lowongan untuk Anda hari ini`,
            html: jobAlertsEmailTemplate({
              name: worker.worker_name,
              jobs,
            }),
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
