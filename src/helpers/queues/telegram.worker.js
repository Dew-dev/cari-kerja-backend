const { Worker } = require("bullmq");
const { getConnection } = require("../databases/redis/connection");
const telegramService = require("../notifications/telegram/TelegramNotificationService");
const { logNotification } = require("../notifications/logging/notificationLogger");
const {
  markRecipientSent,
  markRecipientFailed,
} = require("./communicationRecipientStatus");
const {
  TELEGRAM_QUEUE_NAME,
  rateLimitMax,
  rateLimitDuration,
} = require("./telegram.queue");
const logger = require("../utils/logger");

const ctx = "TelegramWorker";

let telegramWorker = null;

const start = () => {
  if (telegramWorker) return telegramWorker;

  telegramWorker = new Worker(
    TELEGRAM_QUEUE_NAME,
    async (job) => {
      const {
        chatId,
        text,
        parseMode,
        userId,
        notificationType = "generic",
        recipient_id,
      } = job.data;

      logger.info(ctx, `Processing job ${job.id}`, "send-telegram");
      const started = Date.now();

      try {
        const result = await telegramService.sendMessage({
          chatId,
          text,
          parseMode,
        });
        const durationMs = result.durationMs ?? Date.now() - started;

        await logNotification({
          userId: userId || null,
          channel: "telegram",
          notificationType,
          receiver: String(chatId),
          status: "sent",
          durationMs,
        });

        if (recipient_id) {
          await markRecipientSent(recipient_id);
        }
      } catch (err) {
        const durationMs = err.durationMs ?? Date.now() - started;
        await logNotification({
          userId: userId || null,
          channel: "telegram",
          notificationType,
          receiver: String(chatId),
          status: "failed",
          durationMs,
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
      concurrency: 2,
      limiter: {
        max: rateLimitMax,
        duration: rateLimitDuration,
      },
    }
  );

  telegramWorker.on("completed", (job) => {
    logger.info(ctx, `Job ${job.id} succeeded`, "telegram.worker");
  });

  telegramWorker.on("failed", (job, err) => {
    logger.error(ctx, `Job ${job?.id} failed`, "telegram.worker", err.message);
  });

  telegramWorker.on("error", (err) => {
    logger.error(ctx, "Worker error", "telegram.worker", err.message);
  });

  logger.info(ctx, "Telegram worker started", "telegram.worker");
  return telegramWorker;
};

const stop = async () => {
  if (telegramWorker) {
    await telegramWorker.close();
    telegramWorker = null;
    logger.info(ctx, "Telegram worker stopped", "telegram.worker");
  }
};

module.exports = { start, stop };
