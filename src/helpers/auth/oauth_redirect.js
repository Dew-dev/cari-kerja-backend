const config = require("../../config/global_config");
const { ConflictError } = require("../errors");

/**
 * Map domain errors to stable OAuth error codes for FE query params.
 */
const resolveOauthErrorCode = (err) => {
  if (err instanceof ConflictError) {
    return "provider_conflict";
  }
  if (err?.name === "ConflictError" || err?.constructor?.name === "ConflictError") {
    return "provider_conflict";
  }
  return "oauth_failed";
};

/**
 * Extract existing login provider from conflict message when available.
 * e.g. "... registered with local login ..." → "local"
 */
const extractProviderFromMessage = (message = "") => {
  const match = String(message).match(
    /registered with\s+([a-z0-9_]+)\s+login/i
  );
  return match ? match[1].toLowerCase() : null;
};

/**
 * Build FE login URL for OAuth browser-callback failures.
 * Worker → /login, Recruiter → /recruiter-login
 */
const buildOauthLoginErrorRedirect = ({
  origin,
  roleId,
  err,
  fallbackMessage = "OAuth login failed",
} = {}) => {
  const feUrl = config.get("/frontendUrl");
  const base = (origin || feUrl || "").replace(/\/$/, "");
  const loginPath = Number(roleId) === 2 ? "/recruiter-login" : "/login";
  const message = err?.message || fallbackMessage;
  const params = new URLSearchParams({
    error: resolveOauthErrorCode(err),
    message,
  });
  const provider = extractProviderFromMessage(message);
  if (provider) {
    params.set("provider", provider);
  }
  return `${base}${loginPath}?${params.toString()}`;
};

module.exports = {
  buildOauthLoginErrorRedirect,
  resolveOauthErrorCode,
  extractProviderFromMessage,
};
