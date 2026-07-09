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

const updateSystemSettingsParamType = joi.object({
  platform_name: joi.string().optional(),
  support_email: joi.string().email().optional(),
  maintenance_mode: joi.boolean().optional(),
  max_upload_size_mb: joi.number().optional(),
  allow_employer_registration: joi.boolean().optional()
});

module.exports = {
  updateUserStatusParamType,
  verifyEmployerParamType,
  updateJobStatusParamType,
  updateSystemSettingsParamType
};
