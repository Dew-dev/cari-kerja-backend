const joi = require("joi");

const getJobpostsByRecruiterIdParamType = joi.object({
  recruiter_id: joi.string().required(),
  status: joi.string().optional(),
  employment_type: joi.string().optional(),
  location: joi.string().optional(),
  salary_min: joi.number().optional(),
  salary_max: joi.number().optional(),
  currency: joi.string().optional(),
  created_after: joi.string().optional(),
  created_before: joi.string().optional(),
  sort_by: joi.string().optional(),
  sort_order: joi.string().optional(),
  limit: joi.number().optional(),
  page: joi.number().optional(),
  orderColumn: joi.string().optional(),
  orderDirection: joi.string().optional(),
  values: joi.array().required(),
  conditions: joi.array().required(),
  idx: joi.number().required(),
});

const getJobpostsParamType = joi.object({
  status: joi.string().optional(),
  employment_type: joi.string().optional(),
  location: joi.string().optional(),
  salary_min: joi.number().optional(),
  salary_max: joi.number().optional(),
  currency: joi.string().optional(),
  created_after: joi.string().optional(),
  created_before: joi.string().optional(),
  search: joi.string().optional(),
  sort_by: joi.string().optional(),
  sort_order: joi.string().optional(),
  page: joi.number().optional(),
  limit: joi.number().optional(),
});

const getJobpostsSelfParamType = joi.object({
  recruiter_id: joi.string().required(),
  status: joi.string().optional(),
  employment_type: joi.string().optional(),
  location: joi.string().optional(),
  salary_min: joi.number().optional(),
  salary_max: joi.number().optional(),
  currency: joi.string().optional(),
  created_after: joi.string().optional(),
  created_before: joi.string().optional(),
  search: joi.string().optional(),
  sort_by: joi.string().optional(),
  sort_order: joi.string().optional(),
  page: joi.number().optional(),
  limit: joi.number().optional(),
});

const getJobpostByIdParamType = joi.object({
  id: joi.string().required(),
});

const getJobpostQuestionsParamType = joi.object({
  job_post_id: joi.string().uuid().required(),
  question_type: joi.string().optional(),
  is_required: joi.boolean().optional(),
  order_index_min: joi.number().integer().optional(),
  order_index_max: joi.number().integer().optional(),
  created_after: joi.date().optional(),
  created_before: joi.date().optional(),
  search: joi.string().optional(),
  sort_by: joi
    .string()
    .valid("order_index", "created_at", "updated_at", "question_text")
    .default("order_index"),
  sort_order: joi.string().valid("asc", "desc").default("asc"),
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(10),
});

module.exports = {
  getJobpostsByRecruiterIdParamType,
  getJobpostByIdParamType,
  getJobpostsParamType,
  getJobpostsSelfParamType,
  getJobpostQuestionsParamType,
};
