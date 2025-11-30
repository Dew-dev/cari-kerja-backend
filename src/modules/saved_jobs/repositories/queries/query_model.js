const joi = require("joi");

const getSavedJobsByWorkerIdParamType = joi.object({
  worker_id: joi.string().required(),
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

const getSavedJobsParamType = joi.object({
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

const getSavedJobsSelfParamType = joi.object({
  worker_id: joi.string().required(),
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

const getSavedJobsByIdParamType = joi.object({
  id: joi.string().required(),
});

module.exports = {
  getSavedJobsByWorkerIdParamType,
  getSavedJobsParamType,
  getSavedJobsSelfParamType,
  getSavedJobsByIdParamType
};
