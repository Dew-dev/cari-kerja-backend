const joi = require("joi");

const getOneIndustryType = joi.object({
  id: joi.number().required(),
});

const getAllIndustriesType = joi.object({
  page: joi.number().default(1).optional(),
  limit: joi.number().default(10).optional(),
  search: joi.string().optional(),
});

module.exports = {
  getOneIndustryType,
  getAllIndustriesType,
};
