const joi = require("joi");

const getJobpostsByRecruiterIdParamType = joi.object({
  recruiter_id: joi.string().required(),
  status: joi.string().optional(),
  employment_type: joi.string().optional(),
  experience_level: joi.string().optional(),
  location: joi.string().optional(),
  salary_min: joi.number().optional(),
  salary_max: joi.number().optional(),
  currency: joi.string().optional(),
  created_after: joi.string().optional(),
  created_before: joi.string().optional(),
  search: joi.string().optional(),
  sort_by: joi.string().optional(),
  sort_order: joi.string().optional(),
  limit: joi.number().optional(),
  page: joi.number().optional(),
});

const getJobpostsParamType = joi.object({
  status: joi.string().optional(),
  employment_type: joi.string().optional(),
  experience_level: joi.string().optional(),
  location: joi.string().optional(),
  salary_min: joi.number().optional(),
  salary_max: joi.number().optional(),
  currency: joi.string().optional(),
  category: joi.string().optional(),
  created_after: joi.string().optional(),
  created_before: joi.string().optional(),
  search: joi.string().optional(),
  tags: joi.string().optional(),
  sort_by: joi.string().optional(),
  sort_order: joi.string().optional(),
  page: joi.number().optional(),
  limit: joi.number().optional(),
  user_id: joi.string().optional(),
});

const getJobpostsSelfParamType = joi.object({
  recruiter_id: joi.string().required(),
  status: joi.string().optional(),
  employment_type: joi.string().optional(),
  experience_level: joi.string().optional(),
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

  
const getAppliedJobpostsParamType = joi.object({
  worker_id: joi.string().required(),
  status: joi.string().optional(),
  employment_type: joi.string().optional(),
  experience_level: joi.string().optional(),
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
  user_id: joi.string().optional(),
});

const getCategoriesByNameParamType = joi.object({
  name: joi.string().required(),
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

const getJobPostAnswersParamType = joi.object({
  id: joi.string().uuid().optional(),
  job_application_id: joi.string().uuid().optional(),
  question_id: joi.string().uuid().optional(),
  submitted_at_start: joi.date().optional(),
  submitted_at_end: joi.date().optional(),
  search: joi.string().optional(),
  limit: joi.number().integer().min(1).default(10),
  offset: joi.number().integer().min(0).default(0),
  order_by: joi
    .string()
    .valid("submitted_at", "job_application_id", "question_id")
    .default("submitted_at"),
  sort: joi.string().valid("asc", "desc").default("desc"),
});

const getJobApplicationsParamType = joi.object({
  job_post_id: joi.string().uuid().optional(),
  worker_id: joi.string().uuid().optional(),
  application_status_id: joi.number().optional(),
  limit: joi.number().default(10),
  offset: joi.number().default(0),
});

const getOneCurrencyParamType = joi.object({
  code: joi.string().uppercase().optional(),
});

module.exports = {
  getJobpostsByRecruiterIdParamType,
  getJobpostByIdParamType,
  getJobpostsParamType,
  getJobpostsSelfParamType,
  getAppliedJobpostsParamType,
  getJobpostQuestionsParamType,
  getJobPostAnswersParamType,
  getJobApplicationsParamType,
  getOneCurrencyParamType,
  getCategoriesByNameParamType,
};
