const { Worker } = require("bullmq");
const { getConnection } = require("../databases/redis/connection");
const { sendMail } = require("../utils/mailer");
const {
  markRecipientSent,
  markRecipientFailed,
} = require("./communicationRecipientStatus");
const { logNotification } = require("../notifications/logging/notificationLogger");
const logger = require("../utils/logger");

const ctx = "EmailWorker";

let emailWorker = null;

const start = () => {
  if (emailWorker) return emailWorker;

  emailWorker = new Worker(
    "email",
    async (job) => {
      const {
        to,
        subject,
        html,
        recipient_id,
        userId = null,
        notificationType = "email",
      } = job.data;
      logger.info(ctx, `Processing job ${job.id}`, `Sending email to ${to}`);
      const started = Date.now();

      try {
        await sendMail({ to, subject, html });
        await logNotification({
          userId,
          channel: "email",
          notificationType,
          receiver: to,
          status: "sent",
          durationMs: Date.now() - started,
        });
        if (recipient_id) {
          await markRecipientSent(recipient_id);
        }
        logger.info(ctx, `Job ${job.id} completed`, `Email sent to ${to}`);
      } catch (err) {
        await logNotification({
          userId,
          channel: "email",
          notificationType,
          receiver: to,
          status: "failed",
          durationMs: Date.now() - started,
          error: err.message,
        });
        if (recipient_id) {
          await markRecipientFailed(recipient_id, err.message);
        }
        throw err;
      }
    },
    {
      connection: getConnection(),
      concurrency: 5,
    },
  );

  emailWorker.on("completed", (job) => {
    logger.info(ctx, `Job ${job.id} succeeded`, "email.worker");
  });

  emailWorker.on("failed", (job, err) => {
    logger.error(ctx, `Job ${job?.id} failed`, "email.worker", err.message);
  });

  emailWorker.on("error", (err) => {
    logger.error(ctx, "Worker error", "email.worker", err.message);
  });

  logger.info(ctx, "Email worker started", "email.worker");

  return emailWorker;
};

const stop = async () => {
  if (emailWorker) {
    await emailWorker.close();
    emailWorker = null;
    logger.info(ctx, "Email worker stopped", "email.worker");
  }
};

module.exports = { start, stop };
