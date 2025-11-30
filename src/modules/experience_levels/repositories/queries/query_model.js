const joi = require("joi");

const getOneExperienceLevelType = joi.object({
  id: joi.number().required(),
});

const getAllExperienceLevelsType = joi.object({
  page: joi.number().default(1).optional(),
  limit: joi.number().optional(),
  search: joi.string().optional(),
});

module.exports = {
  getOneExperienceLevelType,
  getAllExperienceLevelsType,
};
