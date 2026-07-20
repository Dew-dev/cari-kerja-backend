/**
 * Richer audit taxonomy without schema change.
 * Pattern: domain.verb[.object][.result]
 */
const auditAction = (...parts) =>
  parts
    .filter((p) => p !== undefined && p !== null && String(p).length > 0)
    .map((p) => String(p).toLowerCase().replace(/\s+/g, "_"))
    .join(".");

const ACTIONS = {
  AUTH_LOGIN_SUCCESS: auditAction("auth", "login", "success"),
  AUTH_LOGIN_FAILED: auditAction("auth", "login", "failed"),
  AUTH_LOGIN_GOOGLE: auditAction("auth", "login", "google"),
  AUTH_LOGIN_TELEGRAM: auditAction("auth", "login", "telegram"),
  FRAUD_EVENT_RESOLVE: (action) => auditAction("fraud", "event", "resolve", action),
  ADMIN_DELETE_CHAT_MESSAGE: auditAction("admin", "chat", "message", "delete"),
  ADMIN_PAYMENT_STATUS: auditAction("admin", "payment_order", "status"),
  PAYMENT_INVOICE_CREATE: auditAction("payment", "invoice", "create"),
  PAYMENT_SESSION_ANOMALY: auditAction("payment", "session", "anomaly"),
};

module.exports = {
  auditAction,
  ACTIONS,
};
