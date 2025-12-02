const joi = require("joi");

const addEmploymentTypeType = joi.object({
  name: joi.string().required(),
});

const updateEmploymentTypeType = joi.object({
  id: joi.number().required(),
  name: joi.string().required(),
});

const deleteEmploymentTypeType = joi.object({
  id: joi.number().required(),
});

module.exports = {
  addEmploymentTypeType,
  updateEmploymentTypeType,
  deleteEmploymentTypeType,
};
