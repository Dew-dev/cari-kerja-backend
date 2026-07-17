const joi = require("joi");

const dateString = joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).messages({
  "string.pattern.base": "Date must be in YYYY-MM-DD format",
});

// Schema untuk menambahkan Educations
const addEducationsParamType = joi.object({
  worker_id: joi.string().required(),
  institution_name: joi.string().max(150).required(),
  degree: joi.string().max(100).required(),
  major: joi.string().max(100).optional().allow("", null),
  start_date: dateString.required(),
  end_date: dateString.optional().allow(null),
  is_current: joi.boolean().optional().default(false),
  description: joi.string().optional().allow("", null),
});

// Schema untuk mengupdate Educations
const updateEducationsParamType = joi.object({
  id: joi.string().required(), // Educations id
  worker_id: joi.string().required(),
  institution_name: joi.string().max(150).required(),
  degree: joi.string().max(100).required(),
  major: joi.string().max(100).optional().allow(null),
  start_date: dateString.required(),
  end_date: dateString.optional().allow(null),
  is_current: joi.boolean().optional().default(false),
  description: joi.string().optional().allow(null),
});

// Schema untuk menghapus Educations
const deleteEducationsParamType = joi.object({
  worker_id: joi.string().required(),
  id: joi.string().required(),
});

module.exports = {
  addEducationsParamType,
  updateEducationsParamType,
  deleteEducationsParamType,
};
