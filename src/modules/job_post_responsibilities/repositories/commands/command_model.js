const joi = require("joi");

const addJobPostResponsibilityParamType = joi.object({
  job_post_id: joi.string().required(),
  recruiter_id: joi.string().required(),
  responsibility: joi.string().required(),
  order_index: joi.number().required(),
});

const updateJobPostResponsibilityParamType = joi.object({
  id: joi.string().required(),
  job_post_id: joi.string().required(),
  recruiter_id: joi.string().required(),
  responsibility: joi.string().optional().allow(null),
  order_index: joi.number().optional().allow(null),
});

// Schema untuk menghapus Educations
const deleteJobPostResponsibilityParamType = joi.object({
  job_post_id: joi.string().required(),
  id: joi.string().required(),
  recruiter_id: joi.string().required(),
});

module.exports = {
  addJobPostResponsibilityParamType,
  updateJobPostResponsibilityParamType,
  deleteJobPostResponsibilityParamType,
};
