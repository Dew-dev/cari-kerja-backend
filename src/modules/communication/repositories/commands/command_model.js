const joi = require("joi");

const createTemplateParamType = joi.object({
  recruiter_id: joi.string().uuid().required(),
  name: joi.string().max(255).required(),
  subject: joi.string().max(500).required(),
  body: joi.string().required(),
  channel: joi.string().valid("email").default("email"),
});

const updateTemplateParamType = joi.object({
  id: joi.string().uuid().required(),
  recruiter_id: joi.string().uuid().required(),
  name: joi.string().max(255).optional(),
  subject: joi.string().max(500).optional(),
  body: joi.string().optional(),
  channel: joi.string().valid("email").optional(),
});

const deleteTemplateParamType = joi.object({
  id: joi.string().uuid().required(),
  recruiter_id: joi.string().uuid().required(),
});

const bulkSendParamType = joi.object({
  recruiter_id: joi.string().uuid().required(),
  channel: joi.string().valid("email").default("email"),
  template_id: joi.string().uuid().optional().allow(null),
  subject: joi.string().max(500).required(),
  body: joi.string().required(),
  application_ids: joi.array().items(joi.string().uuid()).min(1).required(),
  job_post_id: joi.string().uuid().optional().allow(null),
});

const updateWorkerPreferencesParamType = joi.object({
  worker_id: joi.string().uuid().required(),
  email_opt_out: joi.boolean().required(),
});

const unsubscribeParamType = joi.object({
  token: joi.string().uuid().required(),
});

module.exports = {
  createTemplateParamType,
  updateTemplateParamType,
  deleteTemplateParamType,
  bulkSendParamType,
  updateWorkerPreferencesParamType,
  unsubscribeParamType,
};
