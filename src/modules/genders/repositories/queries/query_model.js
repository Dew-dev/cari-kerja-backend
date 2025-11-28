const joi = require("joi");

const getOneGenderType = joi.object({
  id: joi.number().required(),
});

const getAllGendersType = joi.object({
  page: joi.number().default(1).optional(),
  limit: joi.number().default(10).optional(),
  search: joi.string().optional(),
});

module.exports = {
  getOneGenderType,
  getAllGendersType,
};
