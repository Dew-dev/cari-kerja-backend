const joi = require("joi");

const getOneCategoryType = joi.object({
  id: joi.number().required(),
});

const getAllCategoriesType = joi.object({
  page: joi.number().default(1).optional(),
  limit: joi.number().default(10).optional(),
  search: joi.string().optional(),
});

module.exports = {
  getOneCategoryType,
  getAllCategoriesType,
};
