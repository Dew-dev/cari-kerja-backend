const joi = require("joi");

const nameField = joi
  .string()
  .trim()
  .min(1)
  .max(255)
  .required()
  .messages({
    "string.empty": "Name must not be empty",
    "string.min": "Name must not be empty",
    "string.max": "Name must be at most {#limit} characters",
  });

const addExperienceLevelType = joi.object({
  name: nameField,
});

const updateExperienceLevelType = joi.object({
  id: joi.number().required(),
  name: nameField,
});

const deleteExperienceLevelType = joi.object({
  id: joi.number().required(),
});

module.exports = {
  addExperienceLevelType,
  updateExperienceLevelType,
  deleteExperienceLevelType,
};
