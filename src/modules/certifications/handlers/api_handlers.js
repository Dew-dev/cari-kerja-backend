const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse, paginationResponse } = require("../../../helpers/utils/response");

// query
const getOneCertification = async (req, res) => {
  const payload = { ...req.params, worker_id: req.userMeta.worker_id };
  const validatePayload = validator.isValidPayload(payload, queryModel.getOneCertificationParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getOneCertification(validatePayload.data);
  return sendResponse(result, res);
};

const getAllCertifications = async (req, res) => {
  const payload = { worker_id: req.userMeta.worker_id, ...req.query };
  const validatePayload = validator.isValidPayload(payload, queryModel.getAllCertificationParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getAllCertifications(validatePayload.data);
  return paginationResponse(result, res);
};

const addCertification = async (req, res) => {
  const payload = { worker_id: req.userMeta.worker_id, ...req.body };
  const {created_at, updated_at, ...payloadWithoutTimestamps} = payload;
  const validatePayload = validator.isValidPayload(payloadWithoutTimestamps, commandModel.addCertification);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.addCertification(validatePayload.data);
  return sendResponse(result, res);
};

const updateCertification = async (req, res) => {
  const payload = { id: req.params.id, worker_id: req.userMeta.worker_id, ...req.body };
  const { created_at, updated_at,isSaved, ...payloadWithoutTimestamps } = payload;
  const validatePayload = validator.isValidPayload(payloadWithoutTimestamps, commandModel.updateCertification);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.updateCertification(validatePayload.data);
  return sendResponse(result, res);
};

const deleteCertification = async (req, res) => {
  const payload = { id: req.params.id };
  const validatePayload = validator.isValidPayload(payload, commandModel.deleteCertification);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.deleteCertification(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  getOneCertification,
  getAllCertifications,
  addCertification,
  updateCertification,
  deleteCertification,
};
