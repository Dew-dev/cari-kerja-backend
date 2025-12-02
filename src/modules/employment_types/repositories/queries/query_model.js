const joi = require("joi");

const getOneEmploymentTypeType = joi.object({
  id: joi.number().required(),
});

const getAllEmploymentTypesType = joi.object({
  page: joi.number().default(1).optional(),
  limit: joi.number().optional(),
  search: joi.string().optional(),
});

module.exports = {
  getOneEmploymentTypeType,
  getAllEmploymentTypesType,
};
