const Redis = require("ioredis");
const logger = require("../../utils/logger");

let redisClient = null;

const init = () => {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck: false,
  });

  redisClient.on("connect", () => {
    logger.info("redis connection", "connected", "redis initiation");
  });

  redisClient.on("error", (err) => {
    logger.error("redis connection", "connection error", "redis", err.message || err);
  });

  return redisClient;
};

const getConnection = () => {
  if (!redisClient) {
    return init();
  }
  return redisClient;
};

module.exports = { init, getConnection };
