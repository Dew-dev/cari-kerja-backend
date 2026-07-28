const joi = require("joi");
const { SUPPORTED_LOCALES } = require("../../../../helpers/i18n/locale");

const categoryName = joi
  .string()
  .trim()
  .min(1)
  .max(255)
  .messages({
    "string.empty": "Category name must not be empty",
    "string.min": "Category name must not be empty",
    "string.max": "Category name must be at most {#limit} characters",
  });

const translationEntry = joi.object({
  name: categoryName.required(),
});

const translationsMap = joi
  .object()
  .pattern(joi.string().valid(...SUPPORTED_LOCALES), translationEntry)
  .min(1);

const addCategoryType = joi
  .object({
    name: categoryName.optional(),
    translations: translationsMap.optional(),
  })
  .or("name", "translations");

const updateCategoryType = joi
  .object({
    id: joi.number().required(),
    name: categoryName.optional(),
    translations: translationsMap.optional(),
  })
  .or("name", "translations");

const deleteCategoryType = joi.object({
  id: joi.number().required(),
});

module.exports = {
  addCategoryType,
  updateCategoryType,
  deleteCategoryType,
};
