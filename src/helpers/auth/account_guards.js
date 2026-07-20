const crypto = require("crypto");
const config = require("../../config/global_config");
const DB = require("../databases/postgresql/db");
const { ForbiddenError, BadRequestError } = require("../errors");
const wrapper = require("../utils/wrapper");

/** OAuth signup boleh worker (1) atau recruiter (2) saja — bukan admin. */
const ALLOWED_OAUTH_ROLE_IDS = new Set([1, 2]);

let dbInstance = null;
const getDb = () => {
  if (!dbInstance) {
    dbInstance = new DB(config.get("/postgresqlUrl"));
  }
  return dbInstance;
};

/**
 * Normalize client-supplied OAuth role_id.
 * @returns {number|null} 1|2, or null if invalid (e.g. admin role attempt)
 */
const sanitizeOauthRoleId = (roleId) => {
  if (roleId === undefined || roleId === null || roleId === "") return 1;
  const n = Number(roleId);
  if (!Number.isInteger(n) || !ALLOWED_OAUTH_ROLE_IDS.has(n)) return null;
  return n;
};

const isSuspendedValue = (value) =>
  value === true || value === "t" || value === "true" || value === 1 || value === "1";

/** Reject suspended accounts at login / refresh / OAuth. */
const rejectIfSuspended = (user) => {
  if (user && isSuspendedValue(user.is_suspended)) {
    return wrapper.error(new ForbiddenError("Account is suspended"));
  }
  return null;
};

/**
 * DB check for middleware / socket — returns wrapper.error if suspended or missing.
 */
const assertUserNotSuspendedById = async (userId) => {
  if (!userId) {
    return wrapper.error(new ForbiddenError("Account is suspended"));
  }
  try {
    const result = await getDb().executeQuery(
      `SELECT is_suspended FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [userId]
    );
    if (!result?.rows?.length) {
      return wrapper.error(new ForbiddenError("Account is suspended"));
    }
    if (isSuspendedValue(result.rows[0].is_suspended)) {
      return wrapper.error(new ForbiddenError("Account is suspended"));
    }
    return wrapper.data({ ok: true });
  } catch (err) {
    // Fail closed: jangan biarkan request lewat jika status tidak bisa diverifikasi
    return wrapper.error(new ForbiddenError("Account is suspended"));
  }
};

const requireValidOauthRole = (roleId) => {
  const safe = sanitizeOauthRoleId(roleId);
  if (safe === null) {
    return wrapper.error(new BadRequestError("Invalid role for OAuth registration"));
  }
  return wrapper.data({ role_id: safe });
};

/** timing-safe compare for webhook secrets */
const timingSafeEqualString = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

module.exports = {
  ALLOWED_OAUTH_ROLE_IDS,
  sanitizeOauthRoleId,
  isSuspendedValue,
  rejectIfSuspended,
  assertUserNotSuspendedById,
  requireValidOauthRole,
  timingSafeEqualString,
};
