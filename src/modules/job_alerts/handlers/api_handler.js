const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");

const getJobAlerts = async (req, res) => {
  const payload = { worker_id: req.userMeta.worker_id };

  const validatePayload = validator.isValidPayload(payload, queryModel.getJobAlertsParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await queryHandler.getPreferences(validatePayload.data);
  return sendResponse(result, res);
};

const updateJobAlerts = async (req, res) => {
  const payload = {
    worker_id: req.userMeta.worker_id,
    enabled: req.body.enabled,
  };

  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.updateJobAlertsParamType,
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.updatePreferences(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  getJobAlerts,
  updateJobAlerts,
};
