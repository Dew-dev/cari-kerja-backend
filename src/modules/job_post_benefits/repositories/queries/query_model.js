const joi = require("joi");

const getAllJobPostBenefitsParam = joi.object({
  job_post_id: joi.string().uuid().required(),
});

module.exports = {
  getAllJobPostBenefitsParam,
};

