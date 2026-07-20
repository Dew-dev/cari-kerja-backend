const commandHandler = require("../repositories/commands/command_handler");
const queryHandler = require("../repositories/queries/query_handler");
const commandModel = require("../repositories/commands/command_model");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const {
  sendResponse,
  paginationResponse,
} = require("../../../helpers/utils/response");
const wrapper = require("../../../helpers/utils/wrapper");
const { verifyCaptchaToken } = require("../../../helpers/captcha/turnstile");

const createContactMessage = async (req, res) => {
  const validatePayload = validator.isValidPayload(
    req.body,
    commandModel.createContactMessageParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }

  const { captcha_token, website, ...data } = validatePayload.data;

  // Honeypot: pretend success without persisting when bots fill hidden field
  if (website && String(website).trim().length > 0) {
    return sendResponse(wrapper.data({ id: "ok" }), res, 201);
  }

  const captchaResult = await verifyCaptchaToken(captcha_token, req.ip);
  if (captchaResult.err) {
    return sendResponse(captchaResult, res);
  }

  const result = await commandHandler.createContactMessage(data);
  return sendResponse(result, res, 201);
};

const getContactMessages = async (req, res) => {
  const payload = {
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search ?? null,
  };

  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getContactMessagesParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }

  const result = await queryHandler.getContactMessages(validatePayload.data);
  return paginationResponse(result, res);
};

const getContactMessageById = async (req, res) => {
  const validatePayload = validator.isValidPayload(
    { id: req.params.id },
    queryModel.getContactMessageByIdParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }

  const result = await queryHandler.getContactMessageById(validatePayload.data);
  return sendResponse(result, res);
};

const deleteContactMessage = async (req, res) => {
  const validatePayload = validator.isValidPayload(
    { id: req.params.id },
    commandModel.deleteContactMessageParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }

  const result = await commandHandler.deleteContactMessage(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  createContactMessage,
  getContactMessages,
  getContactMessageById,
  deleteContactMessage,
};
