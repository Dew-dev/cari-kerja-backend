const joi = require("joi");

const dateString = joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).messages({
  "string.pattern.base": "Date must be in YYYY-MM-DD format",
});

// Schema untuk menambahkan Work Experience
const addWorkExperienceParamType = joi.object({
  worker_id: joi.string().uuid().required(),
  company_name: joi.string().max(150).required(),
  job_title_id: joi.string().uuid().optional().allow(null),
  job_title: joi.string().max(100).required(),
  start_date: dateString.required(),
  end_date: dateString.optional().allow(null),
  is_current: joi.boolean().optional().default(false),
  description: joi.string().optional().allow(null),
});

// Schema untuk mengupdate Work Experience
const updateWorkExperienceParamType = joi.object({
  id: joi.string().uuid().required(), // work experience id
  worker_id: joi.string().uuid().required(),
  company_name: joi.string().max(150).required(),
  job_title_id: joi.string().uuid().optional().allow(null),
  job_title: joi.string().max(100).required(),
  start_date: dateString.required(),
  end_date: dateString.optional().allow(null),
  is_current: joi.boolean().optional().default(false),
  description: joi.string().optional().allow(null),
});

const deleteWorkExperienceParamType = joi.object({
  id: joi.string().uuid().required(),
  worker_id: joi.string().uuid().required(),
});

module.exports = {
  addWorkExperienceParamType,
  updateWorkExperienceParamType,
  deleteWorkExperienceParamType,
};
