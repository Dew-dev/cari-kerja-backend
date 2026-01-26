const joi = require("joi");

const addCategoryType = joi.object({
  name: joi.string().required(),
});

const updateCategoryType = joi.object({
  id: joi.number().required(),
  name: joi.string().required(),
});

const deleteCategoryType = joi.object({
  id: joi.number().required(),
});

module.exports = {
  addCategoryType,
  updateCategoryType,
  deleteCategoryType,
};
