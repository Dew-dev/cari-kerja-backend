const joi = require("joi");

const createJobPostTagParamType = joi.object({
  name: joi.string().required(),
  job_post_id: joi.string().required(),
  role_id: joi.number().required(),
  recruiter_id: joi.string().required(),
});

const deleteJobPostTagParamType = joi.object({
  tag_id: joi.string().required(),
  job_post_id: joi.string().required(),
  role_id: joi.number().required(),
  recruiter_id: joi.string().required(),
});

const createJobTagParamType = joi.object({
  name: joi.string().required(),
});

module.exports = {
  createJobPostTagParamType,
  deleteJobPostTagParamType,
  createJobTagParamType,
};
