const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const {
  sendResponse,
  paginationResponse,
} = require("../../../helpers/utils/response");

const listJobTitles = async (req, res) => {
  const validatePayload = validator.isValidPayload(
    { ...req.query },
    queryModel.listJobTitlesParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await queryHandler.list(validatePayload.data);
  return paginationResponse(result, res);
};

const getJobTitle = async (req, res) => {
  const validatePayload = validator.isValidPayload(
    { id: req.params.id, locale: req.query.locale },
    queryModel.getJobTitleParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await queryHandler.getById(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  listJobTitles,
  getJobTitle,
};
