const joi = require("joi");

const listTemplatesParamType = joi.object({
  recruiter_id: joi.string().uuid().required(),
});

const getTemplateParamType = joi.object({
  id: joi.string().uuid().required(),
  recruiter_id: joi.string().uuid().required(),
});

const listCampaignsParamType = joi.object({
  recruiter_id: joi.string().uuid().required(),
  job_post_id: joi.string().uuid().optional(),
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
});

const getCampaignParamType = joi.object({
  id: joi.string().uuid().required(),
  recruiter_id: joi.string().uuid().required(),
});

const getWorkerPreferencesParamType = joi.object({
  worker_id: joi.string().uuid().required(),
});

module.exports = {
  listTemplatesParamType,
  getTemplateParamType,
  listCampaignsParamType,
  getCampaignParamType,
  getWorkerPreferencesParamType,
};
