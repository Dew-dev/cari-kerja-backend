const joi = require("joi");

const genderName = joi
  .string()
  .trim()
  .min(1)
  .max(255)
  .required()
  .messages({
    "string.empty": "Gender name must not be empty",
    "string.min": "Gender name must not be empty",
    "string.max": "Gender name must be at most {#limit} characters",
  });

const addGenderType = joi.object({
  gender_name: genderName,
});

const updateGenderType = joi.object({
  id: joi.number().required(),
  gender_name: genderName,
});

const deleteGenderType = joi.object({
  id: joi.number().required(),
});

module.exports = {
  addGenderType,
  updateGenderType,
  deleteGenderType,
};
