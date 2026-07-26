const crypto = require("crypto");
const config = require("../../config/global_config");

const isSyntheticTelegramUsername = (username) => {
  if (!username) return true;
  return /^telegram_\d+$/i.test(String(username));
};

const resolvePublicTelegramUsername = (user = {}) => {
  const fromNotify = user.telegram_notify_username
    ? String(user.telegram_notify_username).replace(/^@/, "").toLowerCase()
    : null;
  if (fromNotify && !isSyntheticTelegramUsername(fromNotify)) {
    return fromNotify;
  }
  const fromLogin = user.username
    ? String(user.username).replace(/^@/, "").toLowerCase()
    : null;
  if (fromLogin && !isSyntheticTelegramUsername(fromLogin)) {
    return fromLogin;
  }
  return null;
};

const getSigningSecret = () => {
  return (
    config.get("/telegramBot/webhookSecret") ||
    config.get("/telegramBot/token") ||
    config.get("/jwt/accessTokenSecret") ||
    "telegram-start-fallback"
  );
};

/**
 * Compact signed start payload: base64url(userId.exp.sig)
 */
const createTelegramStartPayload = (userId) => {
  const ttl = Number(config.get("/telegramBot/startPayloadTtlSec") || 3600);
  const exp = Math.floor(Date.now() / 1000) + ttl;
  const body = `${userId}.${exp}`;
  const sig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(body)
    .digest("base64url")
    .slice(0, 16);
  return Buffer.from(`${body}.${sig}`).toString("base64url");
};

const verifyTelegramStartPayload = (payload) => {
  if (!payload) return null;
  let decoded;
  try {
    decoded = Buffer.from(String(payload), "base64url").toString("utf8");
  } catch {
    return null;
  }
  const parts = decoded.split(".");
  if (parts.length !== 3) return null;
  const [userId, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!userId || !exp || Number.isNaN(exp)) return null;
  if (exp < Math.floor(Date.now() / 1000)) return null;
  const body = `${userId}.${exp}`;
  const expected = crypto
    .createHmac("sha256", getSigningSecret())
    .update(body)
    .digest("base64url")
    .slice(0, 16);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return { userId };
};

const buildTelegramBotStartUrl = (userId) => {
  const botUsername = (config.get("/telegramBot/username") || "").replace(
    /^@/,
    ""
  );
  if (!botUsername || !userId) return null;
  const payload = createTelegramStartPayload(userId);
  return `https://t.me/${botUsername}?start=${payload}`;
};

/**
 * Public Telegram fields for API responses. Never includes chat_id / provider_id.
 * @param {object} userRow - may include login_provider, username, telegram_*
 * @param {{ forSelf?: boolean, displayName?: string }} options
 */
const buildTelegramProfileFields = (userRow = {}, options = {}) => {
  const { forSelf = false, displayName = null } = options;
  const connected = userRow.login_provider === "telegram";
  const available = connected && Boolean(userRow.telegram_chat_id);
  const telegramUsername = connected
    ? resolvePublicTelegramUsername(userRow)
    : null;
  const telegramDisplayName =
    displayName ||
    userRow.name ||
    (telegramUsername ? telegramUsername : null);

  const fields = {
    telegram_connected: connected,
    telegram_available: available,
    telegram_username: telegramUsername,
    telegram_display_name: connected ? telegramDisplayName : null,
  };

  if (forSelf) {
    fields.telegram_bot_start_url =
      connected && !available ? buildTelegramBotStartUrl(userRow.user_id || userRow.id) : null;
  } else {
    fields.telegram_chat_url =
      available && telegramUsername
        ? `https://t.me/${telegramUsername}`
        : null;
  }

  return fields;
};

/** Strip sensitive telegram/auth fields before sending to clients. */
const omitSensitiveTelegramFields = (row = {}) => {
  const {
    telegram_chat_id,
    provider_id,
    telegram_bot_linked_at,
    ...rest
  } = row;
  return rest;
};

module.exports = {
  isSyntheticTelegramUsername,
  resolvePublicTelegramUsername,
  createTelegramStartPayload,
  verifyTelegramStartPayload,
  buildTelegramBotStartUrl,
  buildTelegramProfileFields,
  omitSensitiveTelegramFields,
};
