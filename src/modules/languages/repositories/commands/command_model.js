const joi = require("joi");

// Schema untuk menambahkan Languages
const addLanguagesParamType = joi.object({
  worker_id: joi.string().uuid().required(),
  language_name: joi.string().max(100).required(),
  proficiency_level_id: joi.number().integer().required(),
  is_primary: joi.boolean().optional().default(false),
});

// Schema untuk mengupdate Languages
const updateLanguagesParamType = joi.object({
  id: joi.string().uuid().required(), // Languages id
  worker_id: joi.string().uuid().required(),
  language_name: joi.string().max(100).required(),
  proficiency_level_id: joi.number().integer().required(),
  is_primary: joi.boolean().optional().default(false),
});

// Schema untuk menghapus Languages
const deleteLanguagesParamType = joi.object({
  worker_id: joi.string().uuid().required(),
  id: joi.string().uuid().required(),
});

module.exports = {
  addLanguagesParamType,
  updateLanguagesParamType,
  deleteLanguagesParamType
};

