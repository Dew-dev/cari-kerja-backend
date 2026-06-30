/**
 * Manual test script for Redis + BullMQ email queue.
 * Run: node test-queue.js
 *
 * Prerequisites: Redis must be running (e.g. docker run -d -p 6379:6379 redis:alpine)
 * Also make sure MAIL_* env vars are set (or just watch console logs).
 */

const redisConnection = require("./src/helpers/databases/redis/connection");
const { addEmailJob } = require("./src/helpers/queues/email.queue");
const emailWorker = require("./src/helpers/queues/email.worker");

async function main() {
  console.log("🔌 Connecting to Redis...");
  redisConnection.init();

  // Give redis a moment to connect
  await new Promise((r) => setTimeout(r, 500));

  console.log("🚀 Starting email worker...");
  const worker = emailWorker.start();

  worker.on("completed", (job) => {
    console.log(`✅ Job ${job.id} completed — email sent`);
  });

  worker.on("failed", (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
  });

  console.log("📨 Adding test email job to queue...");
  const job = await addEmailJob({
    to: "test@example.com",
    subject: "BullMQ Test Email",
    html: "<h1>Hello from BullMQ!</h1><p>Queue is working correctly.</p>",
  });

  console.log(`📦 Job added — ID: ${job.id}`);

  // Wait for worker to process it
  await new Promise((r) => setTimeout(r, 5000));

  console.log("🛑 Stopping worker...");
  await emailWorker.stop();
  await redisConnection.getConnection().quit();

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
