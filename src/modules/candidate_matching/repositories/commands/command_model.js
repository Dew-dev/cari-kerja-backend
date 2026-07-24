const joi = require("joi");

const rematchJobPostParamType = joi.object({
  job_post_id: joi.string().uuid().required(),
  recruiter_id: joi.string().uuid().required(),
});

const computeApplicationMatchParamType = joi.object({
  application_id: joi.string().uuid().required(),
});

module.exports = {
  rematchJobPostParamType,
  computeApplicationMatchParamType,
};
