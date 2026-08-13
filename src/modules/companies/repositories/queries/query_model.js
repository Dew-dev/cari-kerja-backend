const joi = require("joi");

const getCompanyByIdParamType = joi.object({
  id: joi.string().uuid().required(),
});

const listCompaniesParamType = joi.object({
  search: joi.string().optional().allow("", null),
  industry_id: joi.number().integer().optional(),
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  getCompanyByIdParamType,
  listCompaniesParamType,
};
