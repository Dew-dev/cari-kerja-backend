const joi = require("joi");

const listJobTitlesParamType = joi.object({
  search: joi.string().allow("").optional(),
  category_id: joi.number().integer().positive().optional(),
  locale: joi.string().trim().max(16).optional(),
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
});

const getJobTitleParamType = joi.object({
  id: joi.string().uuid().required(),
  locale: joi.string().trim().max(16).optional(),
});

module.exports = {
  listJobTitlesParamType,
  getJobTitleParamType,
};
