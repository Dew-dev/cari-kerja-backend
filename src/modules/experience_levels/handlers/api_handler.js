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
const getExperienceLevel = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getOneExperienceLevelType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getExperienceLevel(validatePayload.data);
  return sendResponse(result, res);
};

const getAllExperienceLevels = async (req, res) => {
  const payload = { ...req.query };

  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getAllExperienceLevelsType
  );
  //console.log(validatePayload);

  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getAllExperienceLevels(
    validatePayload.data
  );
  return paginationResponse(result, res);
};

//command
const addExperienceLevel = async (req, res) => {
  const payload = { ...req.body };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.addExperienceLevelType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.addExperienceLevel(validatePayload.data);
  return sendResponse(result, res);
};

const updateExperienceLevel = async (req, res) => {
  const payload = { ...req.params, ...req.body };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.updateExperienceLevelType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.updateExperienceLevel(
    validatePayload.data
  );
  return sendResponse(result, res);
};

const deleteExperienceLevel = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.deleteExperienceLevelType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.deleteExperienceLevel(
    validatePayload.data
  );
  return sendResponse(result, res);
};

module.exports = {
  getExperienceLevel,
  getAllExperienceLevels,
  addExperienceLevel,
  updateExperienceLevel,
  deleteExperienceLevel,
};
