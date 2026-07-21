const wrapper = require("../utils/wrapper");
const logger = require("../utils/logger");
const { upsertOpenFraudEvent } = require("./fraud_events");

const ctx = "Session-Anomaly";

const normalizeIp = (ip) => {
  if (!ip) return "";
  return String(ip).replace(/^::ffff:/, "").trim();
};

/**
 * Compare current request IP/UA to last successful login audit for the user.
 * Soft-signal only: upserts fraud_events, does not block the payment.
 *
 * @param {{ executeQuery: Function }} db
 * @param {{ userId: string, recruiterId: string, orderId?: string, ip_address?: string, user_agent?: string, order_type?: string }} opts
 */
const flagPaymentSessionAnomaly = async (db, opts) => {
  const {
    userId,
    recruiterId,
    orderId,
    ip_address,
    user_agent,
    order_type,
  } = opts;

  if (!userId || !ip_address) {
    return wrapper.data({ flagged: false, skipped: true });
  }

  try {
    const lastLogin = await db.executeQuery(
      `
      SELECT ip_address, user_agent, action, created_at
      FROM audit_logs
      WHERE user_id = $1
        AND (
          action IN ('LOGIN', 'LOGIN_GOOGLE', 'LOGIN_TELEGRAM')
          OR action LIKE 'auth.login.%'
        )
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [userId]
    );

    const row = lastLogin?.rows?.[0];
    if (!row) {
      return wrapper.data({ flagged: false, reason: "no_prior_login" });
    }

    const lastIp = normalizeIp(row.ip_address);
    const currIp = normalizeIp(ip_address);
    const ipMismatch = lastIp && currIp && lastIp !== currIp;
    const uaMismatch =
      row.user_agent &&
      user_agent &&
      String(row.user_agent).slice(0, 80) !== String(user_agent).slice(0, 80);

    if (!ipMismatch && !uaMismatch) {
      return wrapper.data({ flagged: false });
    }

    const flags = [];
    if (ipMismatch) {
      flags.push({
        code: "IP_MISMATCH",
        detail: `Login IP ${lastIp} vs payment IP ${currIp}`,
        weight: 40,
      });
    }
    if (uaMismatch) {
      flags.push({
        code: "UA_MISMATCH",
        detail: "User-Agent differs from last login",
        weight: 20,
      });
    }
    const risk_score = flags.reduce((s, f) => s + f.weight, 0);

    if (orderId) {
      await upsertOpenFraudEvent(db, {
        entity_type: "payment_order",
        entity_id: orderId,
        source: "session_anomaly",
        risk_score,
        flags,
        summary: `Payment session anomaly on ${order_type || "invoice"}`,
        metadata: {
          recruiter_id: recruiterId,
          user_id: userId,
          last_login_ip: lastIp,
          payment_ip: currIp,
          last_login_at: row.created_at,
        },
      });
    }

    logger.info(ctx, "flagPaymentSessionAnomaly", "flagged", {
      userId,
      orderId,
      risk_score,
    });

    return wrapper.data({ flagged: true, risk_score, flags });
  } catch (err) {
    logger.error(ctx, "flagPaymentSessionAnomaly", err.message);
    return wrapper.data({ flagged: false, error: true });
  }
};

module.exports = {
  flagPaymentSessionAnomaly,
  normalizeIp,
};
