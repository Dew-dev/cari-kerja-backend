const joi = require("joi");

const updateUserStatusParamType = joi.object({
  id: joi.string().uuid().required(),
  is_suspended: joi.boolean().required()
});

const verifyEmployerParamType = joi.object({
  id: joi.string().uuid().required(),
  is_verified: joi.boolean().required()
});

const updateJobStatusParamType = joi.object({
  id: joi.string().uuid().required(),
  status: joi.string().valid("OPEN", "CLOSED", "DRAFT", "PENDING", "REJECTED", "ARCHIVED").required()
});

module.exports = {
  updateUserStatusParamType,
  verifyEmployerParamType,
  updateJobStatusParamType
};
