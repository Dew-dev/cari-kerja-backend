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
const getSkill = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getOneSkillType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getSkill(validatePayload.data);
  return sendResponse(result, res);
};

const getAllSkills = async (req, res) => {
  const payload = { ...req.query };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getAllSkillType
  );
  ////console.log(validatePayload);

  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getAllSkills(validatePayload.data);
  return paginationResponse(result, res);
};

//command
const addSkill = async (req, res) => {
  const payload = { ...req.body };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.addSkillType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.addSkill(validatePayload.data);
  return sendResponse(result, res);
};

const updateSkill = async (req, res) => {
  const payload = { ...req.params, ...req.body };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.updateSkillType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.updateSkill(validatePayload.data);
  return sendResponse(result, res);
};

const deleteSkill = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.deleteSkillType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.deleteSkill(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  getSkill,
  getAllSkills,
  addSkill,
  updateSkill,
  deleteSkill,
};
