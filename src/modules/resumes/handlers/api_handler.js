const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const {
  sendResponse,
  paginationResponse,
} = require("../../../helpers/utils/response");

// query
const getResume = async (req, res) => {
  const payload = { ...req.params, worker_id: req.userMeta.worker_id };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getResumeType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getResume(validatePayload.data);
  return sendResponse(result, res);
};

const getAllResumes = async (req, res) => {
  const payload = {
    worker_id: req.userMeta.worker_id,
    ...req.query,
    ...req.params,
  };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getAllResumesType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getAllResumes(validatePayload.data);
  return paginationResponse(result, res);
};

// command
const addResume = async (req, res) => {
  const payload = { worker_id: req.userMeta.worker_id, ...req.body };
  if (req.file) {
    payload.resume_url = `/uploads/resumes/${req.file.filename}`;
  }
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.addResumeType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.addResume(validatePayload.data);
  return sendResponse(result, res);
};

const updateResume = async (req, res) => {
  const payload = {
    id: req.params.id,
    worker_id: req.userMeta.worker_id,
    ...req.body,
  };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.updateResumeType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.updateResume(validatePayload.data);
  return sendResponse(result, res);
};

const deleteResume = async (req, res) => {
  const payload = { id: req.params.id };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.deleteResumeType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.deleteResume(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  getResume,
  getAllResumes,
  addResume,
  updateResume,
  deleteResume,
};
