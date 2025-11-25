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
const getIndustry = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getOneIndustryType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getIndustry(validatePayload.data);
  return sendResponse(result, res);
};

const getAllIndustries = async (req, res) => {
  const payload = { ...req.query };
  console.log("sebenernya masuk");
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getAllIndustriesType
  );
  console.log(validatePayload);

  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getAllIndustries(validatePayload.data);
  return paginationResponse(result, res);
};

//command
const addIndustry = async (req, res) => {
  const payload = { ...req.body };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.addIndustryType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.addIndustry(validatePayload.data);
  return sendResponse(result, res);
};

const updateIndustry = async (req, res) => {
  const payload = { ...req.params, ...req.body };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.updateIndustryType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.updateIndustry(validatePayload.data);
  return sendResponse(result, res);
};

const deleteIndustry = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.deleteIndustryType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.deleteIndustry(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  getIndustry,
  getAllIndustries,
  addIndustry,
  updateIndustry,
  deleteIndustry,
};
