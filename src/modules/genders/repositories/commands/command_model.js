const joi = require("joi");

const addGenderType = joi.object({
  gender_name: joi.string().required(),
});

const updateGenderType = joi.object({
  id: joi.number().required(),
  gender_name: joi.string().required(),
});

const deleteGenderType = joi.object({
  id: joi.number().required(),
});

module.exports = {
  addGenderType,
  updateGenderType,
  deleteGenderType,
};
