const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");
const { get } = require("../../../config/global_config");

const getOneTagByName = async (req, res) => {
  const payload = req.params;
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getOneTagByNameParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getOneTagByName(validatePayload.data);
  return sendResponse(result, res);
};

const getTagByName = async (req, res) => {
  const payload = req.params;
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getOneTagByNameParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getTagByName(validatePayload.data);
  return sendResponse(result, res);
};

const getTagsPerJobPost = async (req, res) => {
  const payload = req.params;
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getTagsPerJobPostParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getTagsPerJobPost(validatePayload.data);
  return sendResponse(result, res);
};

const getOneJobPostTagByTagIdAndJobPostId = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getOneJobPostTagByTagIdAndJobPostIdParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getOneJobPostTagByTagIdAndJobPostId(
    validatePayload.data
  );
  return sendResponse(result, res);
};

const createJobPostTag = async (req, res) => {
  const { job_post_id } = req.params;
  const { name } = req.body;
  const { role_id, recruiter_id } = req.userMeta;
  const payload = { name, job_post_id, role_id, recruiter_id };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.createJobPostTagParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.createJobPostTag(validatePayload.data);
  return sendResponse(result, res);
};

const createJobTag = async (req, res) => {
  const { name } = req.body;
  const payload = { name };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.createJobTagParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.createJobTag(validatePayload.data);
  return sendResponse(result, res);
};

const deleteJobPostTag = async (req, res) => {
  const payload = {
    ...req.params,
    ...req.body,
    role_id: req.userMeta.role_id,
    recruiter_id: req.userMeta.recruiter_id,
  };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.deleteJobPostTagParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.deleteJobPostTag(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  getTagsPerJobPost,
  getOneTagByName,
  getOneJobPostTagByTagIdAndJobPostId,
  createJobPostTag,
  deleteJobPostTag,
  createJobTag,
  getTagByName,
};
