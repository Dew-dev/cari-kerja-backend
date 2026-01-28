const joi = require("joi");

// GET ALL: /api/v1/workers/job_post_requirements
const getAllJobPostRequirementsParam = joi.object({
  job_post_id: joi.string().uuid().required(),
});

module.exports = {
  getAllJobPostRequirementsParam,
};

