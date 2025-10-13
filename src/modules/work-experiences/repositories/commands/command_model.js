const joi = require("joi");

// Schema untuk menambahkan Work Experience
const addWorkExperienceParamType = joi.object({
  worker_id: joi.string().uuid().required(),
  company_name: joi.string().max(150).required(),
  job_title: joi.string().max(100).required(),
  start_date: joi.date().required(),
  end_date: joi.date().optional().allow(null),
  is_current: joi.boolean().optional().default(false),
  description: joi.string().optional().allow(null),
});

// Schema untuk mengupdate Work Experience
const updateWorkExperienceParamType = joi.object({
  id: joi.string().uuid().required(), // work experience id
  worker_id: joi.string().uuid().required(),
  company_name: joi.string().max(150).required(),
  job_title: joi.string().max(100).required(),
  start_date: joi.date().required(),
  end_date: joi.date().optional().allow(null),
  is_current: joi.boolean().optional().default(false),
  description: joi.string().optional().allow(null),
});

const deleteWorkExperienceParamType = joi.object({
  worker_id: joi.string().uuid().required(),
  id: joi.string().uuid().required(),
});

module.exports = {
  addWorkExperienceParamType,
  updateWorkExperienceParamType,
  deleteWorkExperienceParamType
};
