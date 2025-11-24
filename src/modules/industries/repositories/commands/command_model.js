const joi = require("joi");

const addIndustryType = joi.object({
  name: joi.string().required(),
});

const updateIndustryType = joi.object({
  id: joi.number().required(),
  name: joi.string().required(),
});

const deleteIndustryType = joi.object({
  id: joi.number().required(),
});

module.exports = {
  addIndustryType,
  updateIndustryType,
  deleteIndustryType,
};
