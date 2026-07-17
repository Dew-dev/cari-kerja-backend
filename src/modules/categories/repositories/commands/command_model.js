const joi = require("joi");

const categoryName = joi
  .string()
  .trim()
  .min(1)
  .max(255)
  .required()
  .messages({
    "string.empty": "Category name must not be empty",
    "string.min": "Category name must not be empty",
    "string.max": "Category name must be at most {#limit} characters",
  });

const addCategoryType = joi.object({
  name: categoryName,
});

const updateCategoryType = joi.object({
  id: joi.number().required(),
  name: categoryName,
});

const deleteCategoryType = joi.object({
  id: joi.number().required(),
});

module.exports = {
  addCategoryType,
  updateCategoryType,
  deleteCategoryType,
};
