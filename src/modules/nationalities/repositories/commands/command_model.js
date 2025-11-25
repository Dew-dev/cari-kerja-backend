const joi = require("joi");

const addNationalityType = joi.object({
  country_name: joi.string().required(),
  iso_alpha2: joi.string().required(),
  iso_alpha3: joi.string().required(),
});

const updateNationalityType = joi.object({
  id: joi.number().required(),
  country_name: joi.string().required(),
});

const deleteNationalityType = joi.object({
  id: joi.number().required(),
});

module.exports = {
  addNationalityType,
  updateNationalityType,
  deleteNationalityType,
};
