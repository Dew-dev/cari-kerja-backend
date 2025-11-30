const joi = require("joi");

const addExperienceLevelType = joi.object({
  name: joi.string().required(),
});

const updateExperienceLevelType = joi.object({
  id: joi.number().required(),
  name: joi.string().required(),
});

const deleteExperienceLevelType = joi.object({
  id: joi.number().required(),
});

module.exports = {
  addExperienceLevelType,
  updateExperienceLevelType,
  deleteExperienceLevelType,
};
