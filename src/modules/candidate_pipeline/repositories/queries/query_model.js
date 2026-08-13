const joi = require("joi");
const { STAGE_TYPES } = require("../commands/command_model");

const uuidCsvOrArray = joi.alternatives().try(
  joi.array().items(joi.string().uuid()),
  joi.string(),
);

const getStagesParamType = joi.object({
  job_post_id: joi.string().uuid().required(),
  recruiter_id: joi.string().uuid().required(),
  company_id: joi.string().uuid().optional(),
});

const getPipelineCandidatesParamType = joi.object({
  recruiter_id: joi.string().uuid().required(),
  company_id: joi.string().uuid().optional(),
  job_post_id: uuidCsvOrArray.optional(),
  search: joi.string().trim().allow("").optional(),
  stage_type: joi.string().valid(...STAGE_TYPES).optional(),
  sort: joi
    .string()
    .valid("updated_at", "applied_at", "match_score")
    .default("updated_at"),
  order: joi.string().valid("asc", "desc").default("desc"),
  min_match_score: joi.number().integer().min(0).max(100).optional(),
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(10),
});

const getPipelineAnalyticsParamType = joi.object({
  recruiter_id: joi.string().uuid().required(),
  company_id: joi.string().uuid().optional(),
  job_post_id: uuidCsvOrArray.optional(),
});

const getApplicationTimelineParamType = joi.object({
  application_id: joi.string().uuid().required(),
  recruiter_id: joi.string().uuid().required(),
  company_id: joi.string().uuid().optional(),
});

module.exports = {
  getStagesParamType,
  getPipelineCandidatesParamType,
  getPipelineAnalyticsParamType,
  getApplicationTimelineParamType,
};
