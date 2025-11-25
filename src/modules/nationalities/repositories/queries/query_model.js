const joi = require("joi");

const getOneNationalityType = joi.object({
  id: joi.number().required(),
});

const getAllNationalitiesType = joi.object({
  page: joi.number().default(1).optional(),
  limit: joi.number().default(10).optional(),
  search: joi.string().optional(),
});

module.exports = {
  getOneNationalityType,
  getAllNationalitiesType,
};
