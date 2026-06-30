const { Queue } = require("bullmq");
const { getConnection } = require("../databases/redis/connection");

const EMAIL_QUEUE_NAME = "email";

const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
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
 * Add an email job to the queue.
 * @param {{ to: string, subject: string, html: string }} data
 * @param {import("bullmq").JobsOptions} [opts]
 */
const addEmailJob = async (data, opts = {}) => {
  return emailQueue.add("send-email", data, opts);
};

module.exports = { emailQueue, addEmailJob };
