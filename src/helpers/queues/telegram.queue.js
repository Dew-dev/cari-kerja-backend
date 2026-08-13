const { Queue } = require("bullmq");
const { getConnection } = require("../databases/redis/connection");
const config = require("../../config/global_config");

const TELEGRAM_QUEUE_NAME = "telegram";

const rateLimitMax = Number(config.get("/telegramBot/rateLimitMax") || 25);
const rateLimitDuration = Number(
  config.get("/telegramBot/rateLimitDuration") || 1000
);

const telegramQueue = new Queue(TELEGRAM_QUEUE_NAME, {
  connection: getConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
});

/**
 * Enqueue a Telegram send job.
 * @param {{
 *   chatId: string,
 *   text: string,
 *   parseMode?: string,
 *   userId?: string,
 *   notificationType?: string,
 *   recipient_id?: string
 * }} data
 */
const addTelegramJob = async (data, opts = {}) => {
  return telegramQueue.add("send-telegram", data, {
    ...opts,
  });
};

module.exports = {
  telegramQueue,
  addTelegramJob,
  TELEGRAM_QUEUE_NAME,
  rateLimitMax,
  rateLimitDuration,
};
