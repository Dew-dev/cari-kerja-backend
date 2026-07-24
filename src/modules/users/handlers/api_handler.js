const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");
const wrapper = require("../../../helpers/utils/wrapper");
const { ForbiddenError } = require("../../../helpers/errors");
const {
  storeCookie,
  deleteCookie,
} = require("../../../helpers/auth/cookie_helper");
const { verifyCaptchaToken } = require("../../../helpers/captcha/turnstile");
const {
  requiresCaptcha,
  incrementFailure,
  clearFailures,
} = require("../../../helpers/fraud/login_failures");
const joi = require("joi");

// super_admin (role_id 3) is allowed to access any user's profile
const SUPER_ADMIN_ROLE_ID = 3;

// query
const getUserById = async (req, res) => {
  const payload = { ...req.params };

  const isSuperAdmin = req.userMeta?.role_id === SUPER_ADMIN_ROLE_ID;
  if (!isSuperAdmin && req.userMeta?.id !== payload.id) {
    return sendResponse(
      wrapper.error(new ForbiddenError("You are not allowed to access this resource")),
      res
    );
  }

  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getUserByIdParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getUserById(validatePayload.data);
  return sendResponse(result, res);
};

// command
const login = async (req, res) => {
  const payload = {
    ...req.body,
    ip_address: req.ip || req.connection?.remoteAddress,
    user_agent: req.headers["user-agent"],
  };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.loginParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }

  const { captcha_token, ...loginData } = validatePayload.data;
  const identity = loginData.email;
  if (await requiresCaptcha(identity)) {
    const captchaResult = await verifyCaptchaToken(captcha_token, req.ip);
    if (captchaResult.err) {
      return sendResponse(captchaResult, res);
    }
  }

  const result = await commandHandler.login(loginData);

  if (result.err) {
    await incrementFailure(identity);
    return sendResponse(result, res);
  }

  await clearFailures(identity);
  storeCookie(res, "refreshToken", result?.data?.refreshToken);
  storeCookie(res, "accessToken", result?.data?.token);
  storeCookie(res, "role", result?.data?.role);
  storeCookie(res, "user", result?.data?.user);
  storeCookie(res, "jp_session", result?.data?.token);
  return sendResponse(result, res);
};

const loginWithGoogle = async (req, res) => {
  const { origin, ...userData } = req.user || {};
  const payload = { 
    ...userData,
    ip_address: req.ip || req.connection?.remoteAddress,
    user_agent: req.headers["user-agent"]
  };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.loginWithGoogleParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.loginWithGoogle(validatePayload.data);

  if (result.err) {
    return sendResponse(result, res);
  }

  const token = result?.data?.token;
  const refreshToken = result?.data?.refreshToken;

  storeCookie(res, "refreshToken", refreshToken);
  storeCookie(res, "accessToken", token);
  storeCookie(res, "role", "user");
  storeCookie(res, "jp_session", token);

  const config = require("../../../config/global_config");
  const feUrl = config.get("/frontendUrl");
  const redirectOrigin = origin || feUrl;
  return res.redirect(
    `${redirectOrigin}/auth/callback?token=${encodeURIComponent(token)}&refreshToken=${encodeURIComponent(refreshToken)}`
  );
};

const loginWithTelegram = async (req, res) => {
  let stateData = {};
  if (req.query.state) {
    try {
      stateData = JSON.parse(req.query.state);
    } catch (e) {
      // ignore parse error
    }
  }

  const query = req.query || {};
  const body = req.body || {};
  const headers = req.headers || {};
  const origin = stateData.origin || body.origin;
  const code = query.code || body.code;

  const payload = {
    code,
    state: query.state || body.state,
    role_id: stateData.role_id || body.role_id || 1,
    origin,
    ip_address: req.ip || req.connection?.remoteAddress,
    user_agent: headers["user-agent"],
  };

  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.loginWithTelegramParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }

  const result = await commandHandler.loginWithTelegram(validatePayload.data);
  if (result.err) {
    return sendResponse(result, res);
  }

  const token = result?.data?.token;
  const refreshToken = result?.data?.refreshToken;

  storeCookie(res, "refreshToken", refreshToken);
  storeCookie(res, "accessToken", token);
  storeCookie(res, "role", "user");
  storeCookie(res, "jp_session", token);

  if (req.method === "GET") {
    const config = require("../../../config/global_config");
    const feUrl = config.get("/frontendUrl");
    const redirectOrigin = payload.origin || feUrl;
    return res.redirect(
      `${redirectOrigin}/auth/callback?token=${encodeURIComponent(token)}&refreshToken=${encodeURIComponent(refreshToken)}`
    );
  }

  return sendResponse(result, res);
};

const logout = async (req, res) => {
  const payload = { token: req.cookies.refreshToken };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.logoutParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.logout(validatePayload.data);
  deleteCookie(res, "refreshToken");
  deleteCookie(res, "accessToken");
  deleteCookie(res, "role");
  deleteCookie(res, "user");
  deleteCookie(res, "jp_session");
  return sendResponse(result, res);
};

const registerWorker = async (req, res) => {
  const payload = { ...req.body };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.registerParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }

  const { captcha_token, ...data } = validatePayload.data;
  const captchaResult = await verifyCaptchaToken(captcha_token, req.ip);
  if (captchaResult.err) {
    return sendResponse(captchaResult, res);
  }

  const result = await commandHandler.registerWorker(data);
  return sendResponse(result, res, 201);
};

const registerRecruiter = async (req, res) => {
  const payload = { ...req.body };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.registerRecruiterParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }

  const { captcha_token, ...data } = validatePayload.data;
  const captchaResult = await verifyCaptchaToken(captcha_token, req.ip);
  if (captchaResult.err) {
    return sendResponse(captchaResult, res);
  }

  const result = await commandHandler.registerRecruiter(data);
  return sendResponse(result, res, 201);
};

const updateOneUser = async (req, res) => {
  const payload = { ...req.params, ...req.body };

  const ADMIN_ROLES = [3, 4];
  const isAdmin = ADMIN_ROLES.includes(Number(req.userMeta?.role_id));
  if (!isAdmin && req.userMeta?.id !== payload.id) {
    return sendResponse(
      wrapper.error(new ForbiddenError("You are not allowed to update this user")),
      res
    );
  }

  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.updateUserParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.updateOneUser(validatePayload.data);
  return sendResponse(result, res, 201);
};

const deleteUser = async (req, res) => {
  const payload = { id: req.params.id, user_online_id: req.userMeta.id };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.deleteParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.deleteUser(validatePayload.data);
  return sendResponse(result, res);
};

const refreshToken = async (req, res) => {
  const payload = {
    token: req.body?.refreshToken || req.cookies.refreshToken,
  };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.refreshTokenParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.refreshToken(validatePayload.data);
  // Only set cookie on success. Failed refresh must not clear/overwrite cookies
  // or invalidate the access token issued at OAuth callback.
  if (!result.err) {
    const nextRefreshToken =
      result?.data?.refreshToken || validatePayload.data.token;
    if (nextRefreshToken) {
      storeCookie(res, "refreshToken", nextRefreshToken);
    }
  }
  return sendResponse(result, res);
};


const forgotPassword = async (req, res) => {
  const payload = { email: req.body.email };

  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.forgotPasswordParamType,
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }

  const result = await commandHandler.forgotPassword(validatePayload.data);
  return sendResponse(result, res);
};

const resetPassword = async (req, res) => {
  const payload = {
    token: req.body.token,
    password: req.body.password,
  };

  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.resetPasswordParamType,
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }

  const result = await commandHandler.resetPassword(validatePayload.data);
  return sendResponse(result, res);
};

const changePassword = async (req, res) => {
  const payload = {
    ...req.body,
    user_id: req.userMeta.user_id, // dari auth middleware
  };

  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.changePasswordParamType.keys({
      user_id: joi.string().required(),
    }),
  );

  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }

  const result = await commandHandler.changePassword(validatePayload.data);
  return sendResponse(result, res);
};

const changeEmail = async (req, res) => {
  const payload = {
    user_id: req.userMeta.id,
    email: req.body.email,
  };

  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.changeEmailParamType,
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }

  const result = await commandHandler.changeEmail(validatePayload.data);
  if (!result.err && result?.data?.token) {
    storeCookie(res, "accessToken", result.data.token);
    storeCookie(res, "jp_session", result.data.token);
  }
  return sendResponse(result, res);
};

const sendVerifyEmail = async (req, res) => {
  const payload = { user_id: req.userMeta.id };

  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.sendVerifyEmailParamType,
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.sendVerifyEmail(validatePayload.data);
  return sendResponse(result, res);
};

const verifyEmail = async (req, res) => {
  const payload = req.query;

  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.verifyEmailParamType,
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.verifyEmail(validatePayload.data);
  return sendResponse(result, res);
};

const resendVerifyEmail = async (req, res) => {
  const payload = { email: req.body.email };

  const validatePayload = validator.isValidPayload(
    payload,
    joi.object({ email: joi.string().email().required() }),
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.resendVerifyEmail(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  getUserById,
  login,
  loginWithGoogle,
  loginWithTelegram,
  logout,
  registerRecruiter,
  registerWorker,
  updateOneUser,
  deleteUser,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  changeEmail,
  verifyEmail,
  sendVerifyEmail,
  resendVerifyEmail,
};
