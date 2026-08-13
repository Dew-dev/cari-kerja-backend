const joi = require("joi");

const getOneCategoryType = joi.object({
  id: joi.number().required(),
  locale: joi.string().trim().max(16).optional(),
  include_translations: joi
    .alternatives()
    .try(joi.boolean(), joi.string().valid("true", "false", "1", "0"))
    .optional(),
});

const getAllCategoriesType = joi.object({
  page: joi.number().default(1).optional(),
  limit: joi.number().default(10).optional(),
  search: joi.string().optional(),
  locale: joi.string().trim().max(16).optional(),
});

module.exports = {
  getOneCategoryType,
  getAllCategoriesType,
};
