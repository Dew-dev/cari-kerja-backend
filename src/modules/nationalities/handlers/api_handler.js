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
const getNationality = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getOneNationalityType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getNationality(validatePayload.data);
  return sendResponse(result, res);
};

const getAllNationalities = async (req, res) => {
  const payload = { ...req.query };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getAllNationalitiesType
  );
  ////console.log(validatePayload);

  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getAllNationalities(validatePayload.data);
  return paginationResponse(result, res);
};

//command
const addNationality = async (req, res) => {
  const payload = { ...req.body };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.addNationalityType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.addNationality(validatePayload.data);
  return sendResponse(result, res);
};

const updateNationality = async (req, res) => {
  const payload = { ...req.params, ...req.body };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.updateNationalityType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.updateNationality(validatePayload.data);
  return sendResponse(result, res);
};

const deleteNationality = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.deleteNationalityType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.deleteNationality(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  getNationality,
  getAllNationalities,
  addNationality,
  updateNationality,
  deleteNationality,
};
