const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse, paginationResponse } = require("../../../helpers/utils/response");

// query
const getWorkerByUserId = async (req, res) => {
  const payload = { user_id: req.userMeta.id };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getWorkerByUserIdParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getWorkerByUserId(validatePayload.data);
  return sendResponse(result, res);
};

const getWorkerById = async (req, res) => {
  const payload = { id: req.params.id };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getWorkerByIdParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getWorkerById(validatePayload.data);
  return sendResponse(result, res);
};

const getWorkers = async (req, res) => {
  const payload = { ...req.query };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getWorkersParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getWorkers(validatePayload.data);
  return paginationResponse(result, res);
};

// command
const updateOneWorker = async (req, res) => {
  const payload = { ...req.body, ...req.params };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.updateWorkerParamType
  );
  if (req.file) {
    payload.avatar_url = `/uploads/avatars/worker/avatars/${req.file.filename}`;
  }
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.updateOneWorker(validatePayload.data);
  return sendResponse(result, res);
};

const updateSelfWorker = async (req, res) => {
  const payload = {
    ...req.body,
    id: req.userMeta.worker_id,
    user_id: req.userMeta.id,
  };
  if (req.file) {
    payload.avatar_url = `/uploads/avatars/worker/avatars/${req.file.filename}`;
  }
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.updateWorkerParamType
  );

  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.updateOneWorker(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = { getWorkerByUserId, getWorkerById, getWorkers, updateOneWorker, updateSelfWorker };
