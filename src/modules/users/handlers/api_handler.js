const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");
const { storeCookie, deleteCookie } = require("../../../helpers/auth/cookie_helper");

// query
const getUserById = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(payload, queryModel.getUserByIdParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getUserById(validatePayload.data);
  return sendResponse(result, res);
};

// command
const login = async (req, res) => {
  const payload = { ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.loginParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.login(validatePayload.data);

  storeCookie(res, "refreshToken", result.data.refreshToken);
  return sendResponse(result, res);
};

const loginWithGoogle = async (req, res) => {
  const payload = { ...req.user };
  const validatePayload = validator.isValidPayload(payload, commandModel.loginWithGoogleParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.loginWithGoogle(validatePayload.data);

  storeCookie(res, "refreshToken", result.data.refreshToken);
  return sendResponse(result, res);
};

const logout = async (req, res) => {
  const payload = { token: req.cookies.refreshToken };
  const validatePayload = validator.isValidPayload(payload, commandModel.logoutParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.logout(validatePayload.data);
  deleteCookie(res, "refreshToken");
  return sendResponse(result, res);
};

const registerWorker = async (req, res) => {
  const payload = { ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.registerParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.registerWorker(validatePayload.data);
  return sendResponse(result, res, 201);
};

const registerRecruiter = async (req, res) => {
  const payload = { ...req.body };
  const validatePayload = validator.isValidPayload(payload, commandModel.registerRecruiterParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.registerRecruiter(validatePayload.data);
  return sendResponse(result, res, 201);
};

const deleteUser = async (req, res) => {
  const payload = { id: req.params.id, user_online_id: req.userMeta.id };
  const validatePayload = validator.isValidPayload(payload, commandModel.deleteParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.deleteUser(validatePayload.data);
  return sendResponse(result, res);
};

const refreshToken = async (req, res) => {
  const payload = { token: req.cookies.refreshToken };
  const validatePayload = validator.isValidPayload(payload, commandModel.refreshTokenParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.refreshToken(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  getUserById,
  login,
  loginWithGoogle,
  logout,
  registerRecruiter,
  registerWorker,
  deleteUser,
  refreshToken,
};
