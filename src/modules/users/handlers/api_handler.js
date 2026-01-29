const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");
const {
  storeCookie,
  deleteCookie,
} = require("../../../helpers/auth/cookie_helper");
const joi = require("joi");
// query
const getUserById = async (req, res) => {
  const payload = { ...req.params };
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
  const payload = { ...req.body };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.loginParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.login(validatePayload.data);

  storeCookie(res, "refreshToken", result?.data?.refreshToken);
  storeCookie(res, "accessToken", result?.data?.token);
  storeCookie(res, "role", result?.data?.role);
  storeCookie(res, "user", result?.data?.user);
  storeCookie(res, "jp_session", result?.data?.token);
  return sendResponse(result, res);
};

const loginWithGoogle = async (req, res) => {
  const payload = { ...req.user };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.loginWithGoogleParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.loginWithGoogle(validatePayload.data);

  storeCookie(res, "refreshToken", result?.data?.refreshToken);
  storeCookie(res, "accessToken", result?.data?.token);
  storeCookie(res, "role", result?.data?.role);
  storeCookie(res, "user", result?.data?.user);
  storeCookie(res, "jp_session", result?.data?.token);
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
  const result = await commandHandler.registerWorker(validatePayload.data);
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
  const result = await commandHandler.registerRecruiter(validatePayload.data);
  return sendResponse(result, res, 201);
};

const updateOneUser = async (req, res) => {
  const payload = { ...req.params, ...req.body };
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
  const payload = { token: req.cookies.refreshToken };
  //console.log("req.cookies.refreshToken \n", req.cookies);
  //console.log("payload \n", payload);
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.refreshTokenParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.refreshToken(validatePayload.data);
  //console.log("result \n", result);
  storeCookie(res, "refreshToken", result?.data?.refreshToken);
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


module.exports = {
  getUserById,
  login,
  loginWithGoogle,
  logout,
  registerRecruiter,
  registerWorker,
  updateOneUser,
  deleteUser,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
};
