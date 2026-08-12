const logger = require("../utils/logger");
const redisConnection = require("../databases/redis/connection");

const ctx = "Job-Search-Block";
/** Temporary IP block after exceeding the search rate limit */
const BLOCK_TTL_SECONDS = 5 * 60;

const keyFor = (ip) => `job_search_block:${String(ip || "unknown")}`;

const getClient = () => {
  try {
    return redisConnection.getConnection();
  } catch (_) {
    return null;
  }
};

const isBlocked = async (ip) => {
  const client = getClient();
  if (!client) return false;
  try {
    const n = await client.exists(keyFor(ip));
    return n === 1;
  } catch (err) {
    logger.error(ctx, "isBlocked", err.message || err);
    return false;
  }
};

const blockIp = async (ip, ttlSeconds = BLOCK_TTL_SECONDS) => {
  const client = getClient();
  if (!client) return;
  try {
    await client.set(keyFor(ip), "1", "EX", ttlSeconds);
  } catch (err) {
    logger.error(ctx, "blockIp", err.message || err);
  }
};

const getTtlSeconds = async (ip) => {
  const client = getClient();
  if (!client) return 0;
  try {
    const ttl = await client.ttl(keyFor(ip));
    return ttl > 0 ? ttl : 0;
  } catch (err) {
    logger.error(ctx, "getTtlSeconds", err.message || err);
    return 0;
  }
};

module.exports = {
  BLOCK_TTL_SECONDS,
  isBlocked,
  blockIp,
  getTtlSeconds,
};
