const logger = require("../utils/logger");

const ctx = "Rate-Limit-Store";

/**
 * Create a Redis-backed store for express-rate-limit (multi-instance safe).
 * Falls back to undefined → in-memory store when Redis is unavailable.
 *
 * Each limiter MUST get its own store instance with a unique prefix.
 *
 * @param {string} prefix e.g. "login", "apply"
 * @returns {import("rate-limit-redis").RedisStore | undefined}
 */
const createRateLimitStore = (prefix) => {
  try {
    // Lazy require so unit tests / cold start without Redis still boot
    const { RedisStore } = require("rate-limit-redis");
    const redisConnection = require("../databases/redis/connection");
    const client = redisConnection.getConnection();

    return new RedisStore({
      prefix: `rl:${String(prefix || "default").replace(/[^a-z0-9_-]/gi, "")}:`,
      sendCommand: (...args) => client.call(...args),
    });
  } catch (err) {
    logger.error(ctx, "createRateLimitStore", err.message || err);
    return undefined;
  }
};

module.exports = { createRateLimitStore };
