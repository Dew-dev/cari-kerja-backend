#!/usr/bin/env node
/**
 * Backfill Smart Candidate Matching scores for all existing job_applications.
 *
 * Usage (from repo root, with Redis + Postgres available):
 *   node scripts/backfill_application_matches.js
 *
 * Requires MATCHING_ENABLED=true (default) and REDIS_URL.
 * Jobs are enqueued to BullMQ `matching` queue; matching.worker must be running
 * (started automatically with the API server via `npm run start` / `npm run dev`).
 */

require("dotenv").config();
const redisConnection = require("../src/helpers/databases/redis/connection");
const pgConnectionPool = require("../src/helpers/databases/postgresql/connection");
const config = require("../src/config/global_config");
const commandHandler = require("../src/modules/candidate_matching/repositories/commands/command_handler");

const main = async () => {
  pgConnectionPool.init(config.get("/postgresqlUrl"));
  redisConnection.init();

  console.log("[backfill] Enqueueing compute_application_match for all applications...");
  const result = await commandHandler.backfillAllApplications();

  if (result.err) {
    console.error("[backfill] Failed:", result.err.message || result.err);
    process.exitCode = 1;
  } else {
    console.log(`[backfill] Enqueued ${result.data.enqueued} jobs.`);
    console.log("[backfill] Keep the API server (matching worker) running until the queue drains.");
  }

  try {
    const { matchingQueue } = require("../src/helpers/queues/matching.queue");
    await matchingQueue.close();
  } catch {
    // ignore
  }

  process.exit(process.exitCode || 0);
};

main().catch((err) => {
  console.error("[backfill] Unexpected error:", err.message || err);
  process.exit(1);
});
