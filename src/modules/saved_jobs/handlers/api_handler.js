const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const logger = require("../../../helpers/utils/logger");
const wrapper = require("../../../helpers/utils/wrapper");
const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const {
  sendResponse,
  paginationResponse,
} = require("../../../helpers/utils/response");

const getSavedJobsByWorkerId = async (req, res) => {
  const payload = {...req.params, ...req.query};
  
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getSavedJobsByWorkerIdParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getSavedJobsByWorkerId(
    validatePayload.data
  );
  return paginationResponse(result, res);
};

const getSavedJobsById = async (req, res) => {
  const payload = req.params;
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getSavedJobsByIdParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getSavedJobsById(validatePayload.data);
  return sendResponse(result, res);
};

const getSavedJobs = async (req, res) => {
  let payload = { ...req.query };

  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getSavedJobsParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getSavedJobs(validatePayload.data);
  return paginationResponse(result, res);
};

const getSavedJobsSelf = async (req, res) => {
  const payload = { ...req.query, worker_id: req.userMeta.worker_id };
  ////console.log(payload);

  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getSavedJobsSelfParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getSavedJobsSelf(validatePayload.data);
  return paginationResponse(result, res);
};

const createSavedJob = async (req, res) => {
  const payload = { ...req.params, worker_id: req.userMeta.worker_id };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.createSavedJobParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.createSavedJob(validatePayload.data);
  return sendResponse(result, res, 201);
};

const deleteJobPost = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.deleteSavedJobParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.deleteSavedJob(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  getSavedJobsByWorkerId,
  getSavedJobsById,
  getSavedJobs,
  getSavedJobsSelf,
  createSavedJob,
  deleteJobPost,
};
