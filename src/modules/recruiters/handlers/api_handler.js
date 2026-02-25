const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse, paginationResponse } = require("../../../helpers/utils/response");

// query
const getRecruiterByUserId = async (req, res) => {
  const payload = req.params;
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getRecruiterByUserIdParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getRecruiterByUserId(validatePayload.data);
  return sendResponse(result, res);
};

const getAllRecruitersByIndustry = async (req, res) => {
  const payload = {};
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getAllRecruitersByIndustryParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }

  const result = await queryHandler.getAllRecruitersByIndustry();
  return sendResponse(result, res);
};

const getAllCompanies = async (req, res) => {
  const payload = { ...req.query };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getAllCompaniesParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }

  const result = await queryHandler.getAllCompanies(validatePayload.data);
  return paginationResponse(result, res);
};

const updateOneRecruiter = async (req, res) => {
  const payload = { ...req.body, ...req.params };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.updateRecruiterParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.updateOneRecruiter(validatePayload.data);
  return sendResponse(result, res);
};

const updateOneRecruiterSelf = async (req, res) => {
  const payload = {
    user_id: req.userMeta.id,
    id: req.userMeta.recruiter_id,
    ...req.body,
  };
  if (req.file) {
    payload.avatar_url = `/uploads/avatars/recruiter/avatars/${req.file.filename}`;
  }
  ////console.log("payload \n", payload);
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.updateRecruiterParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.updateOneRecruiter(validatePayload.data);
  return sendResponse(result, res);
};

const updateRecruiterVipSelf = async (req, res) => {
  const payload = {
    user_id: req.userMeta.id,
    id: req.userMeta.recruiter_id,
    is_vip: req.body.is_vip,
    vip_start_at: req.body.vip_start_at,
    vip_end_at: req.body.vip_end_at,
  };

  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.updateRecruiterVipParamType
  );

  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }

  const result = await commandHandler.updateRecruiterVip(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  getRecruiterByUserId,
  getAllRecruitersByIndustry,
  getAllCompanies,
  updateOneRecruiter,
  updateOneRecruiterSelf,
  updateRecruiterVipSelf,
};
