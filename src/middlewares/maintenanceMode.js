const DB = require("../helpers/databases/postgresql/db");
const config = require("../config/global_config");
const logger = require("../helpers/utils/logger");
const { ServiceUnavailableError } = require("../helpers/errors");
const wrapper = require("../helpers/utils/wrapper");

const ctx = "MaintenanceMode";

let cache = { value: false, expiresAt: 0 };
const CACHE_MS = 15_000;

const db = new DB(config.get("/postgresqlUrl"));

const readMaintenanceFlag = async () => {
  const now = Date.now();
  if (now < cache.expiresAt) return cache.value;

  try {
    const result = await db.executeQuery(
      `SELECT setting_value FROM system_settings WHERE setting_key = 'maintenance_mode' LIMIT 1`
    );
    const raw = result?.rows?.[0]?.setting_value;
    const enabled = String(raw).toLowerCase() === "true" || raw === true || raw === "1";
    cache = { value: enabled, expiresAt: now + CACHE_MS };
    return enabled;
  } catch (err) {
    logger.error(ctx, "readMaintenanceFlag", err.message);
    // fail-open for availability if settings table unreachable
    cache = { value: false, expiresAt: now + CACHE_MS };
    return false;
  }
};

/** Clear cache after admin updates settings. */
const invalidateMaintenanceCache = () => {
  cache = { value: false, expiresAt: 0 };
};

const isExemptPath = (req) => {
  const p = req.path || "";
  // health / docs / webhook / admin settings toggle must remain reachable
  if (p === "/" || p.startsWith("/api-docs")) return true;
  if (p === "/api/v1/health" || p.startsWith("/api/v1/health/")) return true;
  if (p.startsWith("/api/v1/payments/webhook")) return true;
  if (p.startsWith("/api/v1/telegram/webhook")) return true;
  if (p.startsWith("/api/v1/admin/settings")) return true;
  if (p.startsWith("/api/v1/admin/stats")) return true;
  if (p === "/api/v1/users/login" || p === "/api/v1/users/refresh-token") return true;
  return false;
};

const isAdminRole = (req) => {
  const role = Number(req.userMeta?.role_id);
  return role === 3 || role === 4;
};

/**
 * When maintenance_mode=true, block non-admin traffic with 503.
 * Admin JWT (roles 3|4) still allowed once authenticated; unauthenticated
 * public writes/reads (except exempt) are blocked.
 */
const maintenanceModeGuard = async (req, res, next) => {
  try {
    if (isExemptPath(req)) return next();

    const enabled = await readMaintenanceFlag();
    if (!enabled) return next();

    // Allow admin/super_admin if token already verified earlier in chain.
    // For routes that verify later, still block until they hit admin settings.
    if (isAdminRole(req)) return next();

    // If Authorization present, try soft-parse is too heavy; block generically.
    // Admins use /admin/* which we allow for settings/stats only above.
    // Broader admin routes: allow path prefix /api/v1/admin/
    if ((req.path || "").startsWith("/api/v1/admin/")) return next();

    const err = wrapper.error(
      new ServiceUnavailableError(
        "MAINTENANCE_MODE: Platform is under maintenance. Please try again later."
      )
    );
    return res.status(503).send({
      success: false,
      data: "",
      message: err.err.message,
      code: 503,
    });
  } catch (err) {
    logger.error(ctx, "maintenanceModeGuard", err.message);
    return next();
  }
};

module.exports = {
  maintenanceModeGuard,
  invalidateMaintenanceCache,
  readMaintenanceFlag,
};
