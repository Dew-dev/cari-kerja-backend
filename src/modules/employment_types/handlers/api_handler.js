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
const getEmploymentType = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getOneEmploymentTypeType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getEmploymentType(validatePayload.data);
  return sendResponse(result, res);
};

const getAllEmploymentTypes = async (req, res) => {
  const payload = { ...req.query };

  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getAllEmploymentTypesType
  );
  console.log(validatePayload);

  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getAllEmploymentTypes(validatePayload.data);
  return paginationResponse(result, res);
};

//command
const addEmploymentType = async (req, res) => {
  const payload = { ...req.body };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.addEmploymentTypeType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.addEmploymentType(validatePayload.data);
  return sendResponse(result, res);
};

const updateEmploymentType = async (req, res) => {
  const payload = { ...req.params, ...req.body };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.updateEmploymentTypeType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.updateEmploymentType(validatePayload.data);
  return sendResponse(result, res);
};

const deleteEmploymentType = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.deleteEmploymentTypeType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.deleteEmploymentType(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  getEmploymentType,
  getAllEmploymentTypes,
  addEmploymentType,
  updateEmploymentType,
  deleteEmploymentType,
};
