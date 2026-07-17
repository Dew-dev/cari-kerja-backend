const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const logger = require("../../../helpers/utils/logger");
const wrapper = require("../../../helpers/utils/wrapper");
const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const { ForbiddenError } = require("../../../helpers/errors");
const {
  sendResponse,
  paginationResponse,
} = require("../../../helpers/utils/response");

// super_admin (role_id 3) is allowed to access data belonging to any worker
const SUPER_ADMIN_ROLE_ID = 3;

const getSavedJobsByWorkerId = async (req, res) => {
  const payload = {...req.params, ...req.query};

  const isSuperAdmin = req.userMeta?.role_id === SUPER_ADMIN_ROLE_ID;
  if (!isSuperAdmin && req.userMeta?.worker_id !== payload.worker_id) {
    return paginationResponse(
      wrapper.error(new ForbiddenError("You are not allowed to access this resource")),
      res
    );
  }

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
  const payload = { ...req.params, worker_id: req.userMeta.worker_id };
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
