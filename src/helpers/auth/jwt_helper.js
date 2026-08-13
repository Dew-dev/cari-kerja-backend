const { ForbiddenError } = require("../errors");
const jwt = require("jsonwebtoken");
const wrapper = require("../utils/wrapper");
const config = require("../../config/global_config");

const parseJsonOption = (val) => {
  if (!val) return {};
  try {
    return JSON.parse(val.replace(/^'|'$/g, ""));
  } catch {
    return {};
  }
};

const signOptions = parseJsonOption(config.get("/jwt/accessSign"));
const refreshOptions = parseJsonOption(config.get("/jwt/refreshSign"));
const accessSecret = config.get("/jwt/accessTokenSecret");
const refreshSecret = config.get("/jwt/refreshTokenSecret");

const getToken = (authHeader) => {
  const token = authHeader && authHeader.split(" ")[1];
  return token;
};

/**
 * Slim JWT claims for cookies/headers. Spreading full user rows (encrypted emails,
 * company flags, etc.) blows past nginx's default proxy header buffer → 502.
 */
const buildAccessTokenPayload = (user = {}) => {
  const payload = {
    id: user.id,
    user_id: user.user_id || user.id,
    email: user.email || null,
    username: user.username || null,
    role_id: user.role_id,
    role: user.role || null,
    name: user.name || null,
    avatar_url: user.avatar_url || null,
    login_provider: user.login_provider || "local",
    provider_id: user.provider_id || null,
    email_verified_at: user.email_verified_at || null,
    is_suspended: user.is_suspended || false,
    suspension_reason: user.suspension_reason || null,
  };
  if (user.worker_id) payload.worker_id = user.worker_id;
  if (user.recruiter_id) payload.recruiter_id = user.recruiter_id;
  if (user.company_id) payload.company_id = user.company_id;
  if (user.company_role) payload.company_role = user.company_role;
  return payload;
};

const generateAccessToken = async (payload) => {
  const slim =
    payload && (payload.role_id != null || payload.id)
      ? buildAccessTokenPayload(payload)
      : payload;
  return jwt.sign(slim, accessSecret, signOptions);
};

const generateRefreshToken = async (payload) => {
  return jwt.sign(payload, refreshSecret, refreshOptions);
};

const verifyAccessToken = async (token) => {
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, accessSecret, signOptions);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return wrapper.error(new ForbiddenError("Token Expired"));
    }
    return wrapper.error(new ForbiddenError("Token is not valid"));
  }

  return wrapper.data(decodedToken);
};

const verifyRefreshToken = async (token) => {
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, refreshSecret, refreshOptions);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return wrapper.error(new ForbiddenError("Refresh Token Expired"));
    }
    return wrapper.error(new ForbiddenError("Refresh Token is not valid"));
  }

  return wrapper.data(decodedToken);
};

module.exports = {
  getToken,
  buildAccessTokenPayload,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
