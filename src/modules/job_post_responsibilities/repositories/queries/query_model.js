const joi = require("joi");

const getAllJobPostResponsibilitiesParam = joi.object({
  job_post_id: joi.string().uuid().required(),
});

module.exports = {
  getAllJobPostResponsibilitiesParam,
};

