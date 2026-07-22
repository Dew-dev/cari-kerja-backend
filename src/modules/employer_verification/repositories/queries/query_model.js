const joi = require("joi");

const getStatusParamType = joi.object({
  user_id: joi.string().uuid().required(),
  role_id: joi.number().required(),
});

const listApplicationsParamType = joi.object({
  status: joi
    .string()
    .valid("draft", "submitted", "under_review", "approved", "rejected")
    .optional(),
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
});

const getApplicationByIdParamType = joi.object({
  id: joi.string().uuid().required(),
});

const listReactivationRequestsParamType = joi.object({
  status: joi
    .string()
    .valid("open", "approved", "rejected", "cancelled")
    .optional(),
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  getStatusParamType,
  listApplicationsParamType,
  getApplicationByIdParamType,
  listReactivationRequestsParamType,
};
