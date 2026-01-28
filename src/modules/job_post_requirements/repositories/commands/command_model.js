const joi = require("joi");

// Schema untuk menambahkan JobPostRequirements
const addJobPostRequirementParamType = joi.object({
  job_post_id: joi.string().required(),
  recruiter_id: joi.string().required(),
  requirement: joi.string().required(),
  order_index: joi.number().required(),
});

// Schema untuk mengupdate Educations
const updateJobPostRequirementParamType = joi.object({
  id: joi.string().required(), // JobPostRequirement id
  job_post_id: joi.string().required(),
  recruiter_id: joi.string().required(),
  description: joi.string().optional().allow(null),
  order_index: joi.number().optional().allow(null),
});

// Schema untuk menghapus Educations
const deleteJobPostRequirementParamType = joi.object({
  job_post_id: joi.string().required(),
  id: joi.string().required(),
  recruiter_id: joi.string().required(),
});

module.exports = {
  addJobPostRequirementParamType,
  updateJobPostRequirementParamType,
  deleteJobPostRequirementParamType,
};
