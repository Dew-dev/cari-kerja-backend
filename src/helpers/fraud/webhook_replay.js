const logger = require("../utils/logger");
const redisConnection = require("../databases/redis/connection");

const ctx = "Webhook-Replay";
const TTL_SECONDS = 24 * 60 * 60;

const keyFor = (externalId, status) =>
  `xendit:webhook:${String(externalId || "").trim()}:${String(status || "")
    .toUpperCase()
    .trim()}`;

/**
 * Claim a webhook delivery once (SET NX). Soft-fail open if Redis down
 * so payment activation is not blocked by cache outage.
 *
 * @returns {Promise<{ claimed: boolean, skipped?: boolean }>}
 */
const claimWebhookDelivery = async (externalId, status) => {
  if (!externalId || !status) {
    return { claimed: true, skipped: true };
  }

  try {
    const client = redisConnection.getConnection();
    const result = await client.set(
      keyFor(externalId, status),
      "1",
      "EX",
      TTL_SECONDS,
      "NX"
    );
    return { claimed: result === "OK" };
  } catch (err) {
    logger.error(ctx, "claimWebhookDelivery", err.message);
    return { claimed: true, skipped: true };
  }
};

module.exports = {
  claimWebhookDelivery,
  TTL_SECONDS,
};
