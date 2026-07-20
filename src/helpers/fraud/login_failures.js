const logger = require("../utils/logger");
const redisConnection = require("../databases/redis/connection");

const ctx = "Login-Failures";
const TTL_SECONDS = 15 * 60;
const THRESHOLD = 3;

const keyFor = (identity) => `login_fail:${String(identity || "").toLowerCase().trim()}`;

const getClient = () => {
  try {
    return redisConnection.getConnection();
  } catch (_) {
    return null;
  }
};

const getFailureCount = async (identity) => {
  const client = getClient();
  if (!client) return 0;
  try {
    const n = await client.get(keyFor(identity));
    return parseInt(n || "0", 10);
  } catch (err) {
    logger.error(ctx, "getFailureCount", err.message);
    return 0;
  }
};

const incrementFailure = async (identity) => {
  const client = getClient();
  if (!client) return 0;
  try {
    const key = keyFor(identity);
    const n = await client.incr(key);
    if (n === 1) await client.expire(key, TTL_SECONDS);
    return n;
  } catch (err) {
    logger.error(ctx, "incrementFailure", err.message);
    return 0;
  }
};

const clearFailures = async (identity) => {
  const client = getClient();
  if (!client) return;
  try {
    await client.del(keyFor(identity));
  } catch (err) {
    logger.error(ctx, "clearFailures", err.message);
  }
};

const requiresCaptcha = async (identity) => {
  const count = await getFailureCount(identity);
  return count >= THRESHOLD;
};

module.exports = {
  THRESHOLD,
  getFailureCount,
  incrementFailure,
  clearFailures,
  requiresCaptcha,
};
