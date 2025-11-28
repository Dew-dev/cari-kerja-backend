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
const getGender = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getOneGenderType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getGender(validatePayload.data);
  return sendResponse(result, res);
};

const getAllGenders = async (req, res) => {
  const payload = { ...req.query };

  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getAllGendersType
  );
  console.log(validatePayload);

  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getAllGenders(validatePayload.data);
  return paginationResponse(result, res);
};

//command
const addGender = async (req, res) => {
  const payload = { ...req.body };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.addGenderType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.addGender(validatePayload.data);
  return sendResponse(result, res);
};

const updateGender = async (req, res) => {
  const payload = { ...req.params, ...req.body };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.updateGenderType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.updateGender(validatePayload.data);
  return sendResponse(result, res);
};

const deleteGender = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.deleteGenderType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.deleteGender(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  getGender,
  getAllGenders,
  addGender,
  updateGender,
  deleteGender,
};
