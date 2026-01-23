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
const getCategory = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getOneCategoryType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getCategory(validatePayload.data);
  return sendResponse(result, res);
};

const getAllCategories = async (req, res) => {
  const payload = { ...req.query };
  //console.log("sebenernya masuk");
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getAllCategoriesType
  );
  //console.log(validatePayload);

  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getAllCategories(validatePayload.data);
  return paginationResponse(result, res);
};

//command
const addCategory = async (req, res) => {
  const payload = { ...req.body };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.addCategoryType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.addCategory(validatePayload.data);
  return sendResponse(result, res);
};

const updateCategory = async (req, res) => {
  const payload = { ...req.params, ...req.body };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.updateCategoryType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.updateCategory(validatePayload.data);
  return sendResponse(result, res);
};

const deleteCategory = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.deleteCategoryType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.deleteCategory(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  getCategory,
  getAllCategories,
  addCategory,
  updateCategory,
  deleteCategory,
};
