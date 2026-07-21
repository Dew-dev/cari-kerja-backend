const logger = require("../utils/logger");

const ctx = "Apply-Captcha";

/** New accounts (or very few prior applies) must pass Turnstile on apply. */
const NEW_ACCOUNT_DAYS = 7;
const LOW_APPLY_COUNT = 3;

/**
 * @param {{ executeQuery: Function }} db
 * @param {string} workerId
 * @returns {Promise<boolean>}
 */
const workerNeedsApplyCaptcha = async (db, workerId) => {
  if (!workerId) return true;
  try {
    const result = await db.executeQuery(
      `
      SELECT u.created_at,
             (
               SELECT COUNT(*)::int
               FROM job_applications ja
               WHERE ja.worker_id = w.id
             ) AS apply_count
      FROM workers w
      JOIN users u ON u.id = w.user_id
      WHERE w.id = $1
      LIMIT 1
      `,
      [workerId]
    );
    const row = result?.rows?.[0];
    if (!row) return true;

    const ageMs = Date.now() - new Date(row.created_at).getTime();
    const isNew = ageMs < NEW_ACCOUNT_DAYS * 24 * 60 * 60 * 1000;
    const lowApplies = Number(row.apply_count || 0) < LOW_APPLY_COUNT;
    return isNew || lowApplies;
  } catch (err) {
    logger.error(ctx, "workerNeedsApplyCaptcha", err.message);
    // Fail closed: require captcha if we cannot assess account age
    return true;
  }
};

module.exports = {
  NEW_ACCOUNT_DAYS,
  LOW_APPLY_COUNT,
  workerNeedsApplyCaptcha,
};
