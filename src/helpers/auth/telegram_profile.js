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
 * Telegram deep-link `start` param max length is 64.
 * Format: {uuid32hex}.{expBase36}.{sig8}  (~49 chars)
 * Example: 550e8400e29b41d4a716446655440000.l8k2m0.Ab12CdEf
 */
const uuidToCompact = (userId) => String(userId).replace(/-/g, "").toLowerCase();

const compactToUuid = (compact) => {
  if (!/^[0-9a-f]{32}$/i.test(compact)) return null;
  const h = compact.toLowerCase();
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

const createTelegramStartPayload = (userId) => {
  const ttl = Number(config.get("/telegramBot/startPayloadTtlSec") || 3600);
  const exp = Math.floor(Date.now() / 1000) + ttl;
  const idCompact = uuidToCompact(userId);
  if (!/^[0-9a-f]{32}$/.test(idCompact)) {
    throw new Error("userId must be a UUID for telegram start payload");
  }
  const exp36 = exp.toString(36);
  const body = `${idCompact}.${exp36}`;
  const sig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(body)
    .digest("base64url")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 8);
  const payload = `${body}.${sig}`;
  if (payload.length > 64) {
    throw new Error(`telegram start payload exceeds 64 chars (${payload.length})`);
  }
  return payload;
};

const verifyTelegramStartPayload = (payload) => {
  if (!payload) return null;
  const raw = String(payload).trim();
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [idCompact, exp36, sig] = parts;
  const userId = compactToUuid(idCompact);
  const exp = parseInt(exp36, 36);
  if (!userId || !exp || Number.isNaN(exp)) return null;
  if (exp < Math.floor(Date.now() / 1000)) return null;
  const body = `${idCompact.toLowerCase()}.${exp36}`;
  const expected = crypto
    .createHmac("sha256", getSigningSecret())
    .update(body)
    .digest("base64url")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 8);
  const a = Buffer.from(String(sig));
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
