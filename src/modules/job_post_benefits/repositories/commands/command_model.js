const joi = require("joi");

const addJobPostBenefitParamType = joi.object({
  job_post_id: joi.string().required(),
  recruiter_id: joi.string().required(),
  benefit: joi.string().required(),
  order_index: joi.number().required(),
});

const updateJobPostBenefitParamType = joi.object({
  id: joi.string().required(),
  job_post_id: joi.string().required(),
  recruiter_id: joi.string().required(),
  benefit: joi.string().optional().allow(null),
  order_index: joi.number().optional().allow(null),
});

// Schema untuk menghapus Educations
const deleteJobPostBenefitParamType = joi.object({
  job_post_id: joi.string().required(),
  id: joi.string().required(),
  recruiter_id: joi.string().required(),
});

module.exports = {
  addJobPostBenefitParamType,
  updateJobPostBenefitParamType,
  deleteJobPostBenefitParamType,
};
