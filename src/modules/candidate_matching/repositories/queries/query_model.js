const joi = require("joi");

const getMatchByApplicationParamType = joi.object({
  application_id: joi.string().uuid().required(),
  recruiter_id: joi.string().uuid().required(),
});

module.exports = {
  getMatchByApplicationParamType,
};
