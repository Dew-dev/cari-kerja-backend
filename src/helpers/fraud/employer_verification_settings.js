const DB = require("../databases/postgresql/db");
const config = require("../../config/global_config");
const logger = require("../utils/logger");

const ctx = "Employer-Verification-Settings";
const db = new DB(config.get("/postgresqlUrl"));

let cache = { graceDays: 7, autoBlock: true, expiresAt: 0 };
const CACHE_MS = 30_000;

const readEmployerVerificationSettings = async () => {
  const now = Date.now();
  if (now < cache.expiresAt) {
    return { graceDays: cache.graceDays, autoBlock: cache.autoBlock };
  }

  try {
    const result = await db.executeQuery(
      `SELECT setting_key, setting_value FROM system_settings
       WHERE setting_key IN ('employer_verification_grace_days', 'employer_verification_auto_block')`
    );
    let graceDays = 7;
    let autoBlock = true;
    for (const row of result?.rows || []) {
      if (row.setting_key === "employer_verification_grace_days") {
        const n = parseInt(row.setting_value, 10);
        if (Number.isFinite(n) && n > 0) graceDays = n;
      }
      if (row.setting_key === "employer_verification_auto_block") {
        autoBlock =
          String(row.setting_value).toLowerCase() === "true" ||
          row.setting_value === true ||
          row.setting_value === "1";
      }
    }
    cache = { graceDays, autoBlock, expiresAt: now + CACHE_MS };
    return { graceDays, autoBlock };
  } catch (err) {
    logger.error(ctx, "readEmployerVerificationSettings", err.message);
    return { graceDays: 7, autoBlock: true };
  }
};

const invalidateEmployerVerificationSettingsCache = () => {
  cache = { graceDays: 7, autoBlock: true, expiresAt: 0 };
};

/** Fields to set on new recruiter rows (local + OAuth signup). */
const buildRecruiterGraceFields = async () => {
  const { graceDays } = await readEmployerVerificationSettings();
  return {
    verification_status: "grace",
    verification_deadline_at: new Date(
      Date.now() + graceDays * 24 * 60 * 60 * 1000
    ),
  };
};

module.exports = {
  readEmployerVerificationSettings,
  invalidateEmployerVerificationSettingsCache,
  buildRecruiterGraceFields,
};
