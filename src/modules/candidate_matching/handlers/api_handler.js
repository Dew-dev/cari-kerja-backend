const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");

const getApplicationMatch = async (req, res) => {
  const payload = {
    application_id: req.params.id,
    recruiter_id: req.userMeta.recruiter_id,
  };

  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getMatchByApplicationParamType,
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await queryHandler.getMatchByApplication(validatePayload.data);
  return sendResponse(result, res);
};

const rematchJobPost = async (req, res) => {
  const payload = {
    job_post_id: req.params.id,
    recruiter_id: req.userMeta.recruiter_id,
  };

  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.rematchJobPostParamType,
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.rematchJobPost(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  getApplicationMatch,
  rematchJobPost,
};
