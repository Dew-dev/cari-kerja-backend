const joi = require("joi");

const industryName = joi
  .string()
  .trim()
  .min(1)
  .max(255)
  .required()
  .messages({
    "string.empty": "Industry name must not be empty",
    "string.min": "Industry name must not be empty",
    "string.max": "Industry name must be at most {#limit} characters",
  });

const addIndustryType = joi.object({
  name: industryName,
});

const updateIndustryType = joi.object({
  id: joi.number().required(),
  name: industryName,
});

const deleteIndustryType = joi.object({
  id: joi.number().required(),
});

module.exports = {
  addIndustryType,
  updateIndustryType,
  deleteIndustryType,
};
