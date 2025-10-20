const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");

// query
const getAllPortfolios = async (req, res) => {
  const payload = { worker_id: req.userMeta.worker_id };
  const validatePayload = validator.isValidPayload(payload, queryModel.getAllPortofoliosParam);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getAllPortfoliosByWorkerId(validatePayload.data);
  return sendResponse(result, res);
};

// command
const insertPortfolios = async (req, res) => {
  const payload = { ...req.body, worker_id: req.userMeta.worker_id };
  const validatePayload = validator.isValidPayload(payload, commandModel.addPortfoliosParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.insertPortfolios(validatePayload.data);
  return sendResponse(result, res);
};

const updatePortfolios = async (req, res) => {
  const payload = { ...req.body, worker_id: req.userMeta.worker_id, ...req.params };
  const validatePayload = validator.isValidPayload(payload, commandModel.updatePortfoliosParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.updatePortfolios(validatePayload.data);
  return sendResponse(result, res);
};

const deletePortfolios = async (req, res) => {
  const payload = { ...req.params, worker_id: req.userMeta.worker_id };
  const validatePayload = validator.isValidPayload(payload, commandModel.deletePortfoliosParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.deletePortfolios(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  getAllPortfolios,
  insertPortfolios,
  updatePortfolios,
  deletePortfolios,
};