const joi = require("joi");

const addLanguagesParamType = joi.object({
  worker_id: joi.string().uuid().required(),
  language_id: joi.number().integer().optional(),
  language_name: joi.string().max(100).required(),
  proficiency_level_id: joi.number().integer().required(),
  is_primary: joi.boolean().optional().default(false),
});

const updateLanguagesParamType = joi.object({
  id: joi.string().uuid().required(),
  worker_id: joi.string().uuid().required(),
  language_id: joi.number().integer().optional(),
  language_name: joi.string().max(100).required(),
  proficiency_level_id: joi.number().integer().required(),
  is_primary: joi.boolean().optional().default(false),
});

const deleteLanguagesParamType = joi.object({
  worker_id: joi.string().uuid().required(),
  id: joi.string().uuid().required(),
});

module.exports = {
  addLanguagesParamType,
  updateLanguagesParamType,
  deleteLanguagesParamType,
};
