const crypto = require("crypto");
const config = require("../../../config/global_config");
const DB = require("../../databases/postgresql/db");
const logger = require("../../utils/logger");

const ctx = "NotificationLogger";

let dbInstance = null;

function getDb() {
  if (!dbInstance) {
    dbInstance = new DB(config.get("/postgresqlUrl"));
  }
  return dbInstance;
}

const maskReceiver = (channel, receiver) => {
  if (!receiver) return "";
  if (channel === "telegram") {
    const hash = crypto
      .createHash("sha256")
      .update(String(receiver))
      .digest("hex")
      .slice(0, 12);
    return `tg:${hash}`;
  }
  const email = String(receiver);
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const safeLocal = local.length <= 2 ? `${local[0] || "*"}*` : `${local.slice(0, 2)}***`;
  return `${safeLocal}@${domain}`;
};

/**
 * Persist + emit structured notification log.
 */
const logNotification = async ({
  userId = null,
  channel,
  notificationType,
  receiver,
  status,
  durationMs = null,
  error = null,
}) => {
  const masked = maskReceiver(channel, receiver);
  const payload = {
    notification_channel: channel,
    notification_type: notificationType,
    receiver: masked,
    status,
    duration: durationMs,
    error: error || null,
    user_id: userId,
  };

  if (status === "failed") {
    logger.error(ctx, "notification_failed", notificationType, payload);
  } else {
    logger.info(ctx, "notification", notificationType, payload);
  }

  try {
    const db = getDb();
    await db.executeQuery(
      `INSERT INTO notification_logs
        (user_id, channel, notification_type, receiver, status, duration_ms, error)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        channel,
        notificationType,
        masked,
        status,
        durationMs,
        error ? String(error).slice(0, 2000) : null,
      ]
    );
  } catch (err) {
    logger.error(ctx, "Failed to persist notification_logs", "logNotification", err);
  }
};

module.exports = { logNotification, maskReceiver };
