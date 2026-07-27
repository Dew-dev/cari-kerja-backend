const joi = require("joi");

const listJobTitlesParamType = joi.object({
  search: joi.string().allow("").optional(),
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
});

const getJobTitleParamType = joi.object({
  id: joi.string().uuid().required(),
});

module.exports = {
  listJobTitlesParamType,
  getJobTitleParamType,
};
